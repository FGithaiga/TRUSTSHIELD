import ipaddress
import re
from urllib.parse import urlsplit


def extract_url_features(url: str) -> dict:
    """Extract 18 approximate URL-based features for TrustShield 254."""

    if not isinstance(url, str) or not url.strip():
        raise ValueError("Please provide a non-empty URL.")

    url = url.strip()
    parsed = urlsplit(url if "://" in url else f"https://{url}")
    hostname = parsed.hostname or ""

    if not hostname:
        raise ValueError("The URL must contain a valid hostname.")

    domain = hostname.rstrip(".")
    url_length = len(url)
    domain_length = len(domain)
    tld = domain.rsplit(".", 1)[-1] if "." in domain else ""

    try:
        ipaddress.ip_address(domain)
        is_domain_ip = 1
    except ValueError:
        is_domain_ip = 0

    parts = domain.split(".")
    no_of_subdomain = max(len(parts) - 2, 0)

    obfuscated_chars = re.findall(r"%[0-9a-fA-F]{2}", url)
    no_of_obfuscated_char = len(obfuscated_chars)
    has_obfuscation = int(
        bool(obfuscated_chars)
        or "@" in parsed.netloc
        or "//" in parsed.path
    )

    letters = sum(char.isalpha() for char in url)
    digits = sum(char.isdigit() for char in url)
    special_chars = sum(not char.isalnum() for char in url)

    no_of_other_special_chars = max(
        special_chars
        - url.count("/")
        - url.count(":")
        - url.count(".")
        - url.count("=")
        - url.count("?")
        - url.count("&"),
        0
    )

    return {
        "URLLength": url_length,
        "DomainLength": domain_length,
        "IsDomainIP": is_domain_ip,
        "TLDLength": len(tld),
        "NoOfSubDomain": no_of_subdomain,
        "HasObfuscation": has_obfuscation,
        "NoOfObfuscatedChar": no_of_obfuscated_char,
        "ObfuscationRatio": no_of_obfuscated_char / max(url_length, 1),
        "NoOfLettersInURL": letters,
        "LetterRatioInURL": letters / max(url_length, 1),
        "NoOfDegitsInURL": digits,
        "DegitRatioInURL": digits / max(url_length, 1),
        "NoOfEqualsInURL": url.count("="),
        "NoOfQMarkInURL": url.count("?"),
        "NoOfAmpersandInURL": url.count("&"),
        "NoOfOtherSpecialCharsInURL": no_of_other_special_chars,
        "SpacialCharRatioInURL": special_chars / max(url_length, 1),
        "IsHTTPS": int(parsed.scheme.lower() == "https"),
    }
