import { FormEvent, useEffect, useRef, useState } from "react";
import { Agent, api, ApiError } from "../api/client";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolTrace?: string;
}

function welcomeMessage(agent: Agent): DisplayMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: `I'm ${agent.name}. ${agent.description ?? ""}`.trim(),
  };
}

function avatarLabel(agentKey: string): string {
  // 'cmo_agent' -> 'CMO'
  return agentKey.split("_")[0].toUpperCase();
}

export default function ChatPage({ onLogout }: { onLogout: () => void }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgentKey, setActiveAgentKey] = useState<string>("cmo_agent");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .listAgents()
      .then((list) => {
        setAgents(list);
        const initial = list.find((a) => a.agent_key === activeAgentKey) ?? list[0];
        if (initial) {
          setActiveAgentKey(initial.agent_key);
          setMessages([welcomeMessage(initial)]);
        }
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load agents.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  const activeAgent = agents.find((a) => a.agent_key === activeAgentKey);

  function switchAgent(agent: Agent) {
    if (agent.agent_key === activeAgentKey || sending) return;
    setActiveAgentKey(agent.agent_key);
    setConversationId(undefined);
    setMessages([welcomeMessage(agent)]);
    setError(null);
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg: DisplayMessage = { id: crypto.randomUUID(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await api.sendMessage({
        agentKey: activeAgentKey,
        content: userMsg.content,
        conversationId,
      });
      setConversationId(res.conversationId);

      const toolTrace = res.toolCalls.length
        ? res.toolCalls
            .map((t) => `Called tool "${t.tool_name}" → ${JSON.stringify(t.output)}`)
            .join("\n")
        : undefined;

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: res.content, toolTrace },
      ]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("shadow_access_token");
        onLogout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to reach SHADOW.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">SHADOW</div>
        {agents.map((agent) => (
          <div
            key={agent.agent_key}
            className={`nav-item${agent.agent_key === activeAgentKey ? " active" : ""}`}
            onClick={() => switchAgent(agent)}
            style={{ cursor: "pointer" }}
          >
            Chat — {avatarLabel(agent.agent_key)}
          </div>
        ))}
        <div className="nav-item">Dashboard</div>
        <div className="nav-item">Tasks</div>
        <div className="nav-item">Knowledge</div>
        <div style={{ marginTop: 32 }}>
          <button className="btn-secondary" onClick={() => { localStorage.removeItem("shadow_access_token"); onLogout(); }}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="agent-header">
          <div className="agent-avatar">{avatarLabel(activeAgentKey)}</div>
          <div>
            <div style={{ fontWeight: 700 }}>{activeAgent?.name ?? "SHADOW"}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {activeAgent?.role ?? "Executive agent"} — Advisory autonomy
            </div>
          </div>
        </div>

        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="chat-log" ref={logRef}>
            {messages.map((m) => (
              <div key={m.id}>
                <div className={`msg ${m.role}`}>{m.content}</div>
                {m.toolTrace && <div className="tool-trace">{m.toolTrace}</div>}
              </div>
            ))}
            {sending && <div className="msg assistant">{activeAgent?.name ?? "SHADOW"} is thinking…</div>}
          </div>

          {error && <div className="error-banner">{error}</div>}

          <form className="composer" onSubmit={handleSend}>
            <textarea
              placeholder={`Ask ${activeAgent?.name ?? "SHADOW"} anything in its domain…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button type="submit" className="btn-primary" disabled={sending}>
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
