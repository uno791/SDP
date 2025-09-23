import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../config";
import styles from "./LiveUserMatchCard.module.css";

type Event = {
  id: number;
  minute: number;
  event_type: string;
  team_id?: number;
  player_name?: string;
  detail?: string;
};

type Team = {
  id: number;
  name: string;
};

type Match = {
  id: number;
  home_team: Team | null;
  away_team: Team | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  minute?: number | null;
};

type Props = {
  match: Match;
};

/* ---------------- STATS CALC ---------------- */
function calculateStats(events: Event[], homeTeamId: number, awayTeamId: number) {
  const base = { shotsOn: 0, shotsOff: 0 };

  const home = { ...base };
  const away = { ...base };

  const inc = (team: typeof home, key: keyof typeof base) => (team[key] += 1);

  for (const ev of events) {
    const team =
      ev.team_id === homeTeamId
        ? home
        : ev.team_id === awayTeamId
        ? away
        : null;

    if (!team) continue;

    switch (ev.event_type) {
      case "goal":
      case "shot_on_target":
        inc(team, "shotsOn");
        break;
      case "shot_off_target":
        inc(team, "shotsOff");
        break;
    }
  }

  const finish = (t: typeof home) => ({
    ...t,
    totalShots: t.shotsOn + t.shotsOff,
    shotAccuracy:
      t.shotsOn + t.shotsOff > 0
        ? Math.round((t.shotsOn / (t.shotsOn + t.shotsOff)) * 100)
        : 0,
  });

  return { home: finish(home), away: finish(away) };
}

/* ---------------- COMPONENT ---------------- */
export default function LiveUserMatchCard({ match }: Props) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    axios
      .get(`${baseURL}/matches/${match.id}/events`)
      .then((res) => setEvents(res.data.events || []))
      .catch((err) =>
        console.error(`[Frontend] Failed to fetch events for match ${match.id}:`, err)
      );
  }, [match.id]);

  const stats =
    match.home_team && match.away_team
      ? calculateStats(events, match.home_team.id, match.away_team.id)
      : { home: { shotsOn: 0, shotsOff: 0, totalShots: 0, shotAccuracy: 0 }, away: { shotsOn: 0, shotsOff: 0, totalShots: 0, shotAccuracy: 0 } };

  return (
    <div className={styles.card}>
      <div className={styles.summary}>
        <span className={styles.team}>{match.home_team?.name ?? "Team A"}</span>

        <span className={styles.score}>
          {match.home_score ?? 0} - {match.away_score ?? 0}
        </span>

        <span className={styles.team}>{match.away_team?.name ?? "Team B"}</span>

        <span className={styles.status}>
          {match.status === "in_progress" ? `${match.minute ?? 0}'` : "FT"}
        </span>
      </div>

      {/* Key stats preview */}
      <div className={styles.statsPreview}>
        <div>
          <strong>Shots On</strong>: {stats.home.shotsOn} - {stats.away.shotsOn}
        </div>
        <div>
          <strong>Shots Off</strong>: {stats.home.shotsOff} - {stats.away.shotsOff}
        </div>
        <div>
          <strong>Accuracy</strong>: {stats.home.shotAccuracy}% - {stats.away.shotAccuracy}%
        </div>
      </div>
    </div>
  );
}


/*import { useState } from "react";
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
}*/
