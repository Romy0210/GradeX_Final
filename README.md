# 🎓 GradeX 

### Student Performance Prediction and Recommendation System Using Machine Learning

## 📌 Overview

GradeX is a college-level academic analytics platform designed to predict student performance, identify at-risk students at an early stage, and generate AI-driven academic and behavioral recommendations.

The system integrates Machine Learning workflows with modern full-stack web technologies to enable intelligent academic monitoring and intervention.

Project Type: Final-Year Academic Project

## 🎯 Objectives
#### 🔹 Primary Objectives

- Predict student performance using Machine Learning

- Detect at-risk students early

- Generate AI-based personalized study plans

- Provide detailed academic analytics

#### 🔹 Secondary Objectives

- Enable data-driven academic decision-making

- Support faculty with predictive insights

- Improve institutional academic outcomes

### 🚀 Key Features
#### 👨‍🎓 Student Dashboard

- Academic performance summary

- Subject-wise analytics

- Risk level prediction (Low / Medium / High)

- AI-generated personalized study plans

- Academic behavior insights

- Profile management

### 👨‍💼 Admin Dashboard

- Monitor overall student performance

- Identify at-risk students

- Generate AI-powered reports

- Configure ML model parameters

- Real-time Firestore synchronization

- Institutional analytics overview

### 🏗️ System Architecture

Frontend (Next.js + TypeScript)
        ↓
Next.js API Routes (Backend Layer)
        ↓
AI / ML Workflow Engine
        ↓
Firebase Firestore Database
        ↓
Firebase Authentication

### 🔹 Architecture Highlights

- Next.js App Router for scalable routing

- API Routes for backend logic handling

- AI workflows inside src/ai/flows

- Firebase for authentication and real-time database

- Tailwind CSS for modern responsive UI

- Modular and scalable folder structure

### 🧠 AI / Machine Learning Module
#### 📁 AI Workflow Location
src/ai/flows/

#### 🔹 Implemented AI Modules

- generate-personalized-recommendations.ts

- generate-student-report.ts

- generate-study-plan.ts

- predict-student-risk-level.ts

- run-student-analysis.ts

- summarize-student-performance.ts

#### 🔹 AI Capabilities

- Risk classification (Low / Medium / High)

- cademic trend analysis

- Performance summarization

- Personalized improvement recommendations

- Intelligent academic insight generation

### 🛠️ Technology Stack

| Layer          | Technology                   |
| -------------- | ---------------------------- |
| Frontend       | Next.js 14+ (App Router)     |
| Language       | TypeScript                   |
| Backend        | Next.js API Routes           |
| Database       | Firebase Firestore           |
| Authentication | Firebase Auth                |
| Styling        | Tailwind CSS                 |
| AI Layer       | Custom ML Workflows          |
| Deployment     | Firebase / Vercel Compatible |

### Project Structure
src/
 ├── ai/
 │    ├── flows/
 │    ├── dev.ts
 │    └── genkit.ts
 │
 ├── app/
 │    ├── admin/
 │    ├── student/
 │    │    ├── dashboard/
 │    │    ├── ai-summary/
 │    │    └── profile/
 │    ├── api/
 │    ├── login/
 │    └── register/
 │
 ├── components/
 ├── context/
 ├── firebase/
 ├── hooks/
 └── lib/

### ⚙️ Installation & Setup
#### 1️⃣ Clone Repository
git clone https://github.com/your-username/gradex.git
cd gradex

#### 2️⃣ Install Dependencies
npm install

#### 3️⃣ Configure Environment Variables
Create a .env file:
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

#### 4️⃣ Run Development Server
npm run dev

Application runs at: http://localhost:9002

### 👨‍💻 Author

Romy Thomas
Integrated MCA
Saintgits College of Engineering

📧 romyth2003@gmail.com

📞 9061082241

### 🎓 Project Guide

Dr. Rajesh K. S.
Professor & Head of Department
Department of Computer Applications
Saintgits College of Engineering (Autonomous)
Kottayam, Kerala

#### 📄 License

This project is developed for academic purposes as part of the final-year curriculum requirement.
Usage is permitted for educational and research purposes.