# Autonomous AI Project Manager (Enterprise Platform)

An advanced, enterprise-grade, AI-native project management platform designed to move beyond traditional CRUD task trackers into autonomous, agentic software engineering management.

The platform employs a multi-agent architecture powered by **LangGraph** and **Google Gemini** to assist human engineering teams across the entire software development lifecycle—from raw product idea generation and automated task decomposition to dependency mapping, intelligent sprint planning, continuous risk monitoring, and automated code reviews.

---

## 🛡️ Human-in-the-Loop Governance Model

To maintain strict system security and data integrity:
- AI agents analyze state, deliberate in LangGraph StateGraphs, and propose mutations via guarded tools.
- Direct database mutations require **explicit human approval** through the Action Proposal & Approvals Center.
- Complete audit logging records agent deliberations, confidence scores, and reasoning.

---

## 🛠️ Locked-in Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router), React, JSX, Tailwind CSS, shadcn/ui | High-performance, responsive engineering dashboard |
| **Main Backend** | Next.js API Route Handlers | Secure mutations, database orchestration, auth |
| **AI Backend** | Python 3.12, FastAPI, Uvicorn | High-throughput asynchronous multi-agent coordination |
| **AI & Orchestration** | LangGraph, LangChain, Google Gemini Pro & Flash | Multi-agent state machine, tool-calling, and reasoning |
| **Database & RAG** | Neon PostgreSQL + `pgvector` | Relational project data + contextual semantic search |
| **ORM** | Prisma (Node.js runtime) | Exclusively managed type-safe database layer |
| **Cache & Realtime** | Redis + Server-Sent Events (SSE) | Pub/sub, token caching, live agent streaming updates |
| **Authentication** | Better Auth | Session management, RBAC, OAuth |
| **Visualizations** | Recharts & React Flow (@xyflow/react) | Sprint burndown, velocity, and dependency DAG diagrams |
| **Validation** | Zod (JS) + Pydantic (Python) | End-to-end schema validation |

---

## 📂 Repository Architecture

```
ai-project-manager/
├── .env                  # Root environment config
├── .gitignore             # Root gitignore (Node.js & Next.js)
├── package.json           # Next.js & Frontend dependencies
├── next.config.js         # Next.js configuration
├── middleware.js          # Route protection & audit headers
├── app/                   # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register, reset-password)
│   ├── (dashboard)/       # Application routes & project sub-views
│   ├── api/               # Next.js REST & SSE API endpoints
│   ├── layout.jsx         # Root app layout
│   ├── globals.css        # Tailwind & theme variables
│   └── page.jsx           # Landing / Hero page
├── components/            # Reusable UI & domain components
│   ├── ui/                # Base design system primitives
│   ├── layout/            # Sidebar, Header, DashboardShell
│   ├── project/           # Project cards & summary
│   ├── task/              # Task cards & detail modal
│   ├── kanban/            # Kanban board & columns
│   ├── sprint/            # Sprint planning board
│   ├── ai/                # Agent stream & approval cards
│   ├── risk/              # Risk matrix & mitigations
│   ├── architecture/      # React Flow dependency diagram
│   └── analytics/         # Recharts burndown & velocity
├── hooks/                 # Custom React hooks (SSE streaming, project state)
├── context/               # React contexts (Auth, Project)
├── lib/                   # Shared utilities (Prisma, Auth, Redis, AI client)
├── prisma/                # Prisma schema with pgvector & seed script
├── ai-backend/            # Python 3.12 FastAPI + LangGraph AI microservice
│   ├── .gitignore         # Python-specific gitignore (.venv, cache)
│   ├── requirements.txt   # LangGraph, Gemini, FastAPI dependencies
│   ├── main.py            # FastAPI entry point
│   ├── agents/            # Specialized agents (Supervisor, Product, Task, etc.)
│   ├── workflows/         # LangGraph StateGraphs
│   ├── tools/             # Guarded API tool callers
│   ├── services/          # Gemini LLM & Embedding services
│   └── schemas/           # Pydantic data schemas
└── tests/                 # Frontend & E2E tests
```

---

## 🤖 Multi-Agent LangGraph Swarm

1. **Supervisor Agent**: Top-level coordinator routing tasks and monitoring execution state.
2. **Product Agent**: Synthesizes raw ideas into Product Requirement Documents (PRDs) and user stories.
3. **Task Agent**: Decomposes features into discrete, actionable engineering tasks with acceptance criteria.
4. **Dependency Agent**: Builds dependency directed acyclic graphs (DAGs), detects circular blockers, and calculates critical paths.
5. **Sprint Agent**: Balances team velocity, historical capacity, and story points into optimized sprints.
6. **Risk Agent**: Continuously evaluates scope creep, technical complexity, and architectural risks.
7. **Developer Agent**: Formulates technical implementation blueprints, architecture specs, and schemas.
8. **Review Agent**: Automates code reviews, security scans, and PR feedback.
9. **Standup Agent**: Generates asynchronous standup summaries, blockers, and project momentum metrics.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js >= 18.x
- Python >= 3.12
- PostgreSQL (with `pgvector` enabled) or Neon Postgres URL
- Redis instance (local or cloud)

### 2. Frontend & Next.js Setup
```bash
# Install dependencies
npm install

# Initialize Prisma Client & push schema
npm run prisma:generate
npm run prisma:migrate

# Start Next.js development server
npm run dev
```

### 3. AI Backend (Python & LangGraph) Setup
```bash
cd ai-backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux / macOS:
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run AI backend service
python main.py
```
