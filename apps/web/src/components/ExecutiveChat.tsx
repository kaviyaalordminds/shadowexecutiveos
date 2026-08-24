import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { api, ApiError, ToolCall } from "../api/client";
import { AgentMeta } from "../agentConfig";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  provider?: string;
}

interface ExecutiveChatProps {
  agent: AgentMeta;
  suggestedQuestions: string[];
  renderToolCall?: (call: ToolCall) => ReactNode;
}

/**
 * Shared "Executive AI Workspace" chat shell used by both CMO and CFO
 * pages (spec section 28/47 — one implementation, not duplicated per
 * agent). Tool-call output is rendered via the caller-supplied
 * renderToolCall, since a score_lead result and an evaluate_investment
 * result need different structured cards.
 */
export default function ExecutiveChat({ agent, suggestedQuestions, renderToolCall }: ExecutiveChatProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `I'm ${agent.name}. ${agent.coreQuestion} Ask me anything in my domain — I'll tell you plainly when I don't have real data instead of guessing.`,
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

  async function send(content: string) {
    if (!content.trim() || sending) return;
    const userMsg: DisplayMessage = { id: crypto.randomUUID(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await api.sendMessage({ agentKey: agent.agentKey, content, conversationId });
      setConversationId(res.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: res.content,
          toolCalls: res.toolCalls,
          provider: res.provider,
        },
      ]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to reach ${agent.name}.`);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  const accentStyle = { ["--agent-accent" as string]: `var(${agent.accentVar})` };

  return (
    <div className="card chat-panel" style={accentStyle}>
      <div className="chat-log" ref={logRef}>
        {messages.map((m) => (
          <div key={m.id}>
            <div className={`msg ${m.role}`}>{m.content}</div>
            {m.provider === "anthropic-stub" && (
              <div className="msg-meta">Offline stub — no ANTHROPIC_API_KEY configured, no live reasoning was performed</div>
            )}
            {m.toolCalls && m.toolCalls.length > 0 && renderToolCall && (
              <div className="stack-8" style={{ marginTop: 8 }}>
                {m.toolCalls.map((call, i) => (
                  <div key={i}>{renderToolCall(call)}</div>
                ))}
              </div>
            )}
          </div>
        ))}
        {sending && <div className="msg assistant">{agent.name} is thinking…</div>}
      </div>

      <div className="suggested-questions">
        {suggestedQuestions.map((q) => (
          <button key={q} type="button" className="suggested-chip" disabled={sending} onClick={() => send(q)}>
            {q}
          </button>
        ))}
      </div>

      {error && (
        <div className="error-banner" role="alert" style={{ margin: "0 20px 12px" }}>
          {error}
        </div>
      )}

      <form className="composer" onSubmit={handleSubmit}>
        <textarea
          aria-label={`Message ${agent.name}`}
          placeholder={`Ask ${agent.name} anything in its domain…`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as FormEvent);
            }
          }}
        />
        <button type="submit" className="btn-primary" disabled={sending}>
          Send
        </button>
      </form>
    </div>
  );
}
