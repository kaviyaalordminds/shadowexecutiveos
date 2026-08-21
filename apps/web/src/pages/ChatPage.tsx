import { FormEvent, useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolTrace?: string;
}

export default function ChatPage({ onLogout }: { onLogout: () => void }) {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I'm SHADOW CMO. Ask me anything about marketing/growth, or paste a LinkedIn company post and ask me to score it as a lead — I'll use the score_lead tool rather than guessing.",
    },
  ]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

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
        agentKey: "cmo_agent",
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
        <div className="nav-item active">Chat — CMO</div>
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
          <div className="agent-avatar">CMO</div>
          <div>
            <div style={{ fontWeight: 700 }}>SHADOW CMO</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Growth &amp; marketing executive — Advisory autonomy
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
            {sending && <div className="msg assistant">SHADOW CMO is thinking…</div>}
          </div>

          {error && <div className="error-banner">{error}</div>}

          <form className="composer" onSubmit={handleSend}>
            <textarea
              placeholder="Ask SHADOW CMO, or paste a LinkedIn post and ask for a lead score…"
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
