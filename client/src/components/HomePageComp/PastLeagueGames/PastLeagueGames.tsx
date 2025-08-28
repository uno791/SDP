import { useEffect, useState } from "react";
import { fetchScoreboard } from "../../../api/espn";
import type { ScoreboardResponse } from "../../../api/espn";
import MatchCard from "../MatchCard/MatchCard";
import styles from "./PastLeagueGames.module.css";

export default function PastLeagueGames() {
  const [data, setData] = useState<ScoreboardResponse | null>(null);

  useEffect(() => {
    fetchScoreboard(new Date()).then(setData).catch(console.error);
  }, []);

  const finals = (data?.events ?? []).filter(
    (e) => e.status?.type?.state === "post"
  );

  return (
    <section className={styles.wrap}>
      <h2>Past League Games</h2>
      <div className={styles.dayLabel}>
        {new Date().toLocaleDateString(undefined, {
          weekday: "long",
          day: "2-digit",
          month: "long",
        })}
      </div>

      {finals.length === 0 && (
        <div className={styles.empty}>No finished matches today.</div>
      )}

      {finals.map((ev) => {
        const comp = ev.competitions?.[0];
        const home = comp?.competitors?.find((c) => c.homeAway === "home");
        const away = comp?.competitors?.find((c) => c.homeAway === "away");
        const mk = (t: any) => ({
          name: t?.team?.shortDisplayName ?? "—",
          score: t?.score,
          logo: t?.team?.logo,
        });
        return (
          <MatchCard
            key={ev.id}
            id={ev.id}
            home={mk(home)}
            away={mk(away)}
            state={"post"}
            statusText={"FT"}
          />
        );
      })}
    </section>
  );
}
