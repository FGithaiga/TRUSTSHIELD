# ============================================================
# TRUSTSHIELD 254 - STREAMLIT FRONTEND
# Communicates with the Django REST API
# ============================================================

import os
from urllib.parse import urlparse

import requests
import streamlit as st


# ============================================================
# 1. CONFIGURATION
# ============================================================

st.set_page_config(
    page_title="TrustShield 254",
    page_icon="🛡️",
    layout="wide",
)

API_URL = os.getenv(
    "TRUSTSHIELD_API_URL",
    "http://127.0.0.1:8000/api/scans/analyze/",
)

REQUEST_TIMEOUT = 30


# ============================================================
# 2. PAGE HEADER
# ============================================================

st.title("🛡️ TrustShield 254")
st.subheader("Detect. Explain. Protect.")

st.write(
    "TrustShield 254 helps users assess suspicious SMS messages, "
    "website URLs, and job advertisements using machine-learning "
    "models served by the Django backend."
)

st.warning(
    "Prototype notice: predictions may be incorrect. Do not rely on "
    "this application as the sole basis for security or financial "
    "decisions. Never share passwords, PINs, or OTPs."
)


# ============================================================
# 3. API COMMUNICATION
# ============================================================

def analyze_with_backend(scan_type, content):
    """
    Send a scan request to the Django API.

    Assumed request format:
        {
            "scan_type": "mpesa" | "url" | "offer",
            "content": "text to analyze"
        }

    Update this payload if your Django view expects different
    field names or a different request structure.
    """

    payload = {
        "scan_type": scan_type,
        "content": content,
    }

    try:
        response = requests.post(
            API_URL,
            json=payload,
            timeout=REQUEST_TIMEOUT,
        )

        if response.status_code in (401, 403):
            st.error(
                "The backend rejected the request. "
                "Check the API authentication and permissions."
            )
            return None

        if response.status_code == 400:
            st.error(
                "The backend rejected the submitted data. "
                "Check the API request format and required fields."
            )
            with st.expander("View API validation details"):
                st.code(response.text[:2000])
            return None

        response.raise_for_status()

        try:
            result = response.json()
        except ValueError:
            st.error("The backend returned an invalid JSON response.")
            return None

        if not isinstance(result, dict):
            st.error("The backend returned an unexpected response format.")
            return None

        return result

    except requests.exceptions.Timeout:
        st.error(
            "The scan timed out. Please check the backend and try again."
        )

    except requests.exceptions.ConnectionError:
        st.error(
            "Cannot connect to the Django backend. Start the backend "
            "and confirm that TRUSTSHIELD_API_URL is correct."
        )

    except requests.exceptions.RequestException as exc:
        st.error("The scan request could not be completed.")
        st.caption(f"Technical detail: {exc}")

    return None


# ============================================================
# 4. DISPLAY BACKEND RESULTS
# ============================================================

def display_result(result, scan_label):
    """Display the analysis returned by the Django backend."""

    st.subheader(f"{scan_label} Results")

    # Read common fields from the existing backend response.
    model_result = result.get("model_result", result.get("prediction"))
    model_version = result.get("model_version")
    risk_score = result.get("risk_score")
    findings = result.get("findings", [])
    recommendations = result.get("recommended_actions", [])

    # Display the model's result.
    if model_result is not None:
        if isinstance(model_result, (dict, list)):
            st.write("**Model result:**")
            st.json(model_result)
        else:
            st.write(f"**Model result:** {model_result}")

    # Display the risk score if provided.
    if risk_score is not None:
        try:
            score = float(risk_score)

            # Assumption: scores between 0 and 1 are probabilities;
            # scores above 1 are already expressed as percentages.
            if 0 <= score <= 1:
                score *= 100

            if 0 <= score <= 100:
                st.metric("Risk Score", f"{score:.1f}%")
                st.progress(score / 100)
            else:
                st.metric("Risk Score", str(risk_score))

        except (ValueError, TypeError):
            st.write(f"**Risk score:** {risk_score}")

    # Display findings.
    st.write("**Findings**")

    if isinstance(findings, str):
        st.write(findings)
    elif isinstance(findings, list) and findings:
        for finding in findings:
            if isinstance(finding, dict):
                title = finding.get("title", finding.get("name", "Finding"))
                description = finding.get(
                    "description",
                    finding.get("message", ""),
                )
                st.write(f"- **{title}:** {description}")
            else:
                st.write(f"- {finding}")
    elif isinstance(findings, dict) and findings:
        st.json(findings)
    else:
        st.write("No findings were returned by the backend.")

    # Display safety recommendations.
    st.write("**Recommended Actions**")

    if isinstance(recommendations, str):
        st.write(recommendations)
    elif isinstance(recommendations, list) and recommendations:
        for recommendation in recommendations:
            if isinstance(recommendation, dict):
                recommendation = recommendation.get(
                    "description",
                    recommendation.get("message", str(recommendation)),
                )
            st.write(f"- {recommendation}")
    elif isinstance(recommendations, dict) and recommendations:
        st.json(recommendations)
    else:
        st.write(
            "No recommendations were returned. Verify the source "
            "independently before taking action."
        )

    # Keep the complete API response available for debugging.
    with st.expander("View complete prediction details"):
        st.json(result)

    if model_version:
        st.caption(f"Model version: {model_version}")


# ============================================================
# 5. CHECKER TABS
# ============================================================

sms_tab, url_tab, job_tab = st.tabs(
    [
        "📩 SMS Checker",
        "🔗 URL Checker",
        "💼 Job Checker",
    ]
)


# ============================================================
# 6. SMS SCAM CHECKER
# ============================================================

with sms_tab:
    st.header("SMS Scam and Spam Checker")

    st.write(
        "Paste a suspicious SMS message to assess its potential risk."
    )

    sms_text = st.text_area(
        "SMS message",
        placeholder=(
            "Example: Congratulations! You have won 100,000 KES..."
        ),
        height=140,
        key="sms_input",
    )

    if st.button("Check SMS", key="check_sms", type="primary"):
        if not sms_text.strip():
            st.error("Please enter an SMS message.")

        else:
            with st.spinner("Sending SMS for analysis..."):
                # Assumes the Django API uses "mpesa" for SMS scans.
                result = analyze_with_backend(
                    scan_type="mpesa",
                    content=sms_text.strip(),
                )

            if result is not None:
                display_result(result, "SMS Scam and Spam")


# ============================================================
# 7. PHISHING URL CHECKER
# ============================================================

with url_tab:
    st.header("Phishing URL Checker")

    st.write(
        "Enter a website URL to assess its potential phishing risk."
    )

    url_text = st.text_input(
        "Website URL",
        placeholder="https://example.com",
        key="url_input",
    )

    if st.button("Check URL", key="check_url", type="primary"):
        if not url_text.strip():
            st.error("Please enter a website URL.")

        else:
            candidate_url = url_text.strip()

            # Accept URLs with or without an explicitly supplied scheme.
            if "://" not in candidate_url:
                candidate_url = "https://" + candidate_url

            parsed_url = urlparse(candidate_url)

            if (
                parsed_url.scheme not in ("http", "https")
                or not parsed_url.hostname
                or any(char.isspace() for char in candidate_url)
            ):
                st.error("Please enter a valid HTTP or HTTPS URL.")

            else:
                with st.spinner("Sending URL for analysis..."):
                    result = analyze_with_backend(
                        scan_type="url",
                        content=candidate_url,
                    )

                if result is not None:
                    display_result(result, "Phishing URL")


# ============================================================
# 8. FAKE JOB ADVERT CHECKER
# ============================================================

with job_tab:
    st.header("Fake Job Advert Checker")

    st.write(
        "Enter the details available in a job advert to assess "
        "its potential legitimacy."
    )

    with st.form("job_form"):
        title = st.text_input("Job title")
        company_profile = st.text_area("Company profile")
        description = st.text_area("Job description", height=140)
        requirements = st.text_area("Requirements")

        submitted = st.form_submit_button(
            "Check Job Advert",
            type="primary",
        )

    if submitted:
        if not any(
            value.strip()
            for value in [
                title,
                company_profile,
                description,
                requirements,
            ]
        ):
            st.error(
                "Please enter at least a job title, description, "
                "requirements, or company profile."
            )

        else:
            # Combine the fields into one text input for the API.
            # This assumes the Django endpoint accepts job details
            # as text in its "content" field.
            posting = (
                f"Job title: {title.strip()}\n"
                f"Company profile: {company_profile.strip()}\n"
                f"Job description: {description.strip()}\n"
                f"Requirements: {requirements.strip()}"
            )

            with st.spinner("Sending job advert for analysis..."):
                result = analyze_with_backend(
                    scan_type="offer",
                    content=posting,
                )

            if result is not None:
                display_result(result, "Fake Job Advert")


# ============================================================
# 9. FOOTER
# ============================================================

st.divider()

st.caption(
    "TrustShield 254 | Detect. Explain. Protect. "
    "A prototype for digital trust in Kenya."
)

st.caption(
    "Always verify suspicious messages, websites, and job offers "
    "independently. A low risk score does not guarantee safety."
)