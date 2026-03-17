# 🎓 GradeX  
### Student Performance Prediction and Recommendation System Using Machine Learning  

---

## 📌 Project Overview  

**GradeX** is an AI-driven academic analytics and student performance intelligence platform developed as a **final-year MCA academic project**.  
The system is designed to assist educational institutions in **early identification of academically at-risk students**, enabling timely intervention through **data-driven insights and personalized study recommendations**.

GradeX integrates **Machine Learning prediction models**, **Explainable AI techniques**, and **Generative AI recommendation workflows** within a modern full-stack web ecosystem.  
By combining statistical risk classification with intelligent advisory generation, the platform supports **proactive academic monitoring and strategic decision-making**.

---

## 🎯 Objectives  

### 🔹 Primary Objectives  

- Predict student academic risk levels using Machine Learning  
- Detect potential performance decline at an early stage  
- Generate AI-driven personalized study plans and interventions  
- Provide visual academic analytics dashboards for institutions  

### 🔹 Secondary Objectives  

- Support faculty with predictive academic intelligence  
- Enable data-driven academic policy decisions  
- Improve overall institutional academic performance outcomes  
- Promote adaptive and personalized learning experiences  

---

## 🚀 Key Features  

### 👨‍🎓 Student Dashboard  

- Real-time academic performance overview  
- Subject-wise marks and attendance analytics  
- Machine Learning risk level prediction (Low / Medium / High)  
- AI-generated personalized study plans  
- Behavioral and motivational recommendations  
- Profile and academic data management  

### 👨‍💼 Administrator Dashboard  

- Centralized student performance monitoring  
- Early identification of high-risk students  
- AI-powered academic performance reports  
- Institutional analytics visualization  
- Batch / semester performance segmentation  
- Bulk student data upload and management  
- Real-time synchronization with Firestore  

---

## 🏗️ System Architecture  

GradeX follows a **layered modern web architecture** integrating scalable frontend technologies, backend BaaS services, AI orchestration workflows, and an independent Machine Learning microservice.

### 🔹 Frontend Layer  

- **Framework:** Next.js 15 (App Router architecture)  
- **Language:** TypeScript + React  
- **Styling:** Tailwind CSS  
- **Component System:** Shadcn UI (Radix primitives)  
- **Visualization:** Recharts analytics components  

### 🔹 Backend Core Layer (Firebase BaaS)  

- **Authentication:** Firebase Auth (role-based routing for Admin / Student)  
- **Database:** Firestore NoSQL database (single source of truth)  
- **Storage:** Firebase Storage for media assets and profile images  

### 🔹 AI Orchestration Layer  

- **Workflow Engine:** Google Genkit Server Actions  
- **LLM Routing:** OpenRouter integration  
- **AI Flows:**  
  - Student performance analysis  
  - Personalized recommendation generation  
  - Dynamic study plan creation  

### 🔹 Machine Learning Microservice  

- **Environment:** Python 3 + FastAPI  
- **Model:** Scikit-Learn Random Forest Classifier  
- **Explainability:** SHAP feature attribution analysis  
- **Deployment Style:** Independent local ML API service  

---

## 🧠 AI / Machine Learning Module  

The GradeX intelligence engine combines **deterministic academic scoring**, **statistical prediction**, and **Generative AI reasoning** to produce meaningful academic insights.

### 🔹 Implemented Capabilities  

- Academic risk classification (Low / Medium / High)  
- Feature importance explanation using SHAP  
- Performance trend analysis  
- Personalized academic intervention recommendations  
- Intelligent structured study plan generation  
- Behavioral performance motivation strategies  

### 🔹 AI Workflow Directory  

src/ai/flows/
├── run-student-analysis.ts
├── generate-study-plan.ts
├── generate-personalized-recommendations.ts
└── predict-student-risk-level.ts


---

## 🛠️ Technology Stack  

| Layer                | Technology Used                          |
|----------------------|------------------------------------------|
| Frontend             | Next.js 15 (App Router)                  |
| Programming Language | TypeScript                               |
| UI Styling           | Tailwind CSS + Shadcn UI                 |
| Backend Logic        | Next.js Server Actions                   |
| Database             | Firebase Firestore                       |
| Authentication       | Firebase Auth                            |
| Storage              | Firebase Storage                         |
| AI Orchestration     | Google Genkit                            |
| LLM Integration      | OpenRouter (Gemini / Claude / Llama)     |
| Machine Learning     | Scikit-Learn Random Forest               |
| ML API Framework     | Python FastAPI                           |
| Explainable AI       | SHAP                                     |
| Charting Library     | Recharts                                 |

---

## ✨ Architecture Highlights  

- Modular layered system design  
- Independent ML microservice scalability  
- Explainable AI integration for academic transparency  
- Token-efficient AI workflow persistence  
- Role-based secure data access control  
- Real-time Firestore synchronization  
- Clean enterprise-style folder architecture  

---

## 📁 Project Directory Structure  

GradeX_Final/
├── ml_backend/
│ ├── api.py
│ ├── train_model.py
│ └── risk_model.pkl
│
├── src/
│ ├── ai/
│ │ └── flows/
│ ├── app/
│ │ ├── admin/
│ │ ├── student/
│ │ ├── login/
│ │ └── register/
│ ├── components/
│ ├── firebase/
│ └── lib/
│
└── firestore.rules

## ⚙️ Installation & Setup Guide  

### 1️⃣ Clone Repository  

```bash
git clone https://github.com/your-username/gradex.git
cd gradex
```

###  2️⃣ Install Frontend Dependencies

```bash
npm install
```

###  3️⃣ Configure Environment Variables

Create .env.local file:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
OPENROUTER_API_KEY=
```

###  4️⃣ Run Development Server

```bash
npm run dev

Application runs at:
http://localhost:9002

```

###  5️⃣ Running Machine Learning Backend

Navigate to ML service directory:

```bash
cd ml_backend
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

ML Prediction API available at:
http://127.0.0.1:8000/predict

### 🏁 Conclusion

GradeX demonstrates how Machine Learning, Explainable AI, and Generative AI can be integrated into a scalable academic analytics ecosystem.
The platform provides a practical institutional solution for early academic risk detection, personalized learning support, and strategic performance monitoring.

This project highlights the importance of AI-assisted education systems in shaping the future of intelligent academic environments.

### 👨💻 Author

Romy Thomas
Integrated MCA
Saintgits College of Engineering

📧 romyth2003@gmail.com

📞 9061082241

### 🎓 Project Guide

Dr. Rajesh K. S.
Professor 
Department of Computer Applications
Saintgits College of Engineering (Autonomous)
Kottayam, Kerala

### 📄 Academic License

This project is developed strictly for academic and research purposes as part of the final-year postgraduate curriculum.
Usage, modification, and reference are permitted for educational and non-commercial research activities.
