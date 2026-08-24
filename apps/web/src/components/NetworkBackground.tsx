import { useMemo } from "react";

/**
 * Ambient, decorative-only background: a drifting grid plus a handful of
 * pulsing "data nodes". Pure CSS animation (no canvas/WebGL, no JS ticking),
 * so it costs nothing at runtime and fully respects prefers-reduced-motion
 * via the .shadow-bg rules in styles.css. aria-hidden — it carries no
 * information, so it must never be reachable by assistive tech or tab order.
 */
export default function NetworkBackground() {
  const nodes = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        top: `${Math.round(Math.random() * 100)}%`,
        left: `${Math.round(Math.random() * 100)}%`,
        delay: `${(Math.random() * 4.5).toFixed(2)}s`,
      })),
    [],
  );

  return (
    <div className="shadow-bg" aria-hidden="true">
      {nodes.map((n) => (
        <span
          key={n.id}
          className="node"
          style={{ top: n.top, left: n.left, animationDelay: n.delay }}
        />
      ))}
    </div>
  );
}
