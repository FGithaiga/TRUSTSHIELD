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
