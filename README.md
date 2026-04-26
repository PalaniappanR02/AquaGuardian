# 💧 AquaGuardian 
**AI-Driven Predictive Platform for Water Network Anomalies**

[![FusionX Hackathon](https://img.shields.io/badge/FusionXHackathon_2026-blue.svg)](#)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black.svg)](#)
[![Streamlit](https://img.shields.io/badge/Analytics-Streamlit-red.svg)](#)
[![Python](https://img.shields.io/badge/ML-Python_3.8+-yellow.svg)](#)

Welcome to **AquaGuardian**, a civic-tech solution designed and developed for the **FusionX** at Presidency University, Bangalore.

AquaGuardian is an intelligent platform that monitors smart city water grids. It uses machine learning to detect anomalies, predict potential leaks, and provide a comprehensive dashboard for both citizens and city administrators.

---

## 🏗️ Architecture & Tech Stack

This project is built as a monorepo containing two dedicated services that work together:

### 1. Citizen & Admin Dashboard (`/frontend`)
The user-facing web application where citizens can report issues and admins can monitor the grid.
* **Framework:** Next.js (React)
* **Styling:** Tailwind CSS
* **Database & Authentication:** Supabase
* **Language:** TypeScript / JavaScript

### 2. Predictive Analytics Engine (`/analytics`)
The backend AI engine that processes sensor data and visualizes anomalies.
* **Framework:** Streamlit
* **Machine Learning:** Scikit-learn (Logistic Regression, Decision Trees)
* **Data Processing:** Pandas, NumPy
* **Language:** Python

---

## 📂 Repository Structure

```text
AquaGuardian/
├── analytics/                 # Python Machine Learning Environment
│   ├── models/                # Trained ML models and logic
│   ├── utils/                 # Helper functions for data processing
│   ├── app.py                 # Main Streamlit dashboard application
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Template for Python environment variables
│
├── frontend/                  # Next.js Web Environment
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # Reusable React components (UI)
│   ├── lib/                   # Utility functions and Supabase clients
│   ├── public/                # Static assets (images, icons)
│   ├── package.json           # Node.js dependencies
│   └── .env.local.example     # Template for Next.js environment variables
│
├── supabase/                  # Database schema and configurations
├── .gitignore                 # Excluded heavy/system files
└── README.md                  # Project documentation