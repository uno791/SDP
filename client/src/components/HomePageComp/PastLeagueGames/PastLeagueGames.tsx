// src/components/HomePageComp/PastLeagueGames/PastLeagueGames.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchScoreboard,
  type ScoreboardResponse,
  extractStatsFromScoreboardEvent,
} from "../../../api/espn";
import MatchCard from "../MatchCard/MatchCard";
import styles from "./PastLeagueGames.module.css";

/** Compare two dates at "day" precision (ignoring time) */
function compareDay(a: Date, b: Date) {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return aa === bb ? 0 : aa < bb ? -1 : 1;
}

export default function PastLeagueGames() {
  const [date, setDate] = useState<Date>(new Date());
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);

  const hasLive = useMemo(
    () => (data?.events ?? []).some((ev) => ev?.status?.type?.state === "in"),
    [data]
  );

  const [visible, setVisible] = useState<boolean>(() => !document.hidden);
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const load = useCallback(async () => {
    try {
      const sb = await fetchScoreboard(date);
      setData(sb);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load scoreboard");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [date, load]);

  const timerRef = useRef<number | null>(null);
  const pollingRef = useRef<boolean>(false);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    if (!visible) {
      clearTimer();
      return;
    }

    const normalDelayMs = hasLive ? 10_000 : 60_000;

    const tick = async () => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      try {
        await load();
        timerRef.current = window.setTimeout(tick, normalDelayMs);
      } catch {
        timerRef.current = window.setTimeout(tick, 5_000);
      } finally {
        pollingRef.current = false;
      }
    };

    timerRef.current = window.setTimeout(tick, normalDelayMs);
    return clearTimer;
  }, [hasLive, visible, load]);

  const cards = useMemo(() => {
    const cmp = compareDay(date, today);
    const events = (data?.events ?? []).filter((ev) => {
      const st = ev.status?.type;
      const isCompleted = !!st?.completed || st?.state === "post";
      const isUpcoming = st?.state === "pre" && !st?.completed;

      if (cmp > 0) {
        return isUpcoming;
      } else {
        return isCompleted;
      }
    });

    events.sort((a, b) => +new Date(a.date) - +new Date(b.date));

    return events.map((ev) => {
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
        cmp > 0
          ? new Date(ev.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : status?.detail ?? "FT";

      const details = extractStatsFromScoreboardEvent(ev);

      return (
        <MatchCard
          key={ev.id}
          id={ev.id}
          home={mkTeam(home)}
          away={mkTeam(away)}
          state={status?.state as any}
          statusText={statusText}
          metrics={details.metrics}
          saves={details.saves}
          scorers={details.scorers}
        />
      );
    });
  }, [data, date, today]);

  return (
    <section className={styles.wrap}>
      <div className={styles.headerRow}>
        <h2>League Games</h2>
        <div className={styles.dateNav}>
          <button
            onClick={() =>
              setDate(
                (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
              )
            }
            aria-label="Previous day"
          >
            ◀
          </button>

          {/* Styled fake date label */}
          <button
            type="button"
            className={styles.dateLabel}
            onClick={() => {
              const input = document.getElementById(
                "leagueDateInput"
              ) as HTMLInputElement;
              input?.showPicker?.();
              input?.click();
            }}
          >
            {date.toLocaleDateString(undefined, {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </button>

          {/* Hidden native input */}
          <input
            id="leagueDateInput"
            type="date"
            className={styles.hiddenDateInput}
            value={date.toISOString().split("T")[0]}
            onChange={(e) => setDate(new Date(e.target.value))}
          />

          <button
            onClick={() =>
              setDate(
                (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
              )
            }
            aria-label="Next day"
          >
            ▶
          </button>
        </div>
      </div>

      {loading && <div className={styles.skel}>Loading…</div>}
      {err && <div className={styles.err}>{err}</div>}

      {!loading && !err && cards.length === 0 && (
        <div className={styles.muted}>
          {compareDay(date, today) > 0
            ? "No scheduled matches for this date."
            : "No finished matches for this date."}
        </div>
      )}
      {!loading && !err && cards}
    </section>
  );
}
