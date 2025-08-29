// src/components/HomePageComp/LiveLeagueGames/LiveLeagueGames.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchScoreboard,
  type ScoreboardResponse,
  extractStatsFromScoreboardEvent,
} from "../../../api/espn";
import MatchCard from "../MatchCard/MatchCard";
import styles from "./LiveLeagueGames.module.css";

/**
 * Live-only view:
 * - No date changer (always "today")
 * - Filters to non-completed events only (state: "pre" or "in")
 * - Dynamic polling:
 *   • 10s when any match is "in"
 *   • 60s otherwise
 *   • pause when tab hidden
 *   • 5s retry after errors
 */
export default function LiveLeagueGames() {
  // fixed "today" anchor for this component
  const today = useMemo(() => new Date(), []);
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  // visibility (pause polling when tab is hidden)
  const [visible, setVisible] = useState<boolean>(() => !document.hidden);
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // load function
  const load = useCallback(async () => {
    try {
      const sb = await fetchScoreboard(today);
      setData(sb);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load scoreboard");
    } finally {
      setLoading(false);
    }
  }, [today]);

  // initial load
  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // derived: live/upcoming events only
  const liveEvents = useMemo(() => {
    const all = data?.events ?? [];
    return all.filter((ev) => {
      const st = ev.status?.type;
      const completed = !!st?.completed || st?.state === "post";
      return !completed; // keep "pre" + "in"
    });
  }, [data]);

  // compute hasLive for polling cadence (based on filtered list)
  const hasLive = useMemo(
    () => liveEvents.some((ev) => ev?.status?.type?.state === "in"),
    [liveEvents]
  );

  /**
   * Dynamic poller (unchanged logic)
   */
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

  // Build cards (same UI as before)
  const cards = useMemo(() => {
    return liveEvents.map((ev) => {
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
  }, [liveEvents]);

  return (
    <section className={styles.wrap}>
      <div className={styles.headerRow}>
        <h2>Live League Games</h2>

        {/* Removed date changer; show today's label only (optional) */}
        <div className={styles.dateLabel}>
          {today.toLocaleDateString(undefined, {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
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
        <div className={styles.muted}>No live or upcoming games today.</div>
      )}
      {!loading && !err && cards}
    </section>
  );
}
