export interface AgentMeta {
  key: "ceo" | "coo" | "cto" | "cmo" | "cfo";
  agentKey: string; // backend agent_key, e.g. "cmo_agent"
  name: string;
  role: string;
  domain: string;
  accentVar: string; // CSS var name, e.g. "--agent-cmo"
  path: string;
  implemented: boolean;
  coreQuestion: string;
}

export const AGENTS: AgentMeta[] = [
  {
    key: "ceo",
    agentKey: "ceo_agent",
    name: "SHADOW CEO",
    role: "Chief Executive Officer",
    domain: "Strategic Direction",
    accentVar: "--agent-ceo",
    path: "/agents/ceo",
    implemented: false,
    coreQuestion: "Where should the company go, and why?",
  },
  {
    key: "coo",
    agentKey: "coo_agent",
    name: "SHADOW COO",
    role: "Chief Operating Officer",
    domain: "Execution",
    accentVar: "--agent-coo",
    path: "/agents/coo",
    implemented: false,
    coreQuestion: "How will it happen?",
  },
  {
    key: "cto",
    agentKey: "cto_agent",
    name: "SHADOW CTO",
    role: "Chief Technology Officer",
    domain: "Technology",
    accentVar: "--agent-cto",
    path: "/agents/cto",
    implemented: false,
    coreQuestion: "What technology supports the strategy?",
  },
  {
    key: "cmo",
    agentKey: "cmo_agent",
    name: "SHADOW CMO",
    role: "Chief Marketing Officer",
    domain: "Growth",
    accentVar: "--agent-cmo",
    path: "/agents/cmo",
    implemented: true,
    coreQuestion: "How do we attract, convert and retain customers?",
  },
  {
    key: "cfo",
    agentKey: "cfo_agent",
    name: "SHADOW CFO",
    role: "Chief Financial Officer",
    domain: "Financial Intelligence",
    accentVar: "--agent-cfo",
    path: "/agents/cfo",
    implemented: true,
    coreQuestion: "Is this financially sound?",
  },
];

export function agentByKey(key: string): AgentMeta | undefined {
  return AGENTS.find((a) => a.key === key);
}
