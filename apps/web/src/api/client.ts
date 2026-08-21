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
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: unknown[];
  created_at: string;
}

export interface SendMessageResponse {
  conversationId: string;
  agentKey: string;
  content: string;
  toolCalls: { tool_name: string; input: Record<string, unknown>; output: Record<string, unknown> }[];
  model: string;
  provider: string;
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
  }) => request<{ accessToken: string; user: unknown }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  login: (payload: { email: string; password: string }) =>
    request<{ accessToken: string; user: unknown }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listAgents: () => request<Agent[]>("/agents"),

  sendMessage: (payload: { agentKey: string; content: string; conversationId?: string }) =>
    request<SendMessageResponse>("/chat/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  conversationHistory: (conversationId: string) =>
    request<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`),
};

export { ApiError, getToken };
