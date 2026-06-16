<div align="center">

# ⚖️ LexGuard AI

### Multi-Agent Contract Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma_ORM-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Authentication-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**LexGuard AI** is a production-grade, multi-agent AI platform that transforms how individuals and businesses review legal contracts — turning dense legal language into clear risk assessments, negotiation strategies, and plain-English summaries in seconds.

[**Live Demo**](https://lexguard.vercel.app) · [**Architecture Overview**](#-system-architecture) · [**Quick Start**](#-installation--setup)

---

</div>

## 📌 The Problem

Legal contracts are a daily business necessity, yet most people sign them without fully understanding the obligations, risks, or leverage they carry. Hiring a lawyer for every contract is expensive and slow. AI-assisted contract review — done right — can surface critical risks in seconds, not days.

**LexGuard AI** solves this by deploying a coordinated team of specialized AI agents, each responsible for a distinct analytical task:

- **What are the risks?** → Risk Detector Agent
- **What does it mean in plain English?** → Legal Simplifier Agent
- **How should I negotiate this?** → Negotiation Recommender Agent
- **I have a specific question** → Contract QA Agent

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **Firebase Authentication** | Secure email/password and social login. Every analysis is private to the authenticated user. |
| 🗄️ **PostgreSQL + Prisma** | All analysis results persisted server-side. Users can revisit prior analyses from any device. |
| 🧠 **Multi-Agent AI Pipeline** | Four specialized Gemini AI agents running in a coordinated orchestration pipeline. |
| ⚠️ **AI Risk Scoring Engine** | Structured risk scores (0–100), severity levels, confidence, and risk category classification. |
| 🎨 **Clause Highlighting** | AI-identified risky clauses are color-coded directly within the contract text. |
| 📋 **Negotiation Recommender** | Per-clause negotiation strategy, business impact, suggested alternative wording, and leverage assessment. |
| 💬 **Contract Q&A Assistant** | Ask any question about the contract in plain English — answers grounded in the actual contract text. |
| 📄 **Downloadable PDF Reports** | Full risk report including scores, clauses, obligations, negotiation guidance, and executive summary. |
| 📂 **Analysis History** | User-specific history with the ability to restore and revisit prior analyses. |
| 📱 **Responsive Design** | Optimized for desktop and mobile with a premium, accessible UI. |

---

## 🤖 Multi-Agent Architecture

LexGuard uses a **sequential agent pipeline** where each agent is an isolated module with its own:
- Dedicated system prompt
- Structured Gemini JSON schema
- Zod validation layer
- Graceful fallback / degraded output logic

```
POST /api/analyze
        │
        ▼
┌─────────────────────────────────────────────────────┐
│                   AI Orchestrator                    │
│              lib/agents/orchestrator.ts              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Step 1]  Risk Detector Agent        (FATAL)        │
│  ├── Risk scoring (0–100)                            │
│  ├── Severity: low / medium / high / critical        │
│  ├── Risky clause extraction & categorization        │
│  ├── Obligations, liabilities, privacy concerns      │
│  └── Document type detection & confidence            │
│                         ↓                            │
│  [Step 2]  Legal Simplifier Agent     (non-fatal)    │
│  ├── Polished plain-English executive summary        │
│  ├── Per-clause user-friendly explanations           │
│  ├── One-sentence TLDR                               │
│  └── Key user actions                                │
│                         ↓                            │
│  [Step 3]  Negotiation Recommender    (non-fatal)    │
│  ├── Per-clause negotiation guidance                 │
│  ├── Business impact reasoning                       │
│  ├── Suggested alternative wording                   │
│  ├── Quick wins & walk-away triggers                 │
│  └── Leverage assessment (strong / moderate / weak)  │
│                         ↓                            │
│        Merged OrchestratorResult → API Response      │
└─────────────────────────────────────────────────────┘
        │
        │  (Independent, per user question)
        ▼
┌─────────────────────────────────────────────────────┐
│  [Agent 4]  Contract QA Agent                        │
│  ├── Full contract text injected per question        │
│  ├── Conversation history for follow-up support      │
│  ├── Domain-restricted to contract topics only       │
│  ├── Grounded answers with clause citations          │
│  └── GROUNDED:YES / GROUNDED:NO transparency        │
└─────────────────────────────────────────────────────┘
```

### Agent Failure Handling

| Agent | Failure Behaviour |
|---|---|
| Risk Detector | **Fatal** — pipeline aborts, clear error returned to user |
| Legal Simplifier | **Non-fatal** — graceful degradation with raw summary fallback |
| Negotiation Recommender | **Non-fatal** — generates basic per-clause fallback from risk data |
| Contract QA | **Independent** — isolated per-call, failures are surfaced in chat |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────┐
│           Client (Browser)               │
│   Next.js 16 · React · Tailwind CSS      │
└──────────────────┬───────────────────────┘
                   │ HTTPS
                   ▼
┌──────────────────────────────────────────┐
│        Firebase Authentication           │
│   ID Token verification on every API    │
│   route via Firebase Admin SDK           │
└──────────────────┬───────────────────────┘
                   │ Bearer Token
                   ▼
┌──────────────────────────────────────────┐
│         Next.js API Routes               │
│  /api/analyze      — contract analysis   │
│  /api/contract-qa  — chat Q&A            │
│  /api/history      — user history        │
└────────┬─────────────────────┬───────────┘
         │                     │
         ▼                     ▼
┌────────────────┐   ┌─────────────────────┐
│  AI Orchestrator│   │  Prisma ORM         │
│  (multi-agent  │   │  PostgreSQL          │
│   pipeline)    │   │  Analysis history    │
└────────┬───────┘   └─────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│           Google Gemini API              │
│  gemini-2.5-flash (primary model)        │
│  Automatic model fallback chain          │
│  Structured JSON schema enforcement      │
└──────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router + Turbopack) | Core framework |
| **React 19** | UI component library |
| **TypeScript** | End-to-end type safety |
| **Tailwind CSS v4** | Styling and design system |
| **Vanilla CSS** | Custom animations, design tokens |

### Backend
| Technology | Purpose |
|---|---|
| **Next.js API Routes** | Server-side REST endpoints |
| **Firebase Admin SDK** | Server-side token verification |
| **Zod** | Schema validation for AI responses |

### AI
| Technology | Purpose |
|---|---|
| **Google Gemini 2.5 Flash** | Primary AI model (all agents) |
| **@google/genai SDK** | Gemini API client |
| **Structured JSON Schema** | Enforces typed AI output |
| **Prompt Engineering** | Agent-specific system prompts |

### Database
| Technology | Purpose |
|---|---|
| **PostgreSQL** | Primary relational database |
| **Prisma ORM** | Type-safe database client and migrations |

### Authentication
| Technology | Purpose |
|---|---|
| **Firebase Authentication** | User identity and session management |
| **Firebase Admin SDK** | Server-side token verification |

---

## 📸 Screenshots

> Screenshots from the live application:

### Dashboard & Risk Analysis
```
┌─────────────────────────────────────────────────┐
│  LexGuard AI                          [Logout]  │
├─────────────────────────────────────────────────┤
│  Analyze agreements with confidence             │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Paste or upload your contract text...  │   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│                           [Analyze Contract →]  │
│                                                 │
│  ⚠️ HIGH RISK  Score: 78/100                    │
│  ▓▓▓▓▓▓▓▓▓░░░░░░                               │
│  3 Critical  5 High  2 Medium  1 Low            │
└─────────────────────────────────────────────────┘
```

### Clause Highlighting
```
┌─────────────────────────────────────────────────┐
│  Highlighted Contract                           │
│                                                 │
│  8.2 Limitation of Liability.                  │
│  ████████████████████████████████████           │
│  [CRITICAL] Party shall be liable for any      │
│  and all damages, including indirect...         │
│                                                 │
│  3.1 Term. This Agreement shall automatically  │
│  ████████████████████████████████████           │
│  [HIGH] renew for successive twelve (12)...    │
└─────────────────────────────────────────────────┘
```

### Contract Q&A Chat
```
┌─────────────────────────────────────────────────┐
│  ✦ Contract Assistant            [×]            │
│  Analyzing: MSA  ·  High Risk  ·  1,240 words  │
├─────────────────────────────────────────────────┤
│                                                 │
│  User: What are the termination conditions?     │
│                                                 │
│  ✦ The contract allows termination by either    │
│  party with 90 days written notice.             │
│                                                 │
│  ┌────────────────────────────────────────┐     │
│  │ 📎 Section 3.1                        │     │
│  │ "...terminated in writing at least    │     │
│  │  ninety (90) days prior..."           │     │
│  └────────────────────────────────────────┘     │
├─────────────────────────────────────────────────┤
│  Ask about this contract...            [Send →] │
└─────────────────────────────────────────────────┘
```

### Negotiation Guidance
```
┌─────────────────────────────────────────────────┐
│  Agent 3 · Negotiation Recommender              │
│  Negotiation Guidance              [Moderate ▾] │
├─────────────────────────────────────────────────┤
│  📍 Focus on the 3 critical clauses first       │
│                                                 │
│  ⚡ Quick Wins                                  │
│  1. Request mutual termination rights           │
│  2. Add a liability cap equal to fees paid      │
│                                                 │
│  1. Limitation of Liability    [CRITICAL]       │
│  Issue: Unlimited damages exposure              │
│  Recommendation: Request a cap equal to         │
│  total fees paid in the prior 12 months.        │
│                                                 │
│  ▼ Show suggested wording                       │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Firebase project
- Google AI Studio API key (Gemini)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/lexguard-ai.git
cd lexguard-ai/lexguard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# ── Gemini AI ──────────────────────────────────────
GEMINI_API_KEY=your_google_ai_studio_api_key_here
GEMINI_MODEL=gemini-2.5-flash          # optional, defaults to gemini-2.5-flash

# ── PostgreSQL + Prisma ────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/lexguard

# ── Firebase (Client SDK) ──────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# ── Firebase Admin (Server SDK) ────────────────────
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Set Up the Database

```bash
# Push the Prisma schema to your PostgreSQL database
npx prisma db push

# (Optional) Seed with sample data
npx prisma db seed

# View the database in Prisma Studio
npx prisma studio
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production

```bash
npm run build
npm start
```

### Project Structure

```
lexguard/
├── app/
│   ├── api/
│   │   ├── analyze/          # Main orchestration endpoint
│   │   ├── contract-qa/      # Contract Q&A chat endpoint
│   │   └── history/          # User analysis history
│   ├── components/           # React UI components
│   │   ├── ContractChat.tsx  # Floating AI chat UI
│   │   ├── NegotiationSection.tsx
│   │   ├── RiskyClausesPanel.tsx
│   │   └── ...
│   └── context/              # React context (Auth)
├── lib/
│   ├── agents/               # Multi-agent modules
│   │   ├── contractQAAgent.ts
│   │   ├── legalSimplifierAgent.ts
│   │   ├── negotiationAgent.ts
│   │   ├── orchestrator.ts
│   │   ├── riskDetectorAgent.ts
│   │   ├── logger.ts
│   │   └── types.ts
│   ├── report/               # PDF report generation
│   └── types.ts              # Shared TypeScript types
├── prisma/
│   └── schema.prisma         # Database schema
└── AGENTS.md                 # Agent architecture documentation
```

---

## 🔮 Future Enhancements

| Enhancement | Description |
|---|---|
| 🛡️ **Compliance Agent** | Agent 5 — check contract clauses against GDPR, CCPA, HIPAA requirements |
| 📷 **OCR Support** | Extract text from scanned PDF contracts using Vision AI |
| 🤝 **Team Collaboration** | Multi-user contract review with comments, annotations, and shared history |
| 🌍 **Multi-Language Support** | Analyze contracts in French, Spanish, German, and other languages |
| 🔔 **Contract Expiry Alerts** | Track renewal and termination deadlines with email notifications |
| 📊 **Organization Dashboard** | Aggregate risk analytics across all contracts for a company |
| 🔗 **API Access** | Public REST API for enterprise contract analysis integrations |

---

## 💼 Engineering Concepts Demonstrated

This project demonstrates production-grade engineering across multiple disciplines:

| Domain | Concepts Applied |
|---|---|
| **Multi-Agent Systems** | Sequential pipeline orchestration, graceful degradation, agent isolation, typed I/O contracts, structured AI output enforcement |
| **AI & Prompt Engineering** | Gemini API integration, system prompt design, JSON schema enforcement with Zod validation, automatic model fallback chains, grounding techniques |
| **Full-Stack Architecture** | Next.js App Router, server components vs client components, API route design, middleware patterns |
| **Authentication** | Firebase Authentication flow, server-side token verification with Admin SDK, protected API routes, user-scoped data access |
| **Database Design** | PostgreSQL schema design, Prisma ORM with type-safe queries, relational data modelling for user-specific analysis history |
| **TypeScript** | End-to-end type safety, discriminated unions, generic agent result types, Zod schema inference |
| **Frontend Engineering** | Complex React state management, optimistic UI updates, real-time chat with conversation history, floating UI patterns, responsive design |
| **Error Handling** | Graceful degradation, structured error boundaries, retry logic with exponential backoff, user-friendly error messaging |
| **Performance** | Parallel agent execution consideration, token budget management, response streaming architecture |
| **Security** | Auth token verification on every endpoint, input sanitization, contract text size limits, rate limiting patterns |

---

## 📁 Key Files Reference

| File | Purpose |
|---|---|
| `lib/agents/orchestrator.ts` | Central pipeline coordinator for the 3-agent analysis flow |
| `lib/agents/riskDetectorAgent.ts` | Agent 1 — risk scoring and clause extraction |
| `lib/agents/legalSimplifierAgent.ts` | Agent 2 — plain-English translation |
| `lib/agents/negotiationAgent.ts` | Agent 3 — negotiation strategy and clause improvement |
| `lib/agents/contractQAAgent.ts` | Agent 4 — contract-aware chat Q&A |
| `lib/agents/types.ts` | Shared TypeScript types for all agent I/O |
| `app/api/analyze/route.ts` | Main analysis API route |
| `app/api/contract-qa/route.ts` | Chat Q&A API route |
| `app/components/ContractChat.tsx` | Floating chat UI with slide-in drawer |
| `app/components/NegotiationSection.tsx` | Negotiation guidance display |
| `lib/report/buildRiskReportHtml.ts` | PDF report HTML generation |
| `AGENTS.md` | Full agent architecture documentation |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ using Next.js, Gemini AI, and TypeScript**

*LexGuard AI is not a substitute for qualified legal counsel.*
*Always consult a licensed attorney before signing any legal agreement.*

---

⭐ If you found this project useful or interesting, please consider giving it a star!

</div>
