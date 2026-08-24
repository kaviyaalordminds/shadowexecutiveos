import ScoreRing from "./ScoreRing";

export interface LeadScoreData {
  company_name: string;
  score: number;
  tier: string;
  rationale: string;
  signals: string[];
  suggested_message: string;
}

const TIER_CLASS: Record<string, string> = { Hot: "hot", Warm: "warm", Cold: "cold" };

export default function LeadScoreCard({ data }: { data: LeadScoreData }) {
  const tierClass = TIER_CLASS[data.tier] ?? "neutral";
  return (
    <div className="tool-card enter">
      <div className="tool-card-head">
        <div>
          <div className="tool-card-title">{data.company_name}</div>
          <span className={`badge ${tierClass}`}>{data.tier} lead</span>
        </div>
        <ScoreRing value={data.score} size={64} color="var(--agent-accent, var(--magenta))" label="Lead score" />
      </div>

      <p className="response-section-body">{data.rationale}</p>

      {data.signals.length > 0 && (
        <div className="signal-list">
          {data.signals.map((s) => (
            <span key={s} className="signal-chip">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="draft-block">
        <span className="draft-label">Draft outreach — for human review, never sent automatically</span>
        {data.suggested_message}
      </div>
    </div>
  );
}
