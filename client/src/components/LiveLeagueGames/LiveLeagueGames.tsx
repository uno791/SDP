// src/components/LiveLeagueGames/LiveLeagueGames.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchScoreboard,
  type ScoreboardResponse,
  extractStatsFromScoreboardEvent,
} from "../../api/espn";
import MatchCard from "../MatchCard/MatchCard";
import styles from "./LiveLeagueGames.module.css";

/**
 * Dynamic polling strategy:
 * - 10s when any match has status.state === "in"
 * - 60s when no live matches (pre/post)
 * - Pauses when tab is hidden
 * - Short 5s retry after an error, then resumes normal cadence
 */
export default function LiveLeagueGames() {
  const [date, setDate] = useState<Date>(new Date());
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  // track if any game is live
  const hasLive = useMemo(
    () => (data?.events ?? []).some((ev) => ev?.status?.type?.state === "in"),
    [data]
  );

  // visibility (pause polling when tab is hidden)
  const [visible, setVisible] = useState<boolean>(() => !document.hidden);
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // load function (memoized)
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

  // initial load on date change
  useEffect(() => {
    setLoading(true);
    load();
  }, [date, load]);

  /**
   * Dynamic poller:
   * - re-evaluates when (date, hasLive, visible) change
   * - uses setTimeout so we can change cadence without re-creating intervals too often
   */
  const timerRef = useRef<number | null>(null);
  const pollingRef = useRef<boolean>(false);

  useEffect(() => {
    // clear any pending timer when deps change/unmount
    const clearTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    // if tab hidden, stop polling
    if (!visible) {
      clearTimer();
      return;
    }

    // choose cadence
    const normalDelayMs = hasLive ? 10_000 : 60_000;

    const tick = async () => {
      if (pollingRef.current) return; // prevent overlap
      pollingRef.current = true;
      try {
        await load();
        // on success: normal cadence
        timerRef.current = window.setTimeout(tick, normalDelayMs);
      } catch {
        // on error: short backoff then try again
        timerRef.current = window.setTimeout(tick, 5_000);
      } finally {
        pollingRef.current = false;
      }
    };

    // start loop
    timerRef.current = window.setTimeout(tick, normalDelayMs);

    // cleanup
    return clearTimer;
  }, [hasLive, visible, load]);

  // build cards
  const cards = useMemo(() => {
    return (data?.events ?? []).map((ev) => {
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
            aria-label="Previous day"
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
            aria-label="Next day"
          >
            ▶
          </button>
        </div>
      </div>

      {/* status row */}
      <div className={styles.statusRow}>
        <span
          className={styles.badge}
          data-live={hasLive ? "yes" : "no"}
        ></span>
        {!visible && <span className={styles.badge}>Paused (tab hidden)</span>}
      </div>

      {loading && <div className={styles.skel}>Loading…</div>}
      {err && <div className={styles.err}>{err}</div>}

      {!loading && !err && cards.length === 0 && (
        <div className={styles.muted}>No games for this date.</div>
      )}
      {!loading && !err && cards}
    </section>
  );
}
