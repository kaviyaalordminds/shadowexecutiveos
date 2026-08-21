# SHADOW Executive OS — vertical slice

This is a **working, runnable proof of the SHADOW Executive OS architecture**
described in the full 70-section spec — not the complete platform. It was
built as a deliberately thin end-to-end slice through every architectural
layer the spec calls for, so the architecture itself is validated with real
code before investing in the other three executives, desktop/mobile shells,
and the remaining ~25 modules.

## What's real here

- **Postgres** (`database/migrations/`) — real schema: `organizations`,
  `users`, `agents`, `conversations`, `messages`, `leads`, `audit_logs`. UUIDs,
  FKs, indexes, no fake seeded KPI/financial data (per spec section 26/57 —
  never invent values).
- **Node.js API gateway** (`services/api`, NestJS + TypeScript) — real bcrypt
  password hashing, JWT session issuance, parameterized SQL (no ORM magic,
  no injection surface), structured error handling with error IDs
  (section 45), real audit logging on every auth event and every agent tool
  call (section 46). Chat/agent routes are agent-key generic — they were not
  touched to add the second agent below, which is the concrete proof of the
  "no rewrite to add an agent" requirement (section 70).
- **Python AI service** (`services/ai`, FastAPI) — the `AIProvider`
  abstraction from section 65 with a real `AnthropicProvider`, a
  `model_router` stub (section 66), and two fully wired agents: **cmo_agent**
  and **cfo_agent**. Internal API is protected by a shared-secret header so
  only the Node gateway can call it (section 41: agents are privileged
  components, not public endpoints).
- **cmo_agent** — system prompt lives in `agents/cmo/system_prompt.md` (the
  same file layout as spec section 49), and exposes one real function-calling
  tool, `score_lead`, which is the `linkedin-lead-analyzer` rubric
  (auditable, rule-based, no hidden LLM call inside the tool) rather than a
  guessed score. This is the concrete answer to "how does
  linkedin-lead-analyzer fit into SHADOW": it's a **CMO tool**, not a
  separate product.
- **cfo_agent** — system prompt lives in `agents/cfo/system_prompt.md`, and
  exposes one real function-calling tool, `evaluate_investment`, which turns
  user-supplied cost/revenue projections into ROI, payback period, and a
  financial risk tier via plain, auditable arithmetic (spec section 9's
  Budget Management / Financial Decision Engine) — every output is labeled
  as a restated `ASSUMPTION` (the inputs) or computed `ANALYSIS` (the
  arithmetic), never a fabricated `FACT`, per section 3.2.
- **React + TypeScript frontend** (`apps/web`) — real login/register flow,
  a chat interface that fetches the live agent list and lets the user switch
  between SHADOW CMO and SHADOW CFO with streaming-ready plumbing (currently
  request/response, not SSE — see "Not built yet"), and the burgundy/pale-white
  design tokens from section 8 applied for real (see screenshot below).
- **End-to-end verified**, not just "should work": register → JWT issued →
  agent list fetched → chat message sent → Postgres row for user message →
  AI service call → Postgres row for assistant reply → audit log rows for
  `auth.register` / `auth.login` / `agent.tool_call` → same flow driven
  through a real headless Chromium browser via Playwright.

## What's intentionally stubbed or deferred

- **Only `cmo_agent` and `cfo_agent` are wired.** `ceo_agent`, `coo_agent`,
  `cto_agent` are not implemented — the point of this slice was proving the
  pattern works end to end through every layer with a first agent, then
  proving a second agent needs no architectural change, not shipping five
  shallow ones. Adding another agent is: a new
  `agents/<key>/system_prompt.md`, a new `app/agents/<key>_agent.py` runner
  (copy `cfo_agent.py`), a seed row in the `agents` table (see
  `database/migrations/002_seed_cfo_agent.sql` as a template), and a route in
  `services/ai/app/main.py`. No API gateway or frontend change required —
  this was one of the spec's hard requirements (section 70: future agents
  must plug in without a rewrite).
- **No live model calls without a key.** `ANTHROPIC_API_KEY` is unset by
  default; `AnthropicProvider` falls back to a clearly-labeled offline stub
  so the whole system is runnable and testable without any external
  credentials. Set the key in `services/ai/.env` for real Claude responses
  (and real tool-use, which the stub can't demonstrate).
- **No orchestrator, no War Room, no multi-agent routing** (sections 18–21) —
  the user picks an agent from the sidebar and talks to it directly; nothing
  yet routes one request across both cmo_agent and cfo_agent or synthesizes
  their answers.
- **No desktop/mobile shells, no WebSockets, no RAG/pgvector, no RBAC beyond
  a `role` column, no i18n layer, no CI.** All real, all deferred — see
  "Suggested next slices" below.

## Run it

Prerequisites: Node 18+, Python 3.11+, PostgreSQL 14+ (or Docker).

```bash
# 1. Database (either works)
docker compose up -d postgres
#   — or, if you have a local Postgres —
createuser shadow --pwprompt   # password: shadow_dev_password (or edit .env)
createdb shadow_os -O shadow
psql -d shadow_os -f database/migrations/001_init.sql
psql -d shadow_os -f database/migrations/002_seed_cfo_agent.sql

# 2. AI service
cd services/ai
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../../.env.example .env   # edit ANTHROPIC_API_KEY if you have one
uvicorn app.main:app --port 8000 --reload

# 3. API gateway (new terminal)
cd services/api
npm install
npm run build && npm run start   # or: npm run start:dev

# 4. Web app (new terminal)
cd apps/web
npm install
npm run dev   # http://localhost:5173
```

Then open `http://localhost:5173`, register with organization slug
`demo-org` (seeded by the migration), and use the sidebar to switch between
SHADOW CMO and SHADOW CFO.

Try with SHADOW CMO: *"Score this lead: Acme Corp. Their LinkedIn post says:
we're hiring, our website still says coming soon, and we're looking for a
marketing agency."*

Try with SHADOW CFO: *"Evaluate whether we should spend $12,000 upfront plus
$500/month on a new CRM, expecting $2,000/month in savings."*

## Suggested next slices (in priority order)

1. **shadow_orchestrator + routing engine** (sections 18–19) — now that
   ≥2 agents exist, route one user request to multiple agents (e.g. "should
   we launch product X" → CMO market read + CFO financial read) and
   synthesize a combined answer, per the Cross-Functional Decision Engine
   (section 11).
2. **Third agent (`ceo_agent` or `coo_agent`)** — extends the same
   no-rewrite pattern; `ceo_agent` in particular unblocks the Executive
   Synthesis / conflict-resolution flows (sections 25–26), which need a
   coordinating agent above CMO/CFO.
3. **RBAC enforcement** — the `role` column exists; nothing currently checks
   it. Add a `RolesGuard` + `@Roles()` decorator in the API gateway.
4. **Streaming** — swap the chat request/response for SSE or WebSocket so
   responses render token-by-token (section 43).
5. **RAG** — `pgvector` extension + `document_chunks` table + an ingestion
   pipeline, per section 32.

## Repo layout

```
shadow-executive-os/
├── apps/web/              React + TypeScript frontend
├── services/api/          Node.js + TypeScript API gateway (NestJS)
├── services/ai/           Python AI service (FastAPI) + cmo_agent + cfo_agent
├── agents/cmo/             cmo_agent's system prompt + tool docs
├── agents/cfo/             cfo_agent's system prompt + tool docs
├── database/migrations/    Postgres schema + agent seed data
├── docker-compose.yml      Postgres for local dev
└── .env.example            All required environment variables, documented
```
