"""Plain-language explanation of structured findings.

If an OpenAI-compatible LLM endpoint is configured (for example Ollama or vLLM
serving an open-weight Qwen or Llama model), it rewrites the findings in plain
English. Only the structured findings are sent, never the user's full text, and
the reply is rejected if it introduces links or numbers that are not in the
evidence. Without an LLM, or on any failure, a template explanation is used.
"""
import json
import logging
import re

import requests
from django.conf import settings

logger = logging.getLogger("apps.scans.explainer")

SYSTEM_PROMPT = (
    "You explain fraud-risk findings to people in Kenya in plain, calm English. "
    "Use ONLY the findings provided. Do not add new warning signs, do not accuse anyone, "
    "and do not say the content is definitely a scam or definitely safe. "
    "Quote at most two short evidence phrases. Write 2 to 4 sentences, no lists, no markdown."
)
NOUN = {"url": "link", "offer": "offer", "mpesa": "message"}
SUSPICIOUS_TOKEN = re.compile(r"https?://\S+|www\.\S+|\b\d{4,}\b")


def is_enabled():
    return bool(settings.LLM_API_BASE)


def template(scan_type, risk_level, findings):
    noun = NOUN[scan_type]
    if risk_level == "clear" or not findings:
        return (
            "The rule checks did not find strong warning signs. That does not confirm who sent this "
            "or that it is safe, so verify any payment through official channels."
        )
    # Lowercase only the first letter so names like M-PESA and HTTPS keep their case.
    top = "; ".join(f["title"][:1].lower() + f["title"][1:] for f in findings[:3])
    count = len(findings)
    return (
        f"This {noun} shows {count} warning sign{'s' if count != 1 else ''}. The most important: {top}. "
        "These patterns are common in scams, but they are indicators, not proof."
    )


def _grounded(text, findings):
    allowed = " ".join(" ".join(f.get("evidence", [])) for f in findings).lower()
    return all(token.lower() in allowed for token in SUSPICIOUS_TOKEN.findall(text))


def _ask_llm(scan_type, risk_level, category, findings):
    payload = {
        "risk_level": risk_level,
        "category": category,
        "content_type": NOUN[scan_type],
        "findings": [
            {"title": f["title"], "severity": f["severity"], "evidence": f.get("evidence", [])[:2]} for f in findings[:6]
        ],
    }
    headers = {"Content-Type": "application/json"}
    if settings.LLM_API_KEY:
        headers["Authorization"] = f"Bearer {settings.LLM_API_KEY}"
    response = requests.post(
        f"{settings.LLM_API_BASE}/chat/completions",
        headers=headers,
        timeout=settings.LLM_TIMEOUT_SECONDS,
        json={
            "model": settings.LLM_MODEL,
            "temperature": 0.2,
            "max_tokens": 220,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(payload)},
            ],
        },
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()


def explain(scan_type, risk_level, category, findings):
    """Return (explanation, source) where source is "llm" or "template"."""
    if is_enabled() and findings:
        try:
            text = _ask_llm(scan_type, risk_level, category, findings)
            if 40 <= len(text) <= 900 and _grounded(text, findings):
                return text, "llm"
            logger.warning("Discarded LLM explanation that failed validation")
        except Exception as exc:
            logger.warning("LLM explainer unavailable: %s", exc)
    return template(scan_type, risk_level, findings), "template"
