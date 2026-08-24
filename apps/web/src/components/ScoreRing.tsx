interface ScoreRingProps {
  value: number | null; // 0-100, or null for unknown/no data
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}

export default function ScoreRing({ value, size = 84, stroke = 7, color = "var(--cyan)", label }: ScoreRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = value === null ? 0 : Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={label ? `${label}: ${value === null ? "unknown" : value}` : undefined}>
        <circle className="score-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        {value !== null && (
          <circle
            className="score-ring-value"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        )}
      </svg>
      <div className="score-ring-label" style={{ fontSize: size * 0.22, color: value === null ? "var(--text-faint)" : "var(--text)" }}>
        {value === null ? "N/A" : Math.round(value)}
      </div>
    </div>
  );
}
