
# 🛡️ TRUSTSHIELD 254: AI-POWERED COMMUNITY SCAM INTELLIGENCE AND DIGITAL TRUST PLATFORM

<div align="center">

<img src="Images/TrustShield_254.png" alt="TrustShield 254 - AI-Powered Community Scam Intelligence Platform" width="900"/>

### AI-Powered Community Scam Intelligence & Digital Trust Platform

*Check before you click. Verify before you pay. Report to protect others.*

</div>

---

## 📌 PROJECT OVERVIEW

TrustShield 254 is an AI-powered cybersecurity and digital-trust project designed to help Kenyan users identify potentially suspicious online activities before they click links, pay for products, accept job offers, or share personal information.

The project explores machine learning, natural language processing (NLP), and community-based reporting to analyze suspicious messages, URLs, job advertisements, and online marketplace listings.

The intended platform will generate risk assessments, highlight potential warning signs, and provide practical safety recommendations. Its planned community intelligence component will help identify repeated indicators across user reports, making it easier to recognize possible scam patterns.

The current development stage focuses on preparing datasets, training and evaluating machine-learning models, saving trained artifacts, and implementing a reusable Python model service.

**Current prototype capabilities:**
- Phishing URL prediction using URL-derived features.
- SMS spam classification using TF-IDF and Logistic Regression.
- Fake job posting classification using a preprocessing pipeline and Logistic Regression.
- Saved models and preprocessing artifacts that can be loaded and reused.
- A preliminary dataset containing synthetic community scam-report examples.

The complete web application, including the Flask backend, frontend, and integrated community reporting system, remains planned work.

## ❗ PROBLEM STATEMENT

The growth of digital commerce, online recruitment, and mobile financial services has created more opportunities for cybercriminals to exploit unsuspecting users through phishing, fraudulent job advertisements, fake online sellers, impersonation, and suspicious payment requests.

Many users lack the technical knowledge required to distinguish legitimate digital interactions from potentially fraudulent ones. Furthermore, information about suspicious contacts, websites, and advertisements is often scattered across different platforms, making it difficult to identify recurring scam patterns.

Detection tools may focus on individual threats, such as malicious URLs or spam messages, without combining these findings with community-reported information.

Therefore, there is a need for an accessible and intelligent platform that analyzes suspicious digital content, connects related community reports, explains potential risks, and provides appropriate safety recommendations.

TrustShield 254 seeks to address this challenge through an integrated AI-powered and community-driven digital-trust solution.

## 🎯 OBJECTIVES

### General Objective

To develop an AI-powered community scam intelligence platform that helps users identify suspicious digital content, recognize recurring scam indicators, and make informed decisions when interacting with online services.

### Specific Objectives

1. To develop machine-learning models capable of analyzing suspicious messages, URLs, and job advertisements.
2. To identify potential phishing attempts, fraudulent recruitment offers, suspicious payment requests, and other common digital scam indicators.
3. To implement a community reporting system that enables users to submit suspicious content and share relevant warning signs.
4. To develop a community intelligence mechanism that identifies repeated indicators across reports and highlights potential relationships between suspicious activities.
5. To generate explainable risk assessments that communicate detected warning signs, uncertainty, and recommended safety actions.
6. To evaluate detection models using appropriate machine-learning metrics, including precision, recall, F1-score, and confusion matrices.
7. To promote digital safety awareness and responsible online behavior among Kenyan shoppers, job seekers, and mobile-money users.

## 📂 DATA DESCRIPTION

The project currently contains four datasets used for model development and preliminary workflow exploration.

### 1. Phishing URL Dataset

**File:** `Data/Phishing_URL_Dataset.csv`

- **Dimensions:** 235,795 rows × 56 columns.
- **Purpose:** Classification of phishing and legitimate URLs.
- **Target column:** `label`.
- **Label interpretation:** `0` = phishing URL; `1` = legitimate URL in the current notebook workflow.
- **Modelling approach:** HistGradientBoostingClassifier using URL-only features in the domain-grouped development workflow.

The dataset contains URL-related and webpage-derived features. The reusable URL service currently extracts 18 approximate URL-only features.

**Limitation:** The standalone feature extractor has not yet been validated feature-by-feature against the original training feature definitions. Its predictions must therefore be treated as experimental.

### 2. Fake Job Postings Dataset

**File:** `Data/fake_job_postings.csv`

- **Dimensions:** 17,879 rows × 18 columns.
- **Purpose:** Classification of fraudulent and legitimate job advertisements.
- **Target column:** `fraudulent`.
- **Label interpretation:** `0` = legitimate posting; `1` = fraudulent posting.
- **Modelling approach:** Logistic Regression with a fitted preprocessing pipeline.

This dataset supports the investigation of patterns in job-posting text and other descriptive fields that may be associated with fraudulent recruitment.

### 3. SMS Spam Collection

**File:** `Data/SMSSpamCollection`

- **Number of messages:** 5,572.
- **Purpose:** Classification of spam and ordinary SMS messages.
- **Labels:** `spam` and `ham`.
- **Modelling approach:** TF-IDF vectorization followed by Logistic Regression.

The model transforms message text into numerical features before predicting the message class.

### 4. Community Scam Reports Dataset

**File:** `Data/community_scam_reports.csv`

- **Number of examples:** 10 synthetic records.
- **Purpose:** Preliminary exploration of a future community reporting and scam intelligence workflow.

These examples are synthetic demonstration data. They are not verified reports of real scams and should not be presented as evidence of actual incidents.

### Data Governance

Dataset sources, licences, attribution requirements, and permitted uses should be documented before public release or redistribution.

## 📊 EXPLORATORY DATA ANALYSIS (EDA)

The current notebook work includes loading datasets, inspecting their dimensions and structure, examining target labels, and preparing features for machine-learning experiments.

### Areas Explored

- Dataset dimensions and column structures.
- Target labels and their meanings.
- URL-related and structured features.
- Text preparation for SMS classification.
- Text and non-text preprocessing for job advertisements.
- Preparation of model inputs and evaluation outputs.

### Feature Preparation

**SMS spam detection:** TF-IDF converts message text into numerical features suitable for Logistic Regression.

**Fake job detection:** A fitted preprocessing pipeline transforms the expected job-posting fields into the representation used by the classifier.

**Phishing URL detection:** The model-service helper extracts 18 approximate URL-only features.

### Further EDA Required

The next analysis stage should investigate missing values, class distributions, duplicate records, domain overlap, potential data leakage, and the extent to which evaluation data represents unseen real-world examples.

## 🧠 MODEL DEVELOPMENT AND EVALUATION

Three machine-learning detection tasks have been explored.

### 1. SMS Spam Detection

The SMS classifier uses TF-IDF vectorization and Logistic Regression.

| Evaluation metric | Recorded result |
|---|---:|
| Accuracy | 97.76% |
| Spam precision | 90.79% |
| Spam recall | 92.62% |
| Spam F1-score | 91.69% |

These are the recorded held-out development results. They do not guarantee the same performance on messages from other sources or in real-world conditions.

### 2. Fake Job Detection

The fake-job classifier uses a fitted preprocessing pipeline and Logistic Regression.

| Evaluation metric | Recorded result |
|---|---:|
| Accuracy | 97.79% |
| Fraud precision | 70.26% |
| Fraud recall | 94.22% |
| Fraud F1-score | 80.49% |

The recorded confusion matrix was:

`[[3334, 69], [10, 163]]`

The class order was legitimate first and fraudulent second.

The fraud recall indicates that the model identified a high proportion of fraudulent examples in the evaluated dataset. However, the lower fraud precision indicates that some postings classified as fraudulent were legitimate within that evaluation.

### 3. Phishing URL Detection

The phishing URL experiments used a HistGradientBoostingClassifier and a domain-grouped development workflow.

High accuracy was recorded in the development experiments, including:

- **99.7945%** for the domain-grouped URL-only model.
- **99.9809%** for the domain-grouped full-feature model excluding `URLSimilarityIndex`.

These figures are specific to the recorded experiments. They must not be interpreted as proof of real-world reliability.

The full-feature model is not the same as the saved URL-only model service. The standalone URL feature extractor uses approximate calculations that still require validation against the original training definitions.

Potential data leakage, dataset-specific patterns, duplicates, and differences between development data and new URLs must be investigated before making stronger performance claims.

### Interpreting the Metrics

Accuracy measures the proportion of evaluated examples classified correctly. Precision measures how often predictions for a class were correct, while recall measures how many actual examples of that class were identified. The F1-score balances precision and recall.

For scam detection, both false positives and false negatives matter. A model may incorrectly flag legitimate content or fail to flag a suspicious message. Evaluation should therefore consider the specific risks associated with each error type.

## 🧪 SAMPLE PREDICTION TESTS

The saved models and preprocessing artifacts were loaded successfully during local testing.

### SMS Spam Test

A sample message claiming that the recipient had won a prize and should click a link was classified as:

```python
{
    "prediction": "spam",
    "label": "SPAM"
}
```

### Ordinary SMS Test

A sample message about arriving at school at 9 AM was classified as:

```python
{
    "prediction": "ham",
    "label": "HAM"
}
```

### Fake Job Test

A sample job advertisement mentioned work-from-home income and requested a registration fee. The model returned:

```python
{
    "prediction": 0,
    "label": "Likely legitimate job posting",
    "validated_for_real_world_use": False
}
```

This result demonstrates an important limitation: the model did not flag the sample despite the potential warning sign. A request for an upfront registration fee should be independently investigated.

These sample tests demonstrate that the functions can return predictions. They do not prove that the models are generally reliable or that similar content is safe.

## 💾 SAVED MODEL ARTIFACTS

The following artifacts have been saved under `AI-ML/models/`:

```text
AI-ML/models/
├── phishing_model.pkl
├── fake_job_model.pkl
├── fake_job_preprocessor.pkl
├── sms_spam_model.pkl
└── sms_vectorizer.pkl
```

The artifacts were successfully loaded during local testing.

### Reusable Model Service

The following source files have been implemented:

```text
AI-ML/src/
├── model_service.py
└── url_features.py
```

`model_service.py` loads the saved artifacts and exposes prediction functions for phishing URLs, SMS messages, and job postings.

`url_features.py` extracts 18 approximate URL-only features for the phishing URL service.

## 🗂️ PROJECT STRUCTURE

```text
TRUSTSHIELD/
├── AI-ML/
│   ├── models/
│   ├── notebooks/
│   │   └── index.ipynb
│   └── src/
│       ├── model_service.py
│       └── url_features.py
├── Data/
│   ├── Phishing_URL_Dataset.csv
│   ├── fake_job_postings.csv
│   ├── SMSSpamCollection
│   └── community_scam_reports.csv
├── Images/
│   └── TrustShield_254.png
├── backend/          # Planned backend integration
├── frontend/         # Planned user interface
├── tests/            # Further automated tests planned
├── requirements.txt
├── .gitignore
└── README.md
```

The saved models, model-service source files, and notebook form the current machine-learning foundation. The complete backend, frontend, and end-to-end application integration remain future development tasks.

## 🧰 TECHNOLOGIES AND TOOLS

The current development work uses:

- **Python** — machine-learning and model-service implementation.
- **Pandas** — dataset loading and manipulation.
- **Scikit-learn** — classification models, preprocessing, TF-IDF, and evaluation.
- **Joblib** — saving and loading trained model artifacts.
- **Jupyter Notebook** — experimentation and model evaluation.
- **Git and GitHub** — version control and project collaboration.

Flask backend endpoints and a frontend are planned, but the integrated web application has not yet been completed.

## 🧠 CONCLUSIONS

TrustShield 254 has established a machine-learning foundation for a broader community scam intelligence and digital-trust platform.

The completed work includes dataset exploration, model training and evaluation, saved model artifacts, and a reusable Python prediction service. Sample SMS tests returned the expected labels, while the fake-job test revealed that the model can return a misleading classification even when a warning sign is present.

The phishing URL experiments produced high development metrics, but the URL feature extraction process remains experimental and requires further validation.

The project is ready for continued development, with data validation, repeatable testing, and backend integration as important next steps. The complete community reporting and web application features should be considered planned rather than completed.

## 💡 RECOMMENDATIONS

1. **Validate URL feature extraction:** Confirm that all 18 features match the original training feature definitions.
2. **Review evaluation methodology:** Investigate duplicates, domain overlap, class distributions, and potential data leakage.
3. **Test with unseen data:** Evaluate performance on external examples that better represent real-world usage.
4. **Expand automated testing:** Test empty inputs, missing fields, malformed URLs, and model-loading failures.
5. **Implement the backend:** Expose the existing model-service functions through a tested Flask API.
6. **Develop the frontend:** Create a user-friendly interface and integrate it with the backend.
7. **Develop community intelligence:** Establish reporting, moderation, verification, and repeated-indicator analysis procedures.
8. **Improve explainability:** Show potential warning signs and practical safety advice without overstating model certainty.
9. **Protect user privacy:** Minimize collection of sensitive information and establish secure handling procedures.
10. **Document data provenance:** Add original dataset references, licences, attribution, and permitted-use details.

## 🔐 RESPONSIBLE USE AND LIMITATIONS

TrustShield 254 is an experimental prototype and should not be used as the sole basis for financial, employment, or security decisions.

- A `HAM` prediction does not guarantee that a message is safe.
- A “Likely legitimate job posting” prediction does not verify an employer or vacancy.
- A phishing or fraud prediction is not conclusive proof of wrongdoing.
- The URL feature extractor has not been fully validated against the original training definitions.
- Development evaluation metrics may not generalize to new threats.
- Synthetic community reports must not be presented as verified incidents.

Users should independently verify website domains, employer identities, sender details, and payment requests. Future versions should communicate uncertainty and provide actionable safety guidance.

## 🙌 ACKNOWLEDGEMENTS

**Project:** TrustShield 254  
**Prepared by:** TrustShield 254 Project Team

Before public submission, add dataset citations, licence information, relevant acknowledgements, contributors, and hackathon event details as applicable.

---

<div align="center">

**🛡️ TRUSTSHIELD 254**

*Check before you click. Verify before you pay. Report to protect others.*

</div>
