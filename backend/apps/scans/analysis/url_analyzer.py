"""Static link analysis.

Security: this module only parses the URL string. It never resolves DNS or
fetches the link, so user input cannot be used for server-side request forgery.
"""
import ipaddress
import re
from urllib.parse import urlsplit

from .rules import HIGH, LOW, MEDIUM, finding

OFFICIAL_DOMAINS = {
    "safaricom.co.ke", "safaricom.com", "mpesa.co.ke", "airtel.co.ke", "airtelkenya.com", "kcbgroup.com",
    "equitybank.co.ke", "equitygroupholdings.com", "ncbagroup.com", "co-opbank.co.ke", "kra.go.ke",
    "ecitizen.go.ke", "centralbank.go.ke", "google.com", "microsoft.com",
}
# Any government domain under .go.ke is treated as official.
OFFICIAL_SUFFIXES = {"go.ke"}
BRANDS = ["safaricom", "mpesa", "airtel", "kcb", "equity", "ncba", "coop", "kra", "ecitizen", "helb", "nhif"]
RISKY_TLDS = {"xyz", "top", "click", "buzz", "icu", "live", "online", "site", "loan", "win", "info", "rest", "cfd"}
SHORTENERS = {"bit.ly", "tinyurl.com", "cutt.ly", "t.co", "is.gd", "rb.gy", "shorturl.at", "tiny.cc", "ow.ly"}
SECOND_LEVEL_SUFFIXES = {
    "co.ke", "go.ke", "or.ke", "ac.ke", "ne.ke", "sc.ke", "me.ke", "info.ke", "mobi.ke",
    "co.uk", "org.uk", "ac.uk", "com.au", "co.za", "com.ng", "co.tz", "co.ug",
}
LURE_WORDS = re.compile(r"claim|verify|login|update|reward|bonus|free|suspend|unlock|win", re.IGNORECASE)


class InvalidURL(ValueError):
    pass


def registered_domain(host):
    parts = host.split(".")
    if len(parts) >= 3 and ".".join(parts[-2:]) in SECOND_LEVEL_SUFFIXES:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])


def is_official(host):
    if any(host == d or host.endswith("." + d) for d in OFFICIAL_DOMAINS):
        return True
    return any(host.endswith("." + s) for s in OFFICIAL_SUFFIXES)


def _is_ip(host):
    try:
        ipaddress.ip_address(host.strip("[]"))
        return True
    except ValueError:
        return False


def _find_brand(host):
    """Long brand names match anywhere ("safaricomrewards"); short ones must be a whole label ("kra-refund")."""
    tokens = set(re.split(r"[.-]", host))
    compact = host.replace("-", "")
    for brand in BRANDS:
        if (len(brand) >= 5 and brand in compact) or brand in tokens:
            return brand
    return None


def parse(raw):
    raw = (raw or "").strip()
    if not raw or any(c.isspace() for c in raw):
        raise InvalidURL("Enter a single link without spaces, for example https://example.co.ke/page")
    try:
        parts = urlsplit(raw if re.match(r"^[a-z][a-z0-9+.-]*://", raw, re.I) else f"http://{raw}")
        host = (parts.hostname or "").rstrip(".").lower()
    except ValueError as exc:
        raise InvalidURL("That link could not be read. Check it and try again.") from exc
    if parts.scheme not in {"http", "https"}:
        raise InvalidURL("Only http and https links can be checked.")
    if not host or ("." not in host and not _is_ip(host)):
        raise InvalidURL("Enter a valid link, for example https://example.co.ke/page")
    return raw, parts, host


def analyze(raw):
    """Return (findings, url_details) for a link. Raises InvalidURL for unusable input."""
    raw, parts, host = parse(raw)
    is_ip = _is_ip(host)
    labels = host.split(".")
    tld = labels[-1]
    domain = host if is_ip else registered_domain(host)
    official = not is_ip and is_official(host)
    brand = _find_brand(host)
    impersonated = brand if brand and not official else None
    findings = []

    if impersonated:
        findings.append(finding(
            "brand_impersonation", HIGH, f'Uses the name "{brand}" on an unofficial domain',
            f"The domain {domain} contains a well-known brand name but is not one of that organization's official domains.",
            [host], "url",
        ))
    if is_ip:
        findings.append(finding("ip_host", HIGH, "Uses a raw IP address instead of a domain",
                                "Legitimate services rarely ask you to open a bare IP address.", [host], "url"))
    if host in SHORTENERS:
        findings.append(finding("shortener", MEDIUM, "Shortened link hides the real destination",
                                "You cannot see where this link leads until you open it.", [host], "url"))
    if parts.scheme == "http":
        findings.append(finding("no_https", LOW, "Not using HTTPS",
                                "The connection would not be encrypted. Most legitimate login and payment pages use HTTPS.",
                                ["http://"], "url"))
    if not is_ip and tld in RISKY_TLDS:
        findings.append(finding("risky_tld", MEDIUM, f'Domain ending ".{tld}" is common in scam campaigns',
                                "Low-cost domain endings are frequently used for short-lived phishing sites.", [f".{tld}"], "url"))
    if not is_ip and len(labels) > 4:
        findings.append(finding("many_subdomains", MEDIUM, "Unusual subdomain structure",
                                "Several stacked subdomains can be used to make a link look official at a glance.", [host], "url"))
    if any(label.startswith("xn--") for label in labels):
        findings.append(finding("punycode", HIGH, "Contains look-alike international characters",
                                "Punycode domains can imitate familiar names using similar-looking letters.", [host], "url"))
    if "@" in parts.netloc:
        findings.append(finding("at_symbol", HIGH, 'Contains an "@" symbol',
                                'Text before an "@" in a link is ignored by the browser and is a known disguise technique.', ["@"], "url"))
    lure = sorted({m.group(0).lower() for m in LURE_WORDS.finditer(parts.path + "?" + parts.query)})
    if lure and not official:
        findings.append(finding("lure_words", LOW, "Link path uses lure words",
                                'Words like "claim", "verify" or "bonus" in a link are common in phishing campaigns.', lure[:3], "url"))
    if len(raw) > 90:
        findings.append(finding("long_url", LOW, "Very long link", "Long links can hide the real domain among extra text.",
                                [f"{len(raw)} characters"], "url"))

    details = {
        "hostname": host,
        "registered_domain": domain,
        "scheme": parts.scheme,
        "is_https": parts.scheme == "https",
        "is_official_domain": official,
        "impersonated_brand": impersonated,
        "subdomain_count": 0 if is_ip else max(len(labels) - len(domain.split(".")), 0),
        # Domain age needs a WHOIS/RDAP provider; deliberately not queried here.
        "registered_on": None,
    }
    return findings, details
