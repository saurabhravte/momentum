#  Momentum

<div align="center">


### Turn Communication Into Progress

**An AI-powered workspace that unifies Gmail, Calendar, Slack, GitHub, and intelligent automation into a single dashboard.**

[![Next.js](https://img.shields.io/badge/Next.js-000?logo=next.js)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript\&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js\&logoColor=white)](#)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm\&logoColor=white)](#)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#)

**Built during a Hackathon ⚡**

</div>

---

##  Overview

Momentum is an AI-first productivity platform designed to eliminate context switching by bringing together communication, scheduling, and development workflows into a unified workspace.

Modern professionals constantly move between email clients, calendars, chat applications, and developer tools. Momentum acts as a single source of truth powered by AI to help users stay focused and productive.

---

##  Features

###  AI Assistant

* Natural language interactions
* Context-aware responses
* Workflow automation
* Productivity insights

###  Email Intelligence

* Unified inbox experience
* AI-powered summaries
* Task extraction from emails
* Email reminders and snoozing

###  Calendar Management

* Event tracking
* Meeting preparation
* Smart scheduling
* Daily agenda generation

###  Collaboration

* Slack integration
* Notification management
* Team communication tracking

###  Developer Workflow

* GitHub integration
* Repository monitoring
* Pull request tracking
* Development insights

###  Productivity

* Keyboard shortcuts
* Unified search
* Daily briefing dashboard
* Personalized workspace

---

##  Architecture

```text
                   ┌─────────────────┐
                   │     Frontend    │
                   │     Next.js     │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   API Server    │
                   │   Express.js    │
                   └────────┬────────┘
                            │
        ┌──────────┬────────┼────────┬──────────┐
        │          │        │        │          │
        ▼          ▼        ▼        ▼          ▼
      Gmail    Calendar   Slack   GitHub      AI
       API        API      API      API     Models
```

---

##  Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* TanStack Query
* Zustand
* Framer Motion

### Backend

* Node.js
* Express.js
* TypeScript

### Database

* PostgreSQL
* Drizzle ORM

### Authentication

* Clerk

### AI & Integrations

* OpenAI API
* Gmail API
* Google Calendar API
* Slack API
* GitHub API
* Corsair.dev

### Tooling

* pnpm
* Turborepo
* ESLint
* Prettier

---

## 📂 Project Structure

```text
momentum/
│
├── client/                          # Next.js frontend application
│   ├── app/                         # App Router pages & layouts
│   ├── components/                  # Reusable UI components
│   ├── hooks/                       # Custom React hooks
│   ├── lib/                         # Client utilities
│   ├── store/                       # Zustand stores
│   └── public/                      # Static assets
│
├── server/                          # Express backend application
│   └── src/
│       ├── server.ts                # Node HTTP entrypoint
│       ├── app.ts                   # Express configuration
│       │
│       ├── modules/                 # Feature-based modules
│       │   ├── auth/                # Authentication & authorization
│       │   ├── inbox/               # Email management
│       │   ├── calendar/            # Calendar events & scheduling
│       │   ├── catchup/             # Daily briefings & summaries
│       │   ├── command/             # AI command execution engine
│       │   ├── search/              # Global search
│       │   ├── tasks/               # Task management
│       │   ├── connections/         # OAuth connections
│       │   ├── integrations/        # Slack & GitHub integrations
│       │   └── webhooks/            # External webhook handlers
│       │
│       ├── common/                  # Shared backend utilities
│       │   ├── config/              # Environment & database config
│       │   ├── dto/                 # Shared DTOs & schemas
│       │   ├── middleware/          # Express middleware
│       │   ├── utils/               # Utility functions
│       │   ├── services/            # Shared business services
│       │   ├── jobs/                # Background jobs & workers
│       │   ├── models/              # Shared database models
│       │   └── types/               # Global TypeScript types
│       │
│       └── tests/                   # Vitest test suites
│
├── packages/                        # Shared packages
│   └── shared/                      # Shared Zod schemas & types
│
├── .github/                         # GitHub workflows & CI/CD
├── package.json                     # Root package configuration
├── pnpm-workspace.yaml              # pnpm workspace definition
├── turbo.json                       # Turborepo configuration
└── README.md                        # Project documentation
```

###  Architecture Pattern

Momentum follows a **feature-based modular monolith architecture**:

* **Frontend:** Next.js + React
* **Backend:** Express + TypeScript
* **Database:** PostgreSQL + Drizzle ORM
* **Authentication:** Clerk
* **AI Layer:** OpenAI
* **Integrations:** Gmail, Calendar, Slack, GitHub
* **Background Jobs:** Queue workers for async processing

This architecture enables rapid hackathon development while remaining scalable for future production deployment.


---

##  Getting Started

### Prerequisites

* Node.js >= 20
* pnpm >= 10
* PostgreSQL

### Installation

```bash
git clone https://github.com/saurabhravte/momentum.git

cd momentum

pnpm install
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

OPENAI_API_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
```

### Start Development Server

```bash
pnpm dev
```


---

##  Demo

| Resource     | Link             |
| ------------ | ---------------- |
| Live Demo    | Coming Soon      |
| Demo Video   | Add YouTube Link |
| Presentation | Coming Soon      |

---

##  Screenshots

Add screenshots inside `docs/`.

```md
![Dashboard](./docs/dashboard.png)
![AI Assistant](./docs/assistant.png)
```

---

##  Hackathon Project

Momentum was built as a hackathon project to explore how AI can reduce context switching and improve productivity by unifying multiple services into a single workspace.

### Problem Statement

Users constantly switch between emails, calendars, chat applications, and developer tools, leading to fragmented workflows and decreased productivity.

### Solution

Momentum centralizes these workflows into a single AI-powered platform that helps users focus on work instead of managing tools.

---

##  Contributing

Contributions are welcome.

```bash
git checkout -b feature/amazing-feature

git commit -m "feat: add amazing feature"

git push origin feature/amazing-feature
```

Then open a Pull Request 



---

##  Author

**Saurabh Ravte**

GitHub: **@saurabhravte**

---

<div align="center">

### ⭐ Star this repository if you found it useful

**Build Momentum, Not Context Switching.**

</div>
