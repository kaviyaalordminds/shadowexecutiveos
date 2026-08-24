/**
 * Thin, typed fetch wrapper for the Node.js API gateway. All calls go
 * through here so auth-token attachment and error normalization happen in
 * one place — no component talks to `fetch` directly.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

export interface Agent {
  id: string;
  agent_key: string;
  name: string;
  role: string;
  description: string;
  status: string;
  autonomy_level: string;
}

export interface CurrentUser {
  id: string;
  organizationId: string;
  email: string;
  displayName: string;
  role: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  created_at: string;
}

export interface ToolCall {
  tool_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

export interface SendMessageResponse {
  conversationId: string;
  agentKey: string;
  content: string;
  toolCalls: ToolCall[];
  model: string;
  provider: string;
}

export interface ScoreLeadResult {
  leadId: string;
  createdAt: string;
  company_name: string;
  score: number;
  tier: "Hot" | "Warm" | "Cold";
  rationale: string;
  signals: string[];
  suggested_message: string;
}

export interface EvaluateInvestmentResult {
  initiative_name: string;
  assumptions: {
    initial_cost: number;
    monthly_cost: number;
    expected_monthly_revenue: number;
    expected_monthly_savings: number;
    horizon_months: number;
  };
  analysis: {
    monthly_net_contribution: number;
    total_cost_over_horizon: number;
    total_benefit_over_horizon: number;
    net_return_over_horizon: number;
    roi_pct_over_horizon: number | null;
    payback_period_months: number | null;
  };
  risk_tier: "LOW" | "MEDIUM" | "HIGH" | "NEVER BREAKS EVEN";
  risk_reason: string;
  recommendation: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function getToken(): string | null {
  return localStorage.getItem("shadow_access_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  register: (payload: {
    email: string;
    password: string;
    displayName: string;
    organizationSlug: string;
  }) => request<{ accessToken: string; user: CurrentUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  login: (payload: { email: string; password: string }) =>
    request<{ accessToken: string; user: CurrentUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => request<CurrentUser>("/auth/me"),

  listAgents: () => request<Agent[]>("/agents"),

  sendMessage: (payload: { agentKey: string; content: string; conversationId?: string }) =>
    request<SendMessageResponse>("/chat/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  conversationHistory: (conversationId: string) =>
    request<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`),

  leads: () =>
    request<{ id: string; company_name: string; score: number; status: string; created_at: string }[]>(
      "/chat/leads",
    ),

  scoreLead: (payload: { companyName: string; sourceText: string }) =>
    request<ScoreLeadResult>("/chat/tools/score-lead", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  evaluateInvestment: (payload: {
    initiativeName: string;
    initialCost: number;
    monthlyCost?: number;
    expectedMonthlyRevenue?: number;
    expectedMonthlySavings?: number;
    horizonMonths?: number;
  }) =>
    request<EvaluateInvestmentResult>("/chat/tools/evaluate-investment", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export { ApiError, getToken };
