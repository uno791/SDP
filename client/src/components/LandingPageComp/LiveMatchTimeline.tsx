import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../config";
import styles from "./LiveMatchTimeline.module.css";

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
  home_team?: { id: number; name: string } | null;
  away_team?: { id: number; name: string } | null;
  events: Event[];
};

export default function LiveMatchTimeline({ matchId }: { matchId: number }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${baseURL}/matches/${matchId}`)
      .then((res) => {
        setMatch(res.data.match);
      })
      .catch((err) => console.error("Failed to fetch match details:", err))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) return <p className={styles.loading}>Loading timeline...</p>;
  if (!match) return <p className={styles.empty}>No match found.</p>;
  if (!match.events || match.events.length === 0)
    return <p className={styles.empty}>No events yet.</p>;

  const getTeamName = (teamId?: number) => {
    if (!teamId) return "";
    if (teamId === match.home_team?.id) return match.home_team?.name ?? "";
    if (teamId === match.away_team?.id) return match.away_team?.name ?? "";
    return "";
  };

  return (
    <div className={styles.timeline}>
      <h4 className={styles.heading}>
        {match.home_team?.name} vs {match.away_team?.name}
      </h4>
      <ul className={styles.list}>
        {match.events.map((ev) => {
          const isHome = ev.team_id === match.home_team?.id;
          return (
            <li
              key={ev.id}
              className={`${styles.item} ${
                isHome ? styles.left : styles.right
              }`}
            >
              <div className={styles.eventContent}>
                <span className={styles.minute}>{ev.minute}'</span>
                <span className={styles.type}>
                  {ev.event_type.replace(/_/g, " ")}
                </span>
                {ev.player_name && (
                  <span className={styles.player}> — {ev.player_name}</span>
                )}
                {ev.team_id && (
                  <span className={styles.team}>
                    {" "}
                    ({getTeamName(ev.team_id)})
                  </span>
                )}
                {ev.detail && (
                  <span className={styles.detail}> | {ev.detail}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
