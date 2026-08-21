-- Adds the second executive agent, cfo_agent, proving the agents table +
-- Python route pattern established for cmo_agent needs no schema change to
-- add another executive (spec section 51 / section 70 extensibility
-- requirement). No fake financial data is seeded — only the agent
-- definition row, per section 26/57.

INSERT INTO agents (agent_key, name, role, description, allowed_tools)
VALUES (
    'cfo_agent',
    'SHADOW CFO',
    'Chief Financial Officer',
    'Owns financial intelligence: where money comes from, where it goes, what can be afforded, what should be invested, and what financial risks exist.',
    '["evaluate_investment"]'::jsonb
);
