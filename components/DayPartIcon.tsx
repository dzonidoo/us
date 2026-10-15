import type { DayPart } from "@/lib/messages";

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Line icons for the parts of the day: sunrise, full sun, sunset, moon. */
export function DayPartIcon({ part, className = "size-8" }: { part: DayPart; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {part === "jutro" && (
        <g {...STROKE}>
          {/* Sun rising over the horizon, arrow up */}
          <path d="M3 19h18M7 19a5 5 0 0 1 10 0" />
          <path d="M5.6 12.6l1.4 1.4M18.4 12.6 17 14M12 11v1.5" />
          <path d="M12 2.5v5M9.8 4.7 12 2.5l2.2 2.2" />
        </g>
      )}
      {part === "dan" && (
        <g {...STROKE}>
          {/* Full, strong sun */}
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
          <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
        </g>
      )}
      {part === "vece" && (
        <g {...STROKE}>
          {/* Sun setting below the horizon, arrow down */}
          <path d="M3 19h18M7 19a5 5 0 0 1 10 0" />
          <path d="M5.6 12.6l1.4 1.4M18.4 12.6 17 14M12 11v1.5" />
          <path d="M12 2.5v5M9.8 5.3 12 7.5l2.2-2.2" />
        </g>
      )}
      {part === "noc" && (
        <g {...STROKE}>
          {/* Crescent moon and a star */}
          <path d="M19.5 14.5A7.5 7.5 0 1 1 10 4.5a6 6 0 0 0 9.5 10Z" fill="currentColor" fillOpacity={0.15} />
          <path d="M17.5 3.5v3M16 5h3" />
        </g>
      )}
    </svg>
  );
}
