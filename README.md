# 🚀 OpenQuest – AI-Powered Open Source Contribution Discovery Platform

**OpenQuest** is an AI-powered platform designed to help students and beginner developers discover open-source projects, understand GitHub issues and start contributing with confidence.

Our goal is to make open-source contribution easier, more accessible and beginner-friendly.

## 🌟 Problem Statement

Many beginners face difficulties when starting their open-source journey:

- Understanding complex GitHub issues.
- Finding projects suitable for their programming skills.
- Identifying the difficulty level of issues.
- Knowing what skills are required to solve an issue.
- Understanding how to begin contributing.

OpenQuest aims to solve these problems through issue discovery, filtering and AI-powered explanations.

## 💡 Our Solution

OpenQuest provides a beginner-friendly platform where users can:

- Discover real open-source issues from GitHub.
- Filter issues by programming language.
- Filter issues by difficulty level.
- Bookmark interesting issues.
- Receive personalized issue recommendations.
- Get AI-generated explanations of technical issues.
- Understand the skills required to solve an issue.
- Follow step-by-step guidance for approaching an issue.

## ✨ Key Features

### 1. Open Source Issue Discovery
Fetches real open-source issues using the GitHub API.

### 2. Smart Filtering
Allows users to filter issues based on programming language and difficulty.

### 3. AI-Powered Issue Explanation
Uses Ollama with the Gemma 4 E2B model to simplify technical GitHub issues.

The AI explanation system is designed to provide:
- Simple explanations of complex issues.
- Required technical skills.
- Step-by-step beginner guidance.

### 4. Bookmark System
Allows users to save interesting issues and revisit them later.

### 5. Personalized Recommendations
Helps users discover issues relevant to their interests and skills.

### 6. Fallback Dataset
Uses a local sample dataset when live GitHub data is unavailable, allowing users to continue exploring issues.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend development |
| Vite | Frontend development and build tool |
| Python | Backend programming |
| FastAPI | Backend API framework |
| GitHub API | Fetching real open-source issues |
| Ollama | Running AI models locally |
| Gemma 4 E2B | AI-powered issue explanation |

## 🏗️ Project Architecture

```text
                 USER
                   |
                   v
          REACT + VITE FRONTEND
                   |
                   v
           PYTHON + FASTAPI
                   |
          +--------+--------+
          |                 |
          v                 v
      GITHUB API       OLLAMA
          |                 |
          v                 v
     REAL ISSUES        GEMMA 4 E2B
          |                 |
          +--------+--------+
                   |
                   v
          BEGINNER-FRIENDLY
              OUTPUT
```

## ⚙️ Installation and Setup

### Prerequisites

Make sure you have installed:

- Node.js and npm
- Python 3.10 or later
- Git
- Ollama (for local AI functionality)

### Step 1: Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

```bash
cd OpenQuest
```

### Step 2: Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

### Step 3: Setup Backend

Open another terminal:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The backend will usually run at:

```text
http://localhost:8000
```

FastAPI documentation:

```text
http://localhost:8000/docs
```

*Note: These commands assume your project has `frontend` and `backend` folders, a `requirements.txt` file and a `main.py` backend entry point. Adjust them if your actual folder structure differs.*

### Step 4: Setup Ollama and Gemma

Install Ollama from:

https://ollama.com/

Pull the model using the appropriate model tag:

```bash
ollama pull gemma4:e2b
```

Run the model:

```bash
ollama run gemma4:e2b
```

Ollama generally provides its local API at:

```text
http://localhost:11434
```

Make sure the model is available before testing the AI explanation feature.

## 🔄 Application Workflow

1. User opens the OpenQuest application.
2. User searches for open-source issues.
3. GitHub API retrieves available issues.
4. User filters issues by language and difficulty.
5. User selects an interesting issue.
6. The backend sends issue details to the AI model.
7. The AI generates a beginner-friendly explanation.
8. The user receives the explanation, required skills and suggested steps.

If live GitHub data is unavailable, the application can use its local sample dataset.

## 🎯 Target Users

- College students.
- Beginner programmers.
- First-time open-source contributors.
- Students preparing for internships.
- Developers looking to improve their practical coding skills.


## 🌍 Project Vision

Our vision is to build a platform where every beginner can confidently enter the open-source community.

We believe that contributing to open source should not be difficult just because someone is new to programming.

**OpenQuest – Discover. Understand. Contribute.**
