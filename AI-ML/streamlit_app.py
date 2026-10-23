
from pathlib import Path
import sys

import streamlit as st

# ============================================================
# 1. PROJECT PATHS
# ============================================================

# This file is located in TRUSTSHIELD/AI-ML/
PROJECT_DIR = Path(__file__).resolve().parent.parent
AI_ML_DIR = PROJECT_DIR / "AI-ML"
SOURCE_DIR = AI_ML_DIR / "src"
MODELS_DIR = AI_ML_DIR / "models"

# Make the existing model service importable.
sys.path.insert(0, str(SOURCE_DIR))

from model_service import (
    predict_sms,
    predict_phishing_url,
    predict_job_posting,
)

# ============================================================
# 2. PAGE CONFIGURATION
# ============================================================

st.set_page_config(
    page_title="TrustShield 254",
    page_icon="🛡️",
    layout="wide",
)

st.title("🛡️ TrustShield 254")
st.subheader("Detect. Explain. Protect.")

st.write(
    "TrustShield 254 helps users assess suspicious SMS messages, "
    "website URLs, and job advertisements using machine-learning models."
)

st.warning(
    "Prototype notice: predictions may be incorrect. Do not rely on "
    "this application as the sole basis for security or financial "
    "decisions. Never share passwords, PINs, or OTPs."
)

# Display model file availability.
required_models = [
    "phishing_model.pkl",
    "fake_job_model.pkl",
    "fake_job_preprocessor.pkl",
    "sms_spam_model.pkl",
    "sms_vectorizer.pkl",
]

missing_models = [
    model_name
    for model_name in required_models
    if not (MODELS_DIR / model_name).is_file()
]

if missing_models:
    st.error(
        "Some required model files are missing from AI-ML/models/: "
        + ", ".join(missing_models)
    )
    st.info(
        "Check that the trained model files exist before running predictions."
    )

# ============================================================
# 3. CHECKER TABS
# ============================================================

sms_tab, url_tab, job_tab = st.tabs(
    [
        "📩 SMS Checker",
        "🔗 URL Checker",
        "💼 Job Checker",
    ]
)

# ============================================================
# 4. SMS SPAM CHECKER
# ============================================================

with sms_tab:
    st.header("SMS Scam and Spam Checker")

    st.write(
        "Paste a text message to check whether the SMS model classifies "
        "it as spam or ham (not spam)."
    )

    sms_text = st.text_area(
        "SMS message",
        placeholder=(
            "Example: Congratulations! You have won a prize. "
            "Click the link to claim your reward."
        ),
        height=160,
        key="sms_input",
    )

    if st.button(
        "Check SMS",
        key="check_sms",
        type="primary",
    ):
        if not sms_text.strip():
            st.error("Please enter an SMS message.")

        else:
            try:
                with st.spinner("Analysing the SMS message..."):
                    result = predict_sms(sms_text)

                prediction = str(result["prediction"]).strip().lower()

                if prediction == "spam":
                    st.error("Model result: SPAM")

                    st.write(
                        "Safety advice: Treat this message cautiously. "
                        "Avoid clicking suspicious links, sending money, "
                        "or sharing PINs, passwords, and OTPs."
                    )

                elif prediction == "ham":
                    st.success(
                        "Model result: HAM — classified as not spam"
                    )

                    st.write(
                        "This only means the model did not classify "
                        "the message as spam. It does not guarantee "
                        "that the message or sender is trustworthy."
                    )

                else:
                    st.info(
                        f"Model result: {result.get('label', prediction)}"
                    )

                with st.expander("View SMS prediction details"):
                    st.json(result)

            except Exception as exc:
                st.error(
                    "The SMS model could not complete the prediction."
                )
                st.exception(exc)

# ============================================================
# 5. PHISHING URL CHECKER
# ============================================================

with url_tab:
    st.header("Phishing URL Checker")

    st.write(
        "Enter a website URL for an experimental assessment. "
        "This checker does not need to open the website."
    )

    url_text = st.text_input(
        "Website URL",
        placeholder="https://example.com",
        key="url_input",
    )

    st.caption(
        "Do not visit a suspicious website just to test it. "
        "You can enter the URL as text."
    )

    if st.button(
        "Check URL",
        key="check_url",
        type="primary",
    ):
        if not url_text.strip():
            st.error("Please enter a website URL.")

        else:
            try:
                with st.spinner("Analysing URL features..."):
                    result = predict_phishing_url(url_text.strip())

                st.warning(
                    "Experimental prediction only. The current URL feature "
                    "extractor has not been validated against the original "
                    "training feature definitions. Do not treat this result "
                    "as proof that a website is safe or malicious."
                )

                if result["prediction"] == 0:
                    st.error(f"Model result: {result['label']}")

                elif result["prediction"] == 1:
                    st.success(f"Model result: {result['label']}")

                else:
                    st.info(f"Model result: {result['label']}")

                if result.get("warning"):
                    st.write(result["warning"])

                with st.expander("View URL prediction details"):
                    st.json(result)

            except Exception as exc:
                st.error(
                    "The URL model could not process this input. "
                    "The feature extractor may not supply all the "
                    "features expected by the trained model."
                )

                st.exception(exc)

                st.info(
                    "The URL feature extractor and trained model need "
                    "to be checked for compatibility before this checker "
                    "can provide reliable results."
                )

# ============================================================
# 6. FAKE JOB ADVERT CHECKER
# ============================================================

with job_tab:
    st.header("Fake Job Advert Checker")

    st.write(
        "Enter the details available in a job advert. Leave unknown "
        "fields blank. The model's result is an estimate, not proof."
    )

    with st.form("job_form"):
        title = st.text_input("Job title")

        location = st.text_input(
            "Location",
            placeholder="Nairobi, Kenya",
        )

        department = st.text_input("Department")
        salary_range = st.text_input("Salary range")
        company_profile = st.text_area("Company profile")

        description = st.text_area(
            "Job description",
            height=160,
        )

        requirements = st.text_area("Requirements")
        benefits = st.text_area("Benefits")

        col1, col2 = st.columns(2)

        with col1:
            telecommuting_choice = st.selectbox(
                "Remote work",
                ["Unknown", "No", "Yes"],
            )

            logo_choice = st.selectbox(
                "Company logo shown?",
                ["Unknown", "No", "Yes"],
            )

            questions_choice = st.selectbox(
                "Screening questions included?",
                ["Unknown", "No", "Yes"],
            )

            employment_type = st.selectbox(
                "Employment type",
                [
                    "",
                    "Full-time",
                    "Part-time",
                    "Contract",
                    "Temporary",
                    "Other",
                ],
            )

        with col2:
            required_experience = st.selectbox(
                "Required experience",
                [
                    "",
                    "Entry level",
                    "Internship",
                    "Associate",
                    "Mid-Senior level",
                    "Director",
                    "Executive",
                    "Other",
                ],
            )

            required_education = st.selectbox(
                "Required education",
                [
                    "",
                    "High School or equivalent",
                    "Vocational",
                    "Bachelor's Degree",
                    "Master's Degree",
                    "Doctorate",
                    "Unspecified",
                    "Other",
                ],
            )

            industry = st.text_input("Industry")
            function = st.text_input("Job function")

        submitted = st.form_submit_button(
            "Check Job Advert",
            type="primary",
        )

    if submitted:
        required_text = [
            title,
            description,
            requirements,
            company_profile,
        ]

        if not any(value.strip() for value in required_text):
            st.error(
                "Enter at least a job title, description, requirements, "
                "or company profile."
            )

        else:
            posting = {
                "title": title,
                "location": location,
                "department": department,
                "salary_range": salary_range,
                "company_profile": company_profile,
                "description": description,
                "requirements": requirements,
                "benefits": benefits,
                "telecommuting": int(
                    telecommuting_choice == "Yes"
                ),
                "has_company_logo": int(
                    logo_choice == "Yes"
                ),
                "has_questions": int(
                    questions_choice == "Yes"
                ),
                "employment_type": employment_type,
                "required_experience": required_experience,
                "required_education": required_education,
                "industry": industry,
                "function": function,
            }

            try:
                with st.spinner("Analysing the job advert..."):
                    result = predict_job_posting(posting)

                if result["prediction"] == 1:
                    st.error(
                        "Model result: POTENTIALLY FRAUDULENT"
                    )

                    st.write(
                        "Safety advice: Verify the employer using "
                        "independently obtained official contact details. "
                        "Be cautious of application fees, deposits, "
                        "requests for passwords, or requests for financial "
                        "and identity information."
                    )

                else:
                    st.success(
                        "Model result: LIKELY LEGITIMATE according to the model"
                    )

                    st.write(
                        "This is not proof that the employer or job advert "
                        "is genuine. Verify the company, contact details, "
                        "and offer independently."
                    )

                with st.expander("View job prediction details"):
                    st.json(result)

            except Exception as exc:
                st.error(
                    "The job model could not complete the prediction."
                )
                st.exception(exc)

# ============================================================
# 7. FOOTER
# ============================================================

st.divider()

st.caption(
    "TrustShield 254 | Detect. Explain. Protect. "
    "A prototype for scam awareness and digital trust. "
    "Predictions are not guarantees of safety."
)
