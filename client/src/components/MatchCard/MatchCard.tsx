import { useState } from "react";
import styles from "./MatchCard.module.css";
import StatsBar from "../StatsBar/StatsBar";
import StatDualCount from "../StatDualCount/StatDualCount";
import type { Scorer } from "../../api/espn";
import type { StatMetric } from "../../api/espn";

type Team = { name: string; score?: string; logo?: string };
type Props = {
  id: string;
  home: Team;
  away: Team;
  state: "pre" | "in" | "post";
  statusText: string;

  // supplied directly from the SCOREBOARD event (no extra fetch)
  metrics: StatMetric[];
  saves?: {
    home?: number;
    away?: number;
    homeAbbr?: string;
    awayAbbr?: string;
  };
  scorers: Scorer[];
};

export default function MatchCard({
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
          {home.logo && <img src={home.logo} alt="" className={styles.logo} />}
          <span>{home.name}</span>
        </div>

        <div className={styles.center}>
          <span className={styles.score}>
            <b>{home.score ?? "-"}</b> <span className={styles.hyphen}>-</span>{" "}
            <b>{away.score ?? "-"}</b>
          </span>
          <span className={styles.status}>{statusText}</span>
        </div>

        <div className={styles.team + " " + styles.right}>
          {away.logo && <img src={away.logo} alt="" className={styles.logo} />}
          <span>{away.name}</span>
        </div>

        <span className={styles.chev} aria-hidden="true">
          {expanded ? "▾" : "▸"}
        </span>
      </button>

      {expanded && (state === "in" || state === "post") && (
        <div className={styles.expandArea}>
          <div className={styles.separator} />

          {/* Bars: Possession + one fallback */}
          {metrics.length > 0 ? (
            <div className={styles.statsWrap}>
              {metrics.map((m) => (
                <StatsBar
                  key={m.key}
                  label={m.label}
                  percent={m.homePct}
                  rightLabel={
                    m.homePct !== undefined ? `${m.homePct}%` : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className={styles.loading}>Match stats unavailable.</div>
          )}

          {/* Saves as team counts */}
          {saves && (
            <>
              <div className={styles.separator} />
              <StatDualCount
                label="Saves"
                leftTag={saves.homeAbbr}
                leftValue={saves.home}
                rightTag={saves.awayAbbr}
                rightValue={saves.away}
              />
            </>
          )}

          {/* Scorers list from SCOREBOARD */}
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
        </div>
      )}
    </div>
  );
}
