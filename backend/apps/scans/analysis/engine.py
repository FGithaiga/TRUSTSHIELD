"""Orchestrates rule checks, link analysis, ML models and the explainer into one result.

The result dict is the API contract consumed by the React frontend
(see frontend/src/lib/api.js and components/scan/ScanResult.jsx).
"""
from . import explainer, indicators, ml, rules, url_analyzer
from .rules import HIGH, LOW, MEDIUM, finding

SCAN_TYPES = ("mpesa", "url", "offer")
OFFER_TYPES = ("job", "shopping", "investment", "other")

WEIGHT = {HIGH: 34, MEDIUM: 17, LOW: 7}
HIGH_SCORE, CAUTION_SCORE = 55, 22
SEVERITY_ORDER = {HIGH: 0, MEDIUM: 1, LOW: 2}

CATEGORY_BY_CODE = [
    ("pin_request", "PIN or OTP request"),
    ("reversal_request", "Fake reversal request"),
    ("fee_to_claim", "Prize or promotion scam"),
    ("prize_claim", "Prize or promotion scam"),
    ("brand_impersonation", "Brand impersonation link"),
    ("ip_host", "Suspicious link structure"),
    ("punycode", "Suspicious link structure"),
    ("at_symbol", "Suspicious link structure"),
    ("shortener", "Shortened link"),
    ("upfront_fee", "Advance-fee offer"),
    ("unrealistic_return", "Unrealistic investment return"),
    ("too_cheap", "Prepayment shopping scam"),
    ("payment_instruction", "Suspicious payment instruction"),
]
NO_CATEGORY = "No category"

ACTIONS = {
    "high": [
        "Do not send money, share your PIN or open any link in this message.",
        "Check your mobile money balance directly on your phone. Do not rely on the message text.",
        "Forward suspicious SMS messages to 333 to report them to Safaricom.",
        "If you have already paid or shared details, use the Incident Assistant now.",
    ],
    "caution": [
        "Pause before acting. Contact the person or company through a channel you already trust.",
        "Confirm any payment by checking your own mobile money statement.",
        "Do not share your PIN, OTP or ID details in response to this message.",
    ],
    "clear": [
        "No strong warning signs were found, but the sender has not been verified.",
        "Use the Before You Pay checklist for any payment involved.",
    ],
}
URL_ACTIONS = {
    "high": [
        "Do not open this link or enter any details on it.",
        "Visit the organization by typing its official address yourself.",
        "Forward the message that contained the link to 333 if it came by SMS.",
        "If you already entered details, use the Incident Assistant now.",
    ],
}
SUMMARY = {
    "high": "Multiple strong warning signs found.",
    "caution": "Some warning signs found. Verify before acting.",
    "clear": "No obvious warning signs detected.",
}
BASE_LIMITATIONS = [
    "This is a risk assessment, not proof of fraud or safety.",
    "Message text alone cannot confirm whether Safaricom sent a message or whether a transaction completed.",
    "Model predictions are experimental and have not been validated for real-world use.",
]


class AnalysisError(ValueError):
    """Raised for input that cannot be analyzed; the message is safe to show to users."""


def _model_finding(model_result, code, severity, title, detail):
    return finding(code, severity, title, detail, [model_result["label"]], "model")


def _analyze_mpesa(text, limitations):
    findings = rules.run(rules.MPESA_RULES, text)
    anatomy, anatomy_findings = rules.mpesa_anatomy(text)
    findings.extend(anatomy_findings)
    url_details = None
    link = rules.first_link(text)
    if link:
        try:
            link_findings, url_details = url_analyzer.analyze(link)
            strong = any(f["severity"] == HIGH for f in link_findings)
            brand = url_details["impersonated_brand"]
            findings.append(finding(
                "contains_link", HIGH if strong else MEDIUM, "Contains a link",
                f'The link uses "{brand}" on an unofficial domain.' if brand else "Do not open links in unexpected payment messages.",
                [link], "url",
            ))
        except url_analyzer.InvalidURL:
            pass

    model = ml.classify_sms(text)
    # A message that matches the genuine confirmation layout, with nothing else
    # suspicious, is exactly what the generic spam model tends to mislabel.
    well_formed = anatomy and anatomy["passed"] == anatomy["total"]
    only_benign = all(f["code"] == "confirmation_claim" for f in findings)
    if model and model["flagged"] and well_formed and only_benign:
        limitations.append("The SMS spam model flagged this, but the message matches the genuine M-PESA layout and no rule found anything, so the model result was not counted.")
    elif model and model["flagged"]:
        findings.append(_model_finding(
            model, "model_sms_spam", MEDIUM, "Resembles known spam messages",
            "The SMS classifier matched this text to patterns from messages labelled as spam.",
        ))
    return findings, url_details, model, anatomy


def _analyze_url(text, limitations):
    try:
        findings, url_details = url_analyzer.analyze(text)
    except url_analyzer.InvalidURL as exc:
        raise AnalysisError(str(exc)) from exc

    model = ml.classify_url(text)
    if model and model["flagged"]:
        if url_details["is_official_domain"]:
            limitations.append("The experimental URL model flagged this link, but it matches a known official domain, so the model result was not counted.")
        elif findings:
            findings.append(_model_finding(
                model, "model_phishing_url", LOW, "Experimental URL model also flagged this link",
                "The phishing model agreed with the link checks. Its URL features are not yet validated, so it counts as a minor signal.",
            ))
        else:
            limitations.append("The experimental URL model flagged this link without support from the link checks, so it was not counted.")
    return findings, url_details, model, None


def _analyze_offer(text, offer_type, limitations):
    findings = rules.run(rules.OFFER_RULES, text)
    model = ml.classify_job(text) if offer_type == "job" else None
    if model and model["flagged"]:
        if findings:
            findings.append(_model_finding(
                model, "model_fake_job", MEDIUM, "Fake-job classifier also flagged this offer",
                "The classifier trained on fraudulent job adverts agreed with the rule findings.",
            ))
        else:
            limitations.append("The fake-job classifier flagged this advert without support from the rule checks, so it was not counted. It tends to over-flag pasted text.")
    if offer_type != "job":
        limitations.append("No trained model covers this offer type yet. The result is based on rule checks.")
    return findings, None, model, None


# Requests no legitimate provider ever makes: with any supporting sign they are always high risk.
CRITICAL_CODES = {"pin_request"}


def _risk(findings):
    score = sum(WEIGHT[f["severity"]] for f in findings)
    score = min(98, max(3, score))
    high_count = sum(1 for f in findings if f["severity"] == HIGH)
    critical = any(f["code"] in CRITICAL_CODES for f in findings) and len(findings) >= 2
    if score >= HIGH_SCORE or high_count >= 2 or critical:
        level = "high"
    elif score >= CAUTION_SCORE or high_count == 1:
        level = "caution"
    else:
        level = "clear"
    return level, score


OFFER_CATEGORY = {"job": "Advance-fee job offer", "shopping": "Prepayment shopping scam", "investment": "Unrealistic investment return"}


def _category(level, findings, offer_type=None):
    if level == "clear":
        return NO_CATEGORY
    codes = {f["code"] for f in findings}
    if offer_type in OFFER_CATEGORY and codes & {"upfront_fee", "unrealistic_return", "too_cheap"}:
        return OFFER_CATEGORY[offer_type]
    return next((label for code, label in CATEGORY_BY_CODE if code in codes), "General suspicious content")


def preview_for(scan_type, content, offer_type, url_details):
    if scan_type == "url":
        return url_details["hostname"] if url_details else "Link"
    if scan_type == "mpesa":
        return f"SMS message, {len(content)} characters"
    return f"{(offer_type or 'other').capitalize()} offer, {len(content)} characters"


def analyze(scan_type, content, offer_type=None, community=None):
    """Run every check. `community(indicators) -> matches` adds community memory when provided."""
    if scan_type not in SCAN_TYPES:
        raise AnalysisError("Choose mpesa, url or offer.")
    content = (content or "").strip()
    if not content:
        raise AnalysisError("Enter a link to check." if scan_type == "url" else "Paste the text you want to check.")

    limitations = list(BASE_LIMITATIONS)
    if scan_type == "mpesa":
        findings, url_details, model, anatomy = _analyze_mpesa(content, limitations)
    elif scan_type == "url":
        findings, url_details, model, anatomy = _analyze_url(content, limitations)
    else:
        offer_type = offer_type if offer_type in OFFER_TYPES else "other"
        findings, url_details, model, anatomy = _analyze_offer(content, offer_type, limitations)

    found_indicators = indicators.extract(scan_type, content, url_details)
    community_matches = community(found_indicators) if community else []
    findings.extend(indicators.findings_for(community_matches))

    expects_model = scan_type != "offer" or offer_type == "job"
    if expects_model and model is None:
        limitations.append("The ML model was unavailable for this check. The result is based on rule and link checks only.")

    findings.sort(key=lambda f: SEVERITY_ORDER[f["severity"]])
    level, score = _risk(findings)
    category = _category(level, findings, offer_type if scan_type == "offer" else None)
    explanation, source = explainer.explain(scan_type, level, category, findings)
    actions = URL_ACTIONS.get(level) if scan_type == "url" and level in URL_ACTIONS else ACTIONS[level]

    rule_version = "rules@2026.10"
    model_version = f"{rule_version}+{model['version']}" if model else rule_version

    return {
        "scan_type": scan_type,
        "offer_type": offer_type if scan_type == "offer" else None,
        "risk_level": level,
        "risk_score": score,
        "risk_score_is_heuristic": True,
        "scam_category": category,
        "summary": SUMMARY[level],
        "findings": findings,
        "url_details": url_details,
        "model_result": model,
        "explanation": explanation,
        "explanation_source": source,
        "recommended_actions": actions,
        "limitations": limitations,
        "model_version": model_version,
        "preview": preview_for(scan_type, content, offer_type, url_details),
        "anatomy": anatomy,
        "community_matches": community_matches,
        # Raw indicators for recording sightings; removed before anything is stored or returned.
        "_indicators": found_indicators,
    }
