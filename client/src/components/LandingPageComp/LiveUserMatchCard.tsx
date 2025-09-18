import { useState } from "react";
import styles from "./LiveUserMatchCard.module.css";

type Event = {
  id: number;
  minute: number;
  event_type: string;
  team_id?: number;
  player_name?: string;
  detail?: string;
};

type Match = {
  id: number;
  home_team: { id: number; name: string } | null;
  away_team: { id: number; name: string } | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  minute?: number | null;
  events: Event[];
};

const formatEventType = (raw: string) =>
  raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function LiveUserMatchCard({ match }: { match: Match }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.card}>
      <div className={styles.summary} onClick={() => setExpanded(!expanded)}>
        <span className={styles.team}>{match.home_team?.name ?? "Team A"}</span>

        <span className={styles.score}>
          {match.home_score ?? 0} - {match.away_score ?? 0}
        </span>

        <span className={styles.team}>{match.away_team?.name ?? "Team B"}</span>

        <span className={styles.status}>
          {match.status === "in_progress" ? `${match.minute ?? 0}'` : "FT"}
        </span>

        <span className={styles.arrow}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className={styles.timelineBox}>
          <h4 className={styles.timelineHeader}>Event Timeline</h4>
          {match.events.length === 0 ? (
            <p className={styles.noEvents}>No events yet</p>
          ) : (
            <ul className={styles.timeline}>
              {match.events.map((ev) => (
                <li key={ev.id}>
                  {ev.minute}' <strong>{formatEventType(ev.event_type)}</strong>
                  {ev.player_name ? ` – ${ev.player_name}` : ""}
                  {ev.detail ? ` | ${ev.detail}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
