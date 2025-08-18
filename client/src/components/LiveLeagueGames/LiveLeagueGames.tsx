import { useEffect, useMemo, useState } from "react";
import { fetchScoreboard } from "../../api/espn";
import type { ScoreboardResponse } from "../../api/espn";
import MatchCard from "../MatchCard/MatchCard";
import styles from "./LiveLeagueGames.module.css";

export default function LiveLeagueGames() {
  const [date, setDate] = useState<Date>(new Date());
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const sb = await fetchScoreboard(date);
        if (!ignore) setData(sb);
      } catch (e: any) {
        if (!ignore) setErr(e?.message ?? "Failed to load");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [date]);

  const { live, upcoming } = useMemo(() => {
    const live: any[] = [];
    const upcoming: any[] = [];
    (data?.events ?? []).forEach((ev) => {
      const comp = ev.competitions?.[0];
      const status = ev.status?.type;
      const home = comp?.competitors?.find((c) => c.homeAway === "home");
      const away = comp?.competitors?.find((c) => c.homeAway === "away");
      const mkTeam = (t: any) => ({
        name: t?.team?.shortDisplayName ?? "—",
        score: t?.score,
        logo: t?.team?.logo,
      });

      const statusText =
        status?.state === "pre"
          ? new Date(ev.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : status?.detail ?? "";

      const card = (
        <MatchCard
          key={ev.id}
          id={ev.id}
          home={mkTeam(home)}
          away={mkTeam(away)}
          state={status?.state as any}
          statusText={statusText}
        />
      );

      if (status?.state === "in") live.push(card);
      else upcoming.push(card);
    });
    return { live, upcoming };
  }, [data]);

  return (
    <section className={styles.wrap}>
      <div className={styles.headerRow}>
        <h2>Live League Games</h2>
        <div className={styles.dateNav}>
          <button
            onClick={() =>
              setDate(
                (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
              )
            }
          >
            ◀
          </button>
          <span className={styles.dateLabel}>
            {date.toLocaleDateString(undefined, {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </span>
          <button
            onClick={() =>
              setDate(
                (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
              )
            }
          >
            ▶
          </button>
        </div>
      </div>

      {loading && <div className={styles.skel}>Loading…</div>}
      {err && <div className={styles.err}>{err}</div>}

      {!loading && !err && (
        <>
          {live.length > 0 ? (
            live
          ) : (
            <div className={styles.muted}>No live games</div>
          )}
          {upcoming.length > 0 && (
            <>
              <h3 className={styles.subhead}>
                More on {date.toLocaleDateString()}
              </h3>
              {upcoming}
            </>
          )}
        </>
      )}
    </section>
  );
}
