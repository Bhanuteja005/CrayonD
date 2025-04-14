# 🧠 Interview Prep Coach Chatbot

An AI-powered chatbot that helps users prepare for interviews with personalized questions, real-time job market insights, and memory-based conversations.

---

## 🚀 Features

- ✍️ **Smart Interview Q&A** – Ask anything about your role, and get tailored answers.
- 🧠 **Long-Term Memory** – Remembers your goals & context using Pinecone.
- 📰 **Live Job Market Insights** – Fetches real-time info using **Serper API** + **News API**.
- 📋 **Question Generator Tool** – Customize your practice: role, skills, difficulty, quantity.
- 📊 **Skill Gap Feedback** – Suggests skills to improve based on market trends.
- 💾 **User Profile** – Save your experience, role, and preferences.

---

## 🧩 Tech Stack

| Layer        | Tech                        |
|--------------|-----------------------------|
| Frontend     | Next.js, Tailwind, shadcn/ui|
| Backend      | Node.js, Vercel AI SDK      |
| AI Models    | Google Gemini               |
| Vector DB    | Pinecone                    |
| APIs         | Serper API, News API        |

---

## 🧠 Architecture

Check the diagram: `interview-coach-architecture.mermaid`

```
[User] --> [Chat UI] --> [API Route (/api/chat)] --> [Gemini + Memory Search (Pinecone)] --> [Response]
```

---

## 🔁 Memory Flow

Check the diagram: `memory-flow.mermaid`

```
[Chat Input] --> [Embed & Store to Pinecone]
[New Query] --> [Embed & Search Pinecone] --> [Relevant Memories + New Input] --> [Gemini]
```

---

## 🌐 External APIs

- 🔍 **Serper API** – Real-time job market queries via Google Search
- 📰 **News API** – Fetches latest career and hiring trends

---

## 💻 How to Run Locally

```bash
git clone https://github.com/Bhanuteja005/CrayonD.git
cd interview-coach
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env.local` file:

```env
GEMINI_API_KEY=your_key
PINECONE_API_KEY=your_key
PINECONE_ENVIRONMENT=your_env
PINECONE_INDEX_NAME=your_index
SERPER_API_KEY=your_key
NEWS_API_KEY=your_key
```

---

## 🎯 Usage Demo

1. Fill your **profile** (role, skills, experience)
2. Ask questions like:
   - “Give me 5 intermediate-level questions for a React developer”
   - “What skills are in demand for Data Science?”
3. Come back later — it still remembers you.

---

## 📌 Hackathon Goals Achieved

✅ AI chat assistant  
✅ Persistent memory (via Pinecone)  
✅ Live data fetching (job insights + news)  
✅ User profile customization  
✅ Tools for interview prep (question gen + trends)

---

## 📂 File Structure

```
/app
  ├─ /api
  │   └─ chat.ts
  ├─ /components
  ├─ /lib
  └─ /utils
.mermaid diagrams
.env.local
README.md
```

---

## 🙌 Team

- 🧑‍💻 Bhanu Teja P – Full Stack Developer  
- [LinkedIn](https://www.linkedin.com/in/bhanu-teja-p-457955253/) | [GitHub](https://github.com/Bhanuteja005)

