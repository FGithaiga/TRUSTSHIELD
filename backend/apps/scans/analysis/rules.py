"""Deterministic rule checks for known scam patterns.

Each rule contributes an indicator with the exact text that triggered it.
Rules are evidence, not verdicts: the engine combines them into a risk level.
"""
import re
from dataclasses import dataclass

HIGH, MEDIUM, LOW = "high", "medium", "low"
MAX_EVIDENCE = 3


@dataclass(frozen=True)
class Rule:
    code: str
    pattern: re.Pattern
    severity: str
    title: str
    detail: str
    source: str = "rule"

    def evaluate(self, text):
        evidence = []
        for match in self.pattern.finditer(text):
            snippet = match.group(0).strip()
            if snippet and snippet.lower() not in {e.lower() for e in evidence}:
                evidence.append(snippet)
            if len(evidence) >= MAX_EVIDENCE:
                break
        if not evidence:
            return None
        return finding(self.code, self.severity, self.title, self.detail, evidence, self.source)


def finding(code, severity, title, detail, evidence, source="rule"):
    return {"code": code, "severity": severity, "title": title, "detail": detail, "evidence": list(evidence), "source": source}


def _re(pattern):
    return re.compile(pattern, re.IGNORECASE)


PHONE_PATTERN = _re(r"(?:\+?254|\b0)\s?(?:7|1)\d{2}\s?\d{3}\s?\d{3}\b")
URL_IN_TEXT_PATTERN = _re(
    r"\b(?:https?://|www\.)[^\s<>\"']+"
    r"|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|ke|net|org|xyz|top|click|info|online|site|live|ly)(?:/[^\s<>\"']*)?"
)

MPESA_RULES = [
    Rule(
        "pin_request",
        _re(r"\b(?:pin|otp|one[- ]time (?:password|code)|password|secret code)\b"),
        HIGH,
        "Asks for your PIN, OTP or password",
        "Safaricom and banks never ask for your M-PESA PIN or one-time code by SMS or phone call.",
    ),
    Rule(
        "reversal_request",
        _re(r"revers\w*|by mistake|wrongly sent|kimakosa|rudisha|send (?:it )?back"),
        HIGH,
        "Asks you to reverse or return a payment",
        "Genuine wrong transfers are reversed by the sender through Safaricom. Check your actual M-PESA balance before sending anything back.",
    ),
    Rule(
        "fee_to_claim",
        _re(r"(?:processing|clearance|registration|activation) fee|pay (?:a )?fee|to claim"),
        HIGH,
        "Requests a fee to release money or a prize",
        "Paying to receive a prize or refund is a common advance-fee pattern.",
    ),
    Rule(
        "prize_claim",
        _re(r"you have won|umeshinda|\bwinner\b|congratulations|zawadi|promotion|bonus points?"),
        MEDIUM,
        "Claims you have won a prize or bonus",
        "Unexpected prize messages are frequently used to start a scam.",
    ),
    Rule(
        "urgency",
        _re(r"urgent\w*|immediately|within \d+ (?:minutes?|hours?)|haraka|sasa hivi|tonight|suspended|blocked"),
        MEDIUM,
        "Creates urgency or threatens your account",
        "Pressure to act quickly is used to stop you from checking the facts.",
    ),
    Rule(
        "payment_instruction",
        _re(r"\b(?:send|tuma|pay|lipa)\b[^.]{0,40}?(?:ksh|kes|till|paybill|\d{3,})"),
        MEDIUM,
        "Contains a payment instruction",
        "Verify the recipient independently before sending money.",
    ),
    Rule(
        "phone_number",
        PHONE_PATTERN,
        LOW,
        "Includes a phone number to contact or pay",
        "Scammers often ask you to call or pay a personal number instead of an official channel.",
    ),
    Rule(
        "confirmation_claim",
        _re(r"\bconfirmed\.|you have received"),
        LOW,
        "Looks like an M-PESA confirmation",
        "Message text cannot prove a payment arrived. Check your M-PESA balance or statement directly.",
    ),
]

OFFER_RULES = [
    Rule(
        "upfront_fee",
        _re(
            r"(?:registration|application|processing|training|medical|visa|activation) fee"
            r"|\b(?:pay|send|deposit)\b[^.]{0,30}?(?:to secure|first|before|to reserve|to join)|pay full amount first"
        ),
        HIGH,
        "Asks for payment before you receive anything",
        "Legitimate employers do not charge to apply. Prepayment-only sellers leave you with no recourse.",
    ),
    Rule(
        "unrealistic_return",
        _re(
            r"double your money|guaranteed (?:returns?|profit|income)|\d{2,3}% (?:returns?|profit)"
            r"|earn ksh ?[\d,]+ (?:per|a|every) (?:day|week)"
        ),
        HIGH,
        "Promises unrealistic income or returns",
        "Guaranteed or very high returns are a hallmark of fraudulent schemes.",
    ),
    Rule(
        "no_interview",
        _re(r"no (?:experience|interview|qualifications?)(?: or \w+)? (?:needed|required)|no interview"),
        MEDIUM,
        "No interview or experience required",
        "Real employers assess candidates before hiring.",
    ),
    Rule(
        "informal_contact",
        _re(r"whatsapp only|telegram|dm only|inbox only|contact hr on whatsapp"),
        MEDIUM,
        "Contact only through informal chat apps",
        "Check for an official company website, email domain and physical address.",
    ),
    Rule(
        "urgency",
        _re(r"urgent\w*|limited (?:slots?|stock)|ends tonight|today only|pay now|hurry"),
        MEDIUM,
        "Pressure to decide quickly",
        "Deadlines and limited slots push you to skip verification.",
    ),
    Rule(
        "too_cheap",
        _re(r"brand new [^.]{0,30}for only ksh ?[\d,]+|\b(?:90|80|70)% off"),
        MEDIUM,
        "Price looks far below market value",
        "Compare with established retailers before paying.",
    ),
    Rule(
        "work_from_home",
        _re(r"work from home|online typing|data entry"),
        LOW,
        "Common remote-job scam wording",
        "Remote roles are often genuine, but this wording is frequent in fake job adverts.",
    ),
]


def run(rules, text):
    return [f for f in (rule.evaluate(text) for rule in rules) if f]


def first_link(text):
    match = URL_IN_TEXT_PATTERN.search(text)
    return match.group(0).rstrip(".,;:!?)") if match else None


# --- M-PESA message anatomy -------------------------------------------------
# Genuine confirmations usually follow a fixed layout. Matching it proves
# nothing (scammers copy it), but missing parts are a useful warning sign.
CONFIRMATION_HINT = _re(r"\bconfirmed\b|you have received|\bpaid to\b|\bwithdrawn? ksh")
TRANSACTION_CODE = re.compile(r"^\s*(?=[A-Z0-9]{10}\b)(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{10}\s+Confirmed", re.MULTILINE)
SPACED_AMOUNT = _re(r"\bKsh\s+\d")
COMPACT_AMOUNT = _re(r"\bKsh\d")
BALANCE_LINE = _re(r"new m-?pesa balance is")


def mpesa_anatomy(text):
    """Return (anatomy, findings), or (None, []) if the text is not a transaction confirmation."""
    if not CONFIRMATION_HINT.search(text):
        return None, []
    has_code = bool(TRANSACTION_CODE.search(text))
    amounts_ok = bool(COMPACT_AMOUNT.search(text)) and not SPACED_AMOUNT.search(text)
    has_balance = bool(BALANCE_LINE.search(text))
    checks = [
        {"key": "code", "label": "Starts with a 10-character transaction code", "ok": has_code,
         "detail": "Genuine confirmations begin with a code such as TJK4ABCD12 before the word Confirmed."},
        {"key": "amount", "label": "Amounts written like Ksh1,500.00", "ok": amounts_ok,
         "detail": "M-PESA writes amounts without a space after Ksh."},
        {"key": "balance", "label": "Shows your new M-PESA balance", "ok": has_balance,
         "detail": "Real confirmations end with your new balance and the transaction cost."},
    ]
    findings = []
    if not has_code:
        findings.append(finding("anatomy_no_code", MEDIUM, "Missing the M-PESA transaction code",
                                "Genuine confirmations start with a 10-character transaction code. This one does not.",
                                ["Confirmed"] if re.search(r"confirmed", text, re.I) else []))
    if SPACED_AMOUNT.search(text):
        findings.append(finding("anatomy_amount_format", LOW, "Amount format differs from M-PESA's",
                                "M-PESA usually writes amounts as Ksh1,500.00, without a space.",
                                [m.group(0) for m in SPACED_AMOUNT.finditer(text)][:2]))
    if not has_balance:
        findings.append(finding("anatomy_no_balance", LOW, "No M-PESA balance line",
                                "Real confirmations show your new M-PESA balance.", []))
    passed = sum(c["ok"] for c in checks)
    return {"checks": checks, "passed": passed, "total": len(checks),
            "note": "A message can copy this format perfectly and still be fake. Always check your balance on your own phone."}, findings
