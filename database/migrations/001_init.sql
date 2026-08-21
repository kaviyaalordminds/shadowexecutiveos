-- SHADOW Executive OS — vertical slice schema
-- Covers the minimum real entities needed to prove the architecture end to end:
-- organizations, users (auth), agents, conversations, messages, audit_logs,
-- and leads (backing the CMO agent's lead-scoring tool).
--
-- This is a deliberate subset of the full 30-table model in section 50 of the
-- spec. Every table added here follows the same conventions the full schema
-- must use: UUID primary keys, created_at/updated_at, soft-delete where it
-- makes sense, and FKs with sane ON DELETE behavior.

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- organizations — tenant boundary. Every other table hangs off org_id so
-- row-level isolation between tenants is enforceable later via RLS policies.
-- ---------------------------------------------------------------------------
CREATE TABLE organizations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- users — real auth: bcrypt hash only, never plaintext.
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    password_hash   TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'EXECUTIVE'
                        CHECK (role IN ('SUPER_ADMIN','ADMIN','EXECUTIVE','MANAGER','EMPLOYEE','VIEWER')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    UNIQUE (organization_id, email)
);

CREATE INDEX idx_users_org ON users(organization_id);

-- ---------------------------------------------------------------------------
-- agents — one row per executive agent (ceo_agent, coo_agent, ...).
-- Only cmo_agent is seeded for this slice; the router/UI treat this table as
-- the source of truth so adding cfo_agent etc. later is a data change, not a
-- code change (section 51 / future-agent extensibility requirement).
-- ---------------------------------------------------------------------------
CREATE TABLE agents (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_key         TEXT NOT NULL UNIQUE,        -- e.g. 'cmo_agent'
    name              TEXT NOT NULL,                -- e.g. 'SHADOW CMO'
    role              TEXT NOT NULL,                -- e.g. 'Chief Marketing Officer'
    description       TEXT,
    status            TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
    autonomy_level    TEXT NOT NULL DEFAULT 'ADVISORY' CHECK (autonomy_level IN ('ADVISORY','APPROVAL_REQUIRED','AUTONOMOUS')),
    model_provider    TEXT NOT NULL DEFAULT 'anthropic',
    model_name        TEXT NOT NULL DEFAULT 'claude-sonnet-4-5',
    temperature       NUMERIC(3,2) NOT NULL DEFAULT 0.40,
    allowed_tools     JSONB NOT NULL DEFAULT '[]',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- conversations / messages — chat persistence backing the chat interface.
-- ---------------------------------------------------------------------------
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    title           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_conversations_org_user ON conversations(organization_id, user_id);

CREATE TABLE messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role             TEXT NOT NULL CHECK (role IN ('user','assistant','system','tool')),
    content          TEXT NOT NULL,
    tool_calls       JSONB,
    tool_name        TEXT,
    token_usage      JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- leads — backs the CMO agent's lead-scoring tool (linkedin-lead-analyzer
-- logic exposed as a real function-call tool rather than a one-off script).
-- ---------------------------------------------------------------------------
CREATE TABLE leads (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id   UUID REFERENCES conversations(id) ON DELETE SET NULL,
    company_name      TEXT NOT NULL,
    source_text       TEXT NOT NULL,          -- raw pasted LinkedIn text/CSV row
    score             INTEGER CHECK (score BETWEEN 0 AND 100),
    score_rationale   TEXT,
    signals           JSONB NOT NULL DEFAULT '[]',
    suggested_message TEXT,
    status            TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','SCORED','QUALIFIED','DISMISSED')),
    created_by        UUID REFERENCES users(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_org ON leads(organization_id);

-- ---------------------------------------------------------------------------
-- audit_logs — every sensitive action (auth, agent tool execution) recorded.
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    actor_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type      TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user','agent','system')),
    action          TEXT NOT NULL,             -- e.g. 'auth.login', 'agent.tool_call'
    resource_type   TEXT,
    resource_id     UUID,
    metadata        JSONB NOT NULL DEFAULT '{}',
    ip_address      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_org_time ON audit_logs(organization_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Seed: one dev organization + the cmo_agent row. No fake KPI/financial data
-- is seeded — the spec is explicit that AI/UI must never invent values.
-- ---------------------------------------------------------------------------
INSERT INTO organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Org', 'demo-org');

INSERT INTO agents (agent_key, name, role, description, allowed_tools)
VALUES (
    'cmo_agent',
    'SHADOW CMO',
    'Chief Marketing Officer',
    'Drives market visibility, customer acquisition and growth. Core question: how do we attract, convert and retain customers?',
    '["score_lead"]'::jsonb
);
