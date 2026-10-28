# 🛡️ TRUSTSHIELD 254: AI-POWERED COMMUNITY SCAM INTELLIGENCE AND DIGITAL TRUST PLATFORM

<div align="center">

<img src="Images/TrustShield_254.png" alt="TrustShield 254 - AI-Powered Community Scam Intelligence Platform" width="900"/>

### AI-Powered Community Scam Intelligence & Digital Trust Platform

*Check before you click. Verify before you pay. Report to protect others.*

</div>

---
## 📌 PROJECT OVERVIEW
TrustShield 254 is an AI-powered cybersecurity and digital-trust project
designed to help Kenyan users identify potentially suspicious online
activities before they click links, pay for products, accept job offers,
or share personal information.

The project explores machine learning, natural language processing
(NLP), and community-based reporting to analyze suspicious messages,
URLs, job advertisements, and online marketplace listings.

The intended platform generates risk assessments, highlights potential
warning signs, and provides practical safety recommendations. Its
planned community intelligence component will help identify repeated
indicators across user reports, making it easier to recognize possible
scam patterns.

The current development work includes dataset preparation, model
training and evaluation, saving reusable model artifacts, and
integrating the prediction service with the existing Django backend.
Current Prototype Capabilities
- Phishing URL classification using Logistic Regression and
  character-level TF-IDF on raw URL text.
- SMS spam classification using TF-IDF and Logistic Regression.
- Fake job-posting classification using TF-IDF and Logistic Regression
  on combined job-posting text.
- Saved models, vectorizers, and decision thresholds for reusable
  predictions.
- A Python model service designed to load the trained models and
  generate predictions.
- Preliminary community scam-report data containing synthetic examples
  for workflow exploration.
- Integration points connecting model predictions to the existing
  Django backend analysis engine.
The integration and end-to-end testing of the complete application are
ongoing. Model outputs should be treated as decision-support signals,
not as definitive proof that content is safe or fraudulent.
❗ PROBLEM STATEMENT
The growth of digital commerce, online recruitment, and mobile financial
services has created more opportunities for cybercriminals to exploit
unsuspecting users through phishing, fraudulent job advertisements, fake
online sellers, impersonation, and suspicious payment requests.

Many users lack the technical knowledge required to distinguish
legitimate digital interactions from potentially fraudulent ones.
Furthermore, information about suspicious contacts, websites, and
advertisements is often scattered across different platforms, making it
difficult to identify recurring scam patterns.

Detection tools may focus on individual threats, such as malicious URLs
or spam messages, without combining these findings with
community-reported information.

Therefore, there is a need for an accessible and intelligent platform
that analyzes suspicious digital content, connects related community
reports, explains potential risks, and provides appropriate safety
recommendations.

TrustShield 254 seeks to address this challenge through an integrated
AI-powered and community-driven digital-trust solution.

## 🎯 OBJECTIVES
**General Objective**

To develop an AI-powered community scam intelligence platform that helps
users identify suspicious digital content, recognize recurring scam
indicators, and make informed decisions when interacting with online
services.

**Specific Objectives**

1. To develop machine-learning models capable of analyzing suspicious
   messages, URLs, and job advertisements.
2. To identify potential phishing attempts, fraudulent recruitment
   offers, suspicious payment requests, and other common digital scam
   indicators.
3. To implement a community reporting system that enables users to
   submit suspicious content and share relevant warning signs.
4. To develop a community intelligence mechanism that identifies
   repeated indicators across reports and highlights potential
   relationships between suspicious activities.
5. To generate explainable risk assessments that communicate detected
   warning signs, uncertainty, and recommended safety actions.
6. To evaluate detection models using appropriate machine-learning
   metrics, including precision, recall, F1-score, and confusion
   matrices.
7. To promote digital safety awareness and responsible online behavior
   among Kenyan shoppers, job seekers, and mobile-money users.

## 📂 DATA DESCRIPTION
The project has used several datasets for model development and
preliminary workflow exploration. Dataset dimensions below describe the
versions observed during development; cleaning, filtering, and changes
in source files may affect the final dimensions.
**1. Phishing URL Datasets**
Earlier Engineered-Feature Dataset
File: Data/Phishing_URL_Dataset.csv
- Reported dimensions: 235,795 rows × 56 columns.
- Purpose: Classification of phishing and legitimate URLs.
- Target column: label.
- Label interpretation in the earlier notebook: 0 = phishing;
  1 = legitimate.
- Earlier modelling approach: HistGradientBoostingClassifier using
  URL-only features in a domain-grouped development workflow.
This dataset contains URL-related and webpage-derived features. An
earlier reusable feature helper was designed to extract approximately 18
URL-only features. That helper has not been validated feature-by-feature
against the original training feature definitions, so its predictions
should be considered experimental.
Current Phishing Candidate Dataset and Model
Dataset file: Data/Phishing_Dataset.csv
- Reported raw dimensions: 101,219 rows × 18 columns.
- Reported cleaned dimensions: 100,872 rows × 18 columns.
- Purpose: Classification of phishing and legitimate URLs.
- Target column: ClassLabel.
- Current candidate approach: Logistic Regression using
  character-level TF-IDF on raw URL text.
The current candidate model uses the URL text directly rather than the
earlier engineered-feature extraction pipeline.

**Saved model artifacts:**
- AI-ML/models/phishing_candidate_model.joblib
- AI-ML/models/phishing_candidate_vectorizer.joblib
- AI-ML/models/phishing_candidate_threshold.joblib
Saved threshold: 0.30

Label convention: 0 = phishing; 1 = legitimate.

The candidate model's reported hostname-grouped validation accuracy was
99.83% at a threshold of 0.50, with no shared hostnames between training
and validation. Dataset labelling inconsistencies have been identified,
so additional validation is required before production use. The reported
accuracy at 0.50 should not be assumed to represent performance at the
saved threshold of 0.30.

**2. Fake Job Postings Dataset**
File: Data/fake_job_postings.csv
- Reported dimensions: approximately 17,879 rows; the column count
  differed between development snapshots.
- Purpose: Classification of fraudulent and legitimate job
  advertisements.
- Target column: fraudulent.
- Label interpretation: 0 = legitimate posting; 1 = fraudulent
  posting.
- Current modelling approach: Logistic Regression using TF-IDF
  features from combined job-posting text.
The dataset supports the investigation of patterns in job-posting text
that may be associated with fraudulent recruitment. The current
text-based model uses combined job-posting text rather than requiring
the older categorical-field preprocessing pipeline.

**Saved model artifacts:**
- AI-ML/models/fake_job_logistic_regression.joblib
- AI-ML/models/fake_job_tfidf.joblib
- AI-ML/models/fake_job_threshold.joblib
Saved threshold: 0.50

**3. SMS Spam Collection**
File: Data/SMSSpamCollection
- Reported number of messages: 5,572.
- Purpose: Classification of spam and ordinary SMS messages.
- Labels: spam and ham.
- Modelling approach: TF-IDF vectorization followed by Logistic
  Regression.
The model transforms message text into numerical features before
predicting whether the message resembles spam.

**Saved model artifacts:**
- AI-ML/models/sms_logistic_regression.joblib
- AI-ML/models/sms_tfidf.joblib
- AI-ML/models/sms_threshold.joblib
Saved threshold: 0.48

**4. Community Scam Reports Dataset**
File: Data/community_scam_reports.csv
- Reported number of examples: 10 synthetic records.
- Purpose: Preliminary exploration of a future community reporting
  and scam intelligence workflow.
These examples are synthetic demonstration data. They are not verified
reports of real scams and must not be presented as evidence of actual
incidents.

Related supporting data may include
Data/community_indicator_summary.csv, which is intended to support
exploration of repeated indicators across reports.
Data Governance
Dataset sources, licences, attribution requirements, privacy
considerations, and permitted uses should be documented before public
release or redistribution.

## 📊 EXPLORATORY DATA ANALYSIS (EDA)
The notebook work includes loading datasets, inspecting their dimensions
and structure, examining target labels, checking data quality, and
preparing features for machine-learning experiments.
Areas Explored
- Dataset dimensions and column structures.
- Target labels and their meanings.
- Missing values and duplicate records.
- Class distributions and class imbalance.
- URL-related and structured features.
- Text preparation for SMS classification.
- Text preparation for job-posting classification.
- Preparation of model inputs and evaluation outputs.
Feature Preparation
SMS spam detection: TF-IDF converts message text into numerical
features suitable for Logistic Regression.

Fake job detection: Combined job-posting text is transformed using a
fitted TF-IDF vectorizer before classification.

Current phishing candidate model: Character-level TF-IDF transforms
raw URL strings into numerical features. This differs from the earlier
engineered-feature approach based on approximately 18 URL features.


## 🧠 MODEL DEVELOPMENT AND EVALUATION
Three trained classification models support the current AI/ML work:
phishing URL detection, SMS spam detection, and fake job-posting
detection.
1. Phishing URL Detection
- Algorithm: Logistic Regression.
- Feature extraction: Character-level TF-IDF on raw URL text.
- Reported hostname-grouped validation accuracy: 99.83% at a
  threshold of 0.50.
- Saved threshold: 0.30.
- Positive class for phishing decisions: Class 0.
The hostname-grouped evaluation used separate hostnames across training
and validation. Despite this, dataset labelling issues and changing
real-world URL patterns remain important limitations.
2. SMS Spam Detection
- Algorithm: Logistic Regression.
- Feature extraction: TF-IDF.
- Reported accuracy: 98.21%.
- Reported spam F1-score: Approximately 93%.
- Saved threshold: 0.48.
The model supports identification of messages resembling spam. Its
performance should be evaluated on new examples representative of the
messages encountered by the intended users.
3. Fake Job-Posting Detection
- Algorithm: Logistic Regression.
- Feature extraction: TF-IDF on combined job-posting text.
- Reported accuracy: 98.41%.
- Reported fraud precision: 79.9%.
- Reported fraud recall: 89.6%.
- Reported fraud F1-score: 84.47%.
- Saved threshold: 0.50.
Fraudulent job postings represented a minority of the dataset, making
precision and recall important alongside accuracy.
Evaluation Notes
The results above were reported during model development using the
evaluation data and splits associated with each experiment. They should
not be compared as if all three experiments used identical datasets or
evaluation conditions.

Accuracy alone is insufficient to establish whether a scam detector is
reliable. Precision, recall, F1-score, confusion matrices, class
distributions, and threshold-specific performance should also be
considered.

The saved thresholds are configuration values and should be validated
against representative data before deployment. A high validation score
does not guarantee that the model will perform equally well on unseen,
real-world examples.


## 💾 SAVED MODEL ARTIFACTS
The trained models and supporting artifacts are stored in
AI-ML/models/.
  Detection task   Model artifact                          Supporting artifacts                                  Threshold
  Phishing URL     phishing_candidate_model.joblib       phishing_candidate_vectorizer.joblib,                    0.30
                                                           phishing_candidate_threshold.joblib     

  SMS spam         sms_logistic_regression.joblib        sms_tfidf.joblib,                                        0.48
                                                           sms_threshold.joblib                    

  Fake job posting fake_job_logistic_regression.joblib   fake_job_tfidf.joblib,                                   0.50
                                                       fake_job_threshold.joblib               
Each model must be loaded with its matching vectorizer and threshold.
Replacing or retraining a model requires checking that its supporting
artifacts and evaluation results remain compatible.