# 🚀 OpenQuest

### Discover. Learn. Contribute.

**Your First Step into Open Source 🌱**

OpenQuest is an AI-powered platform designed to help beginners enter the world of open source. It helps newcomers discover beginner-friendly GitHub issues, understand technical tasks in simple language, identify the skills they need, and take their first step towards contributing.

[Explore the Project](#-getting-started) · [Features](#-key-features) · [Tech Stack](#-technology-stack) · [Contribute](#-contributing)

---

## 🌟 About OpenQuest

Starting with open-source contributions can feel overwhelming. Beginners often struggle to find suitable issues, understand complex technical descriptions, and figure out where to begin.

**OpenQuest aims to make that journey easier.**

It brings beginner-friendly GitHub issues and AI-powered learning assistance together in one place, helping developers move from learning to contributing with confidence.

## 🎯 Problem We Solve

- 🔍 Finding suitable first issues among thousands of GitHub repositories is difficult.
- 🧩 Technical issue descriptions can be confusing for beginners.
- 📚 New contributors may not know which skills they need.
- 🛠️ Understanding the contribution workflow can be challenging.
- ⭐ Keeping track of interesting issues can become difficult.

## 💡 Our Solution

OpenQuest provides a beginner-friendly platform where users can:

1. Discover beginner-friendly open-source issues.
2. Filter issues by programming language, topic, and difficulty.
3. Understand technical tasks through AI-powered explanations.
4. Identify the skills and concepts required.
5. Follow a structured contribution checklist.
6. Save interesting issues for later.

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔎 Issue Discovery | Explore beginner-friendly GitHub issues. |
| 🎯 Smart Filters | Filter by language, topic, and difficulty. |
| 🤖 AI Issue Explainer | Understand complex issues in simple language using Gemma 4. |
| 🧠 Skill Recommendations | Discover the skills needed for an issue. |
| 📋 Contribution Guide | Follow a step-by-step contribution checklist. |
| ⭐ Save Issues | Bookmark interesting issues for later. |
| 🔗 GitHub Integration | Visit the original issue and repository. |

*Feature availability depends on the current implementation. AI features require the AI backend and model to be configured.*

## 🛠️ Technology Stack

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Vite
- Lucide React

### Backend and AI
- Python
- FastAPI
- Google Gemma 4
- Ollama

### Data and Integration
- JSON
- Browser LocalStorage
- GitHub Issues

### Deployment
- Vercel (frontend)

## 🧠 How OpenQuest Works

1. User opens the OpenQuest platform.
2. The platform displays beginner-friendly GitHub issues.
3. User searches or filters issues based on interests.
4. User selects an issue to explore.
5. Gemma 4 can explain the issue and recommend relevant skills.
6. User follows the contribution checklist.
7. User visits GitHub to work on the issue and submit a pull request.

## 🏗️ Project Structure

```text
openquest/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── IssueCard.jsx
│   │   ├── FilterBar.jsx
│   │   └── IssueDetails.jsx
│   │
│   ├── data/
│   │   └── issues.json
│   │
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
│
├── index.html
├── package.json
└── README.md
```

*The backend directory can be added when the FastAPI and Gemma 4 integration is introduced.*

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Navigate to the project

```bash
cd openquest
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

### 5. Open in browser

Visit the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

## 🤖 AI Integration – Gemma 4

OpenQuest plans to use Google's Gemma 4 model through Ollama.

The AI assistant is designed to:

- Explain GitHub issues in beginner-friendly language.
- Break technical tasks into smaller steps.
- Recommend relevant programming skills.
- Explain unfamiliar technical terms.
- Answer follow-up questions about an issue.

The AI explanation is intended as learning assistance. Contributors should always follow the original repository's instructions.

## 📸 Screenshots

Add screenshots of your actual application here as development progresses.

```text
docs/
├── home-page.png
├── explore-page.png
├── issue-details.png
└── ai-explainer.png
```

Example:

```markdown
![OpenQuest Home Page](docs/home-page.png)
```

## 🔮 Future Enhancements

- [ ] Live GitHub API integration.
- [ ] AI-powered issue explanations using Gemma 4.
- [ ] Personalized issue recommendations.
- [ ] User accounts and cloud-based bookmarks.
- [ ] Contribution progress tracking.
- [ ] More programming languages and issue categories.

## 🤝 Contributing

We welcome contributions from developers of all experience levels!

1. Fork this repository.
2. Clone your fork.
3. Create a new branch.
4. Make your changes.
5. Test your changes.
6. Commit and push your work.
7. Open a Pull Request.

```bash
git checkout -b feature/your-feature
git add .
git commit -m "Add your feature"
git push origin feature/your-feature
```

## 🌱 Our Vision

We believe that everyone should have the opportunity to contribute to open source, regardless of their experience level.

**OpenQuest is here to turn a beginner's curiosity into their first open-source contribution.**

---

### Made with ❤️ for the Open Source Community

**OpenQuest – Discover. Learn. Contribute.**
