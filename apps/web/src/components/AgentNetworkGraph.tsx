import { useNavigate } from "react-router-dom";
import { AGENTS } from "../agentConfig";

interface Pos {
  x: number;
  y: number;
}

const HUB: Pos = { x: 320, y: 34 };
const ROW1: Record<string, Pos> = {
  ceo: { x: 130, y: 128 },
  coo: { x: 320, y: 128 },
  cto: { x: 510, y: 128 },
};
const SUB_HUB: Pos = { x: 320, y: 196 };
const ROW2: Record<string, Pos> = {
  cmo: { x: 250, y: 256 },
  cfo: { x: 390, y: 256 },
};

/**
 * Static SVG rendering of the executive hierarchy (spec section 33):
 * SHADOW -> Executive Intelligence -> CEO/COO/CTO -> CMO/CFO. Node color
 * reflects each agent's identity accent; a soft pulse ring marks agents
 * that are actually implemented. Clicking an implemented node opens it.
 */
export default function AgentNetworkGraph() {
  const navigate = useNavigate();

  return (
    <svg className="network-graph" viewBox="0 0 640 300" role="img" aria-label="Executive agent collaboration graph">
      <g className="link">
        <path d={`M${HUB.x},${HUB.y + 14} L${HUB.x},${ROW1.coo.y - 18}`} />
        <path d={`M${ROW1.ceo.x},${ROW1.ceo.y} L${HUB.x},${HUB.y + 14}`} />
        <path d={`M${ROW1.cto.x},${ROW1.cto.y} L${HUB.x},${HUB.y + 14}`} />
        <path d={`M${ROW1.ceo.x},${ROW1.ceo.y + 18} L${ROW1.ceo.x},${SUB_HUB.y} L${ROW1.cto.x},${SUB_HUB.y} L${ROW1.cto.x},${ROW1.cto.y + 18}`} />
        <path d={`M${SUB_HUB.x},${SUB_HUB.y} L${ROW2.cmo.x},${ROW2.cmo.y - 18}`} />
        <path d={`M${SUB_HUB.x},${SUB_HUB.y} L${ROW2.cfo.x},${ROW2.cfo.y - 18}`} />
      </g>

      <g className="node-group">
        <circle cx={HUB.x} cy={HUB.y} r={14} className="node-circle" stroke="var(--cyan)" />
        <text x={HUB.x} y={HUB.y + 4} className="node-label" fontSize={8}>
          SHADOW
        </text>
      </g>

      {(["ceo", "coo", "cto"] as const).map((key) => {
        const meta = AGENTS.find((a) => a.key === key)!;
        const pos = ROW1[key];
        return <AgentNode key={key} meta={meta} pos={pos} onOpen={() => meta.implemented && navigate(meta.path)} />;
      })}

      {(["cmo", "cfo"] as const).map((key) => {
        const meta = AGENTS.find((a) => a.key === key)!;
        const pos = ROW2[key];
        return <AgentNode key={key} meta={meta} pos={pos} onOpen={() => meta.implemented && navigate(meta.path)} />;
      })}
    </svg>
  );
}

function AgentNode({
  meta,
  pos,
  onOpen,
}: {
  meta: (typeof AGENTS)[number];
  pos: Pos;
  onOpen: () => void;
}) {
  const color = `var(${meta.accentVar})`;
  return (
    <g
      className="node-group"
      role={meta.implemented ? "button" : undefined}
      tabIndex={meta.implemented ? 0 : undefined}
      style={{ cursor: meta.implemented ? "pointer" : "default" }}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (meta.implemented && (e.key === "Enter" || e.key === " ")) onOpen();
      }}
      aria-label={`${meta.name} — ${meta.implemented ? "open" : "not implemented"}`}
    >
      {meta.implemented && <circle cx={pos.x} cy={pos.y} r={22} className="node-pulse" stroke={color} />}
      <circle cx={pos.x} cy={pos.y} r={22} className="node-circle" stroke={color} strokeOpacity={meta.implemented ? 1 : 0.35} />
      <text x={pos.x} y={pos.y + 3} className="node-label" fill={meta.implemented ? "var(--text)" : "var(--text-faint)"}>
        {meta.key.toUpperCase()}
      </text>
      <text x={pos.x} y={pos.y + 36} className="node-sub">
        {meta.implemented ? "active" : "n/a"}
      </text>
    </g>
  );
}
