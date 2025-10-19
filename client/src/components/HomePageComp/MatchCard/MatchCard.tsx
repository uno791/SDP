// src/components/MatchCard/MatchCard.tsx
import { useState } from "react";
import styles from "./MatchCard.module.css";
import StatsBar from "../StatsBar/StatsBar";
import type { Scorer, StatMetric } from "../../../api/espn";
// src/components/MatchCard/MatchCard.tsx (CTA area)
import { Link } from "react-router-dom";

// ...
{/* <div className={styles.actions}>
  <Link
    to={`/matchviewer?id=${encodeURIComponent(id)}`}
    className={styles.viewBtn}
    onClick={(e) => e.stopPropagation()} // prevent toggling the accordion
  >
    Open Match Viewer
  </Link>
</div> */}


type Team = { name: string; score?: string; logo?: string };
type Props = {
  id: string;
  home: Team;
  away: Team;
  state: "pre" | "in" | "post";
  statusText: string;
  metrics: StatMetric[];
  saves?: { home?: number; away?: number; homeAbbr?: string; awayAbbr?: string };
  scorers: Scorer[];
};

export default function MatchCard({
  id,                // ⬅️ add this
  home,
  away,
  state,
  statusText,
  metrics,
  saves,
  scorers,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.card} data-state={state}>
      <button
        className={styles.header}
        onClick={() => setExpanded((x) => !x)}
        aria-expanded={expanded}
      >
        <div className={styles.team}>
          {home.logo && (
            <img
              src={home.logo}
              alt=""
              className={styles.logo}
              loading="lazy"
              decoding="async"
            />
          )}
          <span>{home.name}</span>
        </div>

        <div className={styles.center}>
          <span className={styles.score}>
            <b>{home.score ?? "-"}</b> <span className={styles.hyphen}>-</span>{" "}
            <b>{away.score ?? "-"}</b>
          </span>
          <span className={styles.status}>{statusText}</span>
        </div>

        <div className={`${styles.team} ${styles.right}`}>
          {away.logo && (
            <img
              src={away.logo}
              alt=""
              className={styles.logo}
              loading="lazy"
              decoding="async"
            />
          )}
          <span>{away.name}</span>
        </div>

        <span className={styles.chev} aria-hidden="true">
          {expanded ? "▾" : "▸"}
        </span>
      </button>

      {expanded && (state === "in" || state === "post") && (
        <div className={styles.expandArea}>
          <div className={styles.separator} />

          {/* ——— Dual stat bars ——— */}
          <div className={styles.statsWrap}>
            {metrics.map((m) => (
              <StatsBar
                key={m.key}
                label={m.label}
                leftValue={m.homeVal}
                rightValue={m.awayVal}
                leftPercent={m.homePct}
              />
            ))}

            {/* Add saves as a third row if present */}
            {saves && (
              <StatsBar
                label="Saves"
                leftValue={saves.home}
                rightValue={saves.away}
                leftPercent={
                  typeof saves.home === "number" && typeof saves.away === "number"
                    ? Math.round((saves.home / (saves.home + saves.away || 1)) * 100)
                    : undefined
                }
              />
            )}
          </div>

          {/* Scorers */}
          {scorers.length > 0 && (
            <>
              <div className={styles.separator} />
              <div className={styles.scorers}>
                <div className={styles.scorersTitle}>Scorers</div>
                <ul className={styles.scorerList}>
                  {scorers.map((s, i) => (
                    <li key={i} className={styles.scorerPill}>
                      {s.minute ? `${s.minute} – ` : ""}
                      {s.player}
                      {s.teamAbbr ? ` (${s.teamAbbr})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* ⬇️ New: Open Match Viewer CTA */}
          <div className={styles.actions}>
            <a
              href={`/matchviewer?id=${encodeURIComponent(id)}`}
              className={styles.viewBtn}
              onClick={(e) => e.stopPropagation()} // prevent any accidental toggles
            >
              Open Match Viewer
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
