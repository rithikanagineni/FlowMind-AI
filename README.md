# ⚡ FlowMind — AI Productivity Operating System

> **Work smarter, not harder.** FlowMind is an AI-powered productivity platform that plans your day, breaks down your work, detects burnout, and keeps you in flow.

Access the live workin demo from here:  https://flow-mind-aiproductivity.netlify.app/
---

## 📖 Overview

FlowMind is **not just another to-do list** — it's an intelligent productivity operating system that actively *thinks* about your workload. While traditional tools simply store tasks, FlowMind uses AI to:

- 🧠 **Plan your entire day** from a plain-English description
- 📋 **Break down complex tasks** into manageable subtasks with one click
- 💚 **Detect burnout** before you crash and suggest relief
- ⏱️ **Keep you focused** with deep-work sessions and audio alerts
- 📊 **Track your patterns** with live productivity analytics

---

## 🎯 The Problem It Solves

| Problem | Reality | FlowMind's Solution |
|---------|---------|---------------------|
| **Decision Paralysis** | 10+ tasks but no idea what to do first | AI Smart Planner builds an optimized schedule |
| **Task Overwhelm** | Big tasks feel impossible, so you procrastinate | AI Task Breakdown splits work into small steps |
| **Silent Burnout** | You keep pushing until you crash | Burnout Detection warns you early |

---

## ✨ Key Features

### 🗓️ AI Daily Planner
Describe your day in plain English (e.g., *"Tomorrow I have a meeting at 2pm, house chores in the morning, office work, and swimming"*) and FlowMind generates a complete, time-slotted schedule — morning to night. It understands natural language, detects specific times, and resolves conflicts intelligently.

### 🤖 AI Assistant
A conversational copilot that breaks down complex tasks into actionable subtasks, gives personalized productivity tips, and helps you reduce daily burnout risk — all with one click.

### ✅ Smart Tasks
- Click any task to update its status: **Started → In Progress → Completed**
- Inline **edit** and **delete** options
- **Nested subtasks** appear under their parent task (no clutter!)
- Visual progress bars and priority/category badges
- Filter by status and priority

### ⏱️ Focus Timer
- Pomodoro-style presets (25m / 50m / 15m / 5m)
- **Audio alarm** when the session completes, with a stop button
- Link sessions to specific tasks
- Live tracking of today's focus time and session history

### 📅 My Calendar
View your AI-generated daily plan organized into **Morning / Afternoon / Evening** sections with color-coded, time-slotted activities.

### 💡 Quick Capture
Instantly save ideas and notes with tags before you forget them. Mark items as "ideas" for easy filtering.

### 📊 Insights (Analytics)
Live productivity dashboard showing:
- Completion rate, focus time, sessions, average session length
- Productivity score (0–100)
- Weekly focus trend chart (last 7 days, live data)
- Task breakdown by category and priority
- AI-generated productivity insights

### 🔐 Authentication & Account Management
- Sign Up / Sign In with email & password
- **Smart email validation** — catches typos like `gmial.com` or `gmail.cm`
- **Forgot Password** flow with reset link simulation
- **Change Password** from the profile menu
- **Per-user data persistence** — your data is saved and restored on login
- Session restoration on page refresh

### 🔔 Smart Notifications & Toasts
Real-time notifications for actions like task completion, deadline reminders, and AI plan generation — with a live unread count.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 |
| **Language** | TypeScript |
| **Build Tool** | Vite 7 |
| **Styling** | Tailwind CSS 4 |
| **Icons** | Lucide React |
| **Audio** | Web Audio API (timer alarms) |
| **State** | React Hooks (useState, useEffect, useMemo, useCallback) |
| **Persistence** | Browser localStorage |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **npm** installed

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/flowmind.git

# 2. Navigate into the project
cd flowmind

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The optimized output will be generated in the `dist/` folder.

### Preview the Production Build

```bash
npm run preview
```

---

## 📂 Project Structure

```
flowmind/
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── AIPlanner.tsx        # AI Daily Planner
│   │   ├── NewAIAssistant.tsx   # AI Assistant chat
│   │   ├── SmartTasks.tsx       # Task management
│   │   ├── FocusTimer.tsx       # Pomodoro timer
│   │   ├── CalendarView.tsx     # Calendar view
│   │   ├── QuickCapture.tsx     # Notes & ideas
│   │   ├── Analytics.tsx        # Insights dashboard
│   │   ├── AuthPage.tsx         # Sign in / sign up
│   │   ├── ChangePasswordModal.tsx
│   │   └── Toast.tsx            # Toast notifications
│   ├── utils/
│   │   └── dates.ts         # Local-timezone date helpers
│   ├── App.tsx              # Root component & routing
│   ├── store.ts            # Central state management
│   ├── storage.ts          # localStorage persistence
│   ├── types.ts            # TypeScript type definitions
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🎮 How to Use

1. **Sign Up** with your name, email, and password
2. **AI Daily Planner** → Describe your day → Click **Generate Plan** → **Apply to Calendar**
3. **Smart Tasks** → Add tasks, update status, or click **Subtasks** to break them down
4. **Focus Timer** → Pick a duration → Select a task → Start your deep work session
5. **My Calendar** → View your AI-generated schedule
6. **Insights** → Track your productivity patterns

---

## 🌟 What Makes FlowMind Different

| Tool | What It Does | What It Doesn't Do |
|------|-------------|-------------------|
| Todoist | Stores tasks | No AI planning or burnout detection |
| Notion | Flexible workspace | No AI scheduling or auto task breakdown |
| Forest | Tracks focus time | Doesn't understand your workload |
| **FlowMind** | **AI plans, breaks down work & protects you** | — |

---

## 🔮 Future Roadmap

- [ ] Real backend integration (Firebase / Supabase)
- [ ] Google Calendar & Outlook sync
- [ ] Team collaboration & shared boards
- [ ] Voice-to-task capture
- [ ] Mobile app (React Native)
- [ ] Real LLM integration (OpenAI / Claude API)
- [ ] Advanced analytics with ML-based predictions

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


---
