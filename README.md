# DecisionEngine AI 🧠

> **Enterprise-grade AI Decision Intelligence Platform** — powered by **Groq (LLaMA 3.3 70B)** and **Supabase PostgreSQL**.

Eliminate decision paralysis, subjective bias, and delayed execution in high-stakes environments by converting raw, fragmented inputs into structured decision matrices, trade-off curves, risk scores, and fully explainable AI-backed recommendations.

---

## ✨ Features

| Feature | Description |
|---|---|
| **AI Multi-Criteria Decision Analysis (MCDA)** | Groq LLaMA 3.3 70B scores alternatives against weighted criteria with structured JSON output |
| **Trade-Off & Risk Profiling** | Interactive scatter plots and heatmaps comparing cost vs. impact and risk exposure |
| **What-If Simulation Engine** | Live sliders dynamically recalculate decision rankings without re-running AI |
| **Explainable AI (XAI) Reports** | Step-by-step justification: why the winner won, why alternatives failed, failure modes |
| **Multi-Domain Workspaces** | Strategic Operations, Product & Engineering, Finance, Healthcare, Supply Chain |
| **Decision Audit Trail** | Full history log of revisions, status changes, and execution tracking |

---

## 🏗️ Tech Stack

### Frontend
- **React 18** + **Vite** — fast HMR dev server
- **Tailwind CSS** — utility-first dark UI
- **Recharts** — interactive data visualizations
- **Lucide React** — icon library
- **React Router v6** — client-side routing
- **Axios** — API communication

### Backend
- **Node.js + Express.js** — REST API
- **Groq SDK** (`groq-sdk`) — LLaMA 3.3 70B via Groq Cloud
- **Supabase (PostgreSQL)** — managed database via `pg` client
- **Zod** — runtime schema validation
- **Helmet + express-rate-limit** — security hardening

---

## 📁 Project Structure

```
decision-engine-app/
├── .gitignore
├── README.md
├── frontend/
│   ├── .env                      ← VITE_API_BASE_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── services/
│       │   └── api.js
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── DecisionCard.jsx
│       │   ├── MCDAMatrixTable.jsx
│       │   ├── TradeOffChart.jsx
│       │   ├── SimulationSliderBar.jsx
│       │   ├── RiskBadge.jsx
│       │   └── ExplainableReportView.jsx
│       └── pages/
│           ├── LandingPage.jsx
│           ├── DashboardPage.jsx
│           ├── CreateDecisionPage.jsx
│           ├── DecisionDetailPage.jsx
│           ├── SimulationPage.jsx
│           └── HistoryAuditPage.jsx
└── backend/
    ├── .env                      ← GROQ_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
    ├── package.json
    ├── server.js
    ├── config/
    │   ├── db.js                 ← pg Pool via Supabase
    │   └── groq.js               ← Groq SDK client
    ├── controllers/
    │   └── decisionController.js
    ├── routes/
    │   └── decisionRoutes.js
    ├── services/
    │   └── aiService.js          ← Groq LLaMA 3.3 70B + MCDA simulation
    ├── validators/
    │   └── decisionValidator.js
    └── middleware/
        └── rateLimiter.js
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- A **Supabase** project ([supabase.com](https://supabase.com))
- A **Groq Cloud** API key ([console.groq.com](https://console.groq.com))

---

### 1. Clone / Open the Project

```bash
cd "AI Desicion"
```

### 2. Configure Backend Environment

Edit **`backend/.env`**:

```env
PORT=5000
GROQ_API_KEY=gsk_your_groq_api_key_here
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here
FRONTEND_URL=http://localhost:5173
```

> **Where to get these:**
> - `GROQ_API_KEY` → [console.groq.com/keys](https://console.groq.com/keys)
> - `SUPABASE_URL` + keys → Supabase Dashboard → **Project Settings → API**

### 3. Configure Frontend Environment

Edit **`frontend/.env`**:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Set Up Supabase Database

In your Supabase project, go to **SQL Editor** and run the following:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Decision models
CREATE TABLE IF NOT EXISTS decision_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  domain VARCHAR(100) NOT NULL,
  urgency VARCHAR(50) NOT NULL DEFAULT 'Medium',
  problem_statement TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alternatives
CREATE TABLE IF NOT EXISTS decision_alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID REFERENCES decision_models(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_cost NUMERIC(12, 2),
  time_to_implement_weeks INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criteria
CREATE TABLE IF NOT EXISTS decision_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID REFERENCES decision_models(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  weight INT CHECK (weight BETWEEN 1 AND 10),
  is_maximize BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analyses
CREATE TABLE IF NOT EXISTS decision_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID REFERENCES decision_models(id) ON DELETE CASCADE,
  recommended_option_id UUID REFERENCES decision_alternatives(id),
  overall_confidence_score NUMERIC(5, 2),
  mcda_scores JSONB NOT NULL DEFAULT '{}',
  risk_assessment JSONB NOT NULL DEFAULT '[]',
  explainable_recommendation JSONB NOT NULL DEFAULT '{}',
  raw_ai_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Demo user for development
INSERT INTO users (id, email, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@decisionengine.ai', 'Demo User')
ON CONFLICT (email) DO NOTHING;
```

### 5. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 6. Run the Application

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

---

## 🗺️ Application Routes

| Route | Page | Purpose |
|---|---|---|
| `/` | `LandingPage` | Marketing hero, feature overview, CTA |
| `/dashboard` | `DashboardPage` | Active decisions, status overview, stats |
| `/decisions/new` | `CreateDecisionPage` | 4-step wizard: context → options → criteria → review |
| `/decisions/:id` | `DecisionDetailPage` | MCDA matrix, AI report, trade-off charts |
| `/decisions/:id/simulate` | `SimulationPage` | Live weight sliders, real-time re-ranking |
| `/history` | `HistoryAuditPage` | Full audit trail with status filtering |

---

## 🔌 Backend API Reference

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/decisions` | Create a new decision model |
| `GET` | `/api/decisions` | List all decisions for the user |
| `GET` | `/api/decisions/:id` | Get full decision details (with alternatives, criteria, analysis) |
| `POST` | `/api/decisions/:id/analyze` | Trigger Groq AI MCDA analysis |
| `POST` | `/api/decisions/:id/simulate` | Run live weight-override simulation |
| `PATCH` | `/api/decisions/:id/status` | Update decision status |
| `DELETE` | `/api/decisions/:id` | Delete a decision |
| `GET` | `/health` | Health check endpoint |

---

## 🤖 AI Model Details

| Setting | Value |
|---|---|
| **Provider** | Groq Cloud |
| **Model** | `llama-3.3-70b-versatile` |
| **Output Format** | Structured JSON Schema (enforced) |
| **Temperature** | 0.3 (deterministic) |
| **Max Tokens** | 4096 |

The AI returns:
- Per-alternative criterion scores (0–10) with reasoning
- Weighted MCDA totals
- Risk assessment (LOW → CRITICAL) with mitigation strategies
- Executive summary + trade-off analysis
- Failure mode analysis
- Step-by-step action plan

---

## 🔒 Security

- All API keys stored **server-side only** — never exposed to the frontend
- CORS restricted to trusted frontend origins
- Parameterized SQL queries prevent injection attacks
- `express-rate-limit` on all routes (AI analysis: 10 req/min)
- `helmet` for HTTP security headers
- `X-User-ID` header for demo user isolation (replace with JWT for production)

---

## 📌 Decision Domains

- **Strategic Operations** — Vendor selection, M&A, office expansion
- **Product & Engineering** — Architecture migration, build vs. buy, feature prioritization
- **Finance & Procurement** — CapEx allocation, budget rebalancing
- **Personal & Career** — Career pivots, relocation decisions, asset allocation
- **Healthcare Operations** — Resource allocation, protocol selection
- **Supply Chain** — Supplier evaluation, logistics optimization

---

## 🚀 Production Deployment Notes

1. Set `NODE_ENV=production` in backend `.env`
2. Use Supabase **Connection Pooling** (Transaction mode, port 6543) for the DB connection
3. Set `FRONTEND_URL` to your deployed frontend domain in backend `.env`
4. Build the frontend: `npm run build` → deploy `dist/` to Vercel, Netlify, or Cloudflare Pages
5. Deploy backend to Railway, Render, or Fly.io

---

## 📄 License

MIT — built for enterprise and personal use.

