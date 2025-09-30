import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./LiveMatchCard.module.css";
import { Link } from "react-router-dom";

/* Adjust the import path if your API file lives elsewhere */
import type { ScoreboardResponse } from "../../api/espn";
import {
  fetchScoreboard,
  extractStatsFromScoreboardEvent,
} from "../../api/espn";

type Event = ScoreboardResponse["events"][number];

type GridProps = {
  /** Show the “Live now / Showing matches for YYYY-MM-DD” label above the grid */
  showLabel?: boolean;
};

/* ---------------- utils ---------------- */
const SA_TZ = "Africa/Johannesburg";

/** 24h time in South African time, no TZ label (e.g., "19:30") */
function timeZA(iso: string | number | Date) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SA_TZ,
  }).format(d);
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, delta: number) {
  const t = new Date(d);
  t.setDate(t.getDate() + delta);
  return t;
}
function sameYMD(a: Date, b: Date) {
  return ymd(a) === ymd(b);
}

/** Deduplicate events by ESPN event id */
function uniqueEvents(events: Event[] = []) {
  const m = new Map<string, Event>();
  for (const ev of events) if (!m.has(ev.id)) m.set(ev.id, ev);
  return Array.from(m.values());
}

/** Prefer scorer text built by your extractor; keep (p)/(OG); attach minute & team abbr */
function tidyScorer(s: any) {
  let name = (s?.player || s?.name || s?.text || "").trim();
  if (!name) name = "Unknown scorer";
  const minute = s?.minute ?? s?.min ?? undefined;
  const teamAbbr = s?.teamAbbr || s?.team || "";
  return { name, minute, teamAbbr };
}

function teamBits(ev: Event, side: "home" | "away") {
  const comp = ev?.competitions?.[0];
  const c = comp?.competitors?.find((x) => x.homeAway === side);
  const name =
    c?.team?.shortDisplayName ||
    c?.team?.displayName ||
    c?.team?.name ||
    (side === "home" ? "Home" : "Away");
  const logo =
    c?.team?.logo ||
    c?.team?.logos?.[0]?.href ||
    c?.team?.logos?.[1]?.href ||
    "";
  const scoreNum = Number(c?.score ?? "0");
  return { name, logo, scoreNum };
}

function StatBar({
  label,
  left,
  right,
  leftPct,
}: {
  label: string;
  left: number | undefined;
  right: number | undefined;
  leftPct: number | undefined;
}) {
  const pct =
    typeof leftPct === "number"
      ? Math.max(0, Math.min(100, leftPct))
      : undefined;
  return (
    <>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statRow}>
        <div>{Number.isFinite(left) ? left : "-"}</div>
        <div className={styles.bar} aria-label={label}>
          <div
            className={styles.barInner}
            style={{ width: pct !== undefined ? `${pct}%` : "0%" }}
          />
        </div>
        <div>{Number.isFinite(right) ? right : "-"}</div>
      </div>
    </>
  );
}

/* ---------------- Single card (controlled open state) ---------------- */
function LiveMatchCardSingle({
  ev,
  open,
  onToggle,
}: {
  ev: Event;
  open: boolean;
  onToggle: () => void;
}) {
  const {
    name: homeName,
    logo: homeLogo,
    scoreNum: homeScore,
  } = teamBits(ev, "home");
  const {
    name: awayName,
    logo: awayLogo,
    scoreNum: awayScore,
  } = teamBits(ev, "away");

  const details = useMemo(() => extractStatsFromScoreboardEvent(ev), [ev]);
  const scorers = (details.scorers ?? []).map(tidyScorer);

  const possession = details.metrics.find((m) => m.key === "poss");
  const shotsRow =
    details.metrics.find((m) => /shotsontarget|sot|st/i.test(m.key)) ||
    details.metrics.find((m) => /shots|total/i.test(m.key));

  // Show just the SA kickoff time for scheduled games; otherwise keep live/post status.
  const state = ev?.status?.type?.state;
  const statusDetail = ev?.status?.type?.detail || "";
  const statusText =
    state === "pre"
      ? timeZA(ev?.date) // e.g. "19:30"
      : state === "post"
      ? "FT"
      : statusDetail; // e.g. "1st Half", "HT", "90' +3"

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      className={`${styles.card} ${open ? styles.open : ""}`}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={onToggle}
      onKeyDown={onKey}
    >
      <div className={styles.header}>
        <div className={styles.team}>
          {homeLogo ? (
            <img className={styles.logo} src={homeLogo} alt={homeName} />
          ) : (
            <span />
          )}
          <span className={styles.teamName}>{homeName}</span>
        </div>

        <div className={styles.center}>
          <div className={styles.score}>
            {homeScore} <span style={{ opacity: 0.65 }}>-</span> {awayScore}
          </div>
          <div className={styles.ft}>{statusText}</div>
          <span className={styles.chev}>▾</span>
        </div>

        <div className={`${styles.team} ${styles.teamRight}`}>
          <span className={styles.teamName}>{awayName}</span>
          {awayLogo ? (
            <img className={styles.logo} src={awayLogo} alt={awayName} />
          ) : (
            <span />
          )}
        </div>
      </div>

      <div className={`${styles.collapse} ${open ? styles.openCollapse : ""}`}>
        <div className={styles.collapseInner}>
          <hr className={styles.rule} />

          {possession && (
            <StatBar
              label="Possession (%)"
              left={possession.homeVal}
              right={possession.awayVal}
              leftPct={possession.homePct}
            />
          )}

          {shotsRow && (
            <StatBar
              label={
                /shotsontarget|sot|st/i.test(shotsRow.key)
                  ? "Shots on Target"
                  : "Total Shots"
              }
              left={shotsRow.homeVal}
              right={shotsRow.awayVal}
              leftPct={
                typeof shotsRow.homeVal === "number" &&
                typeof shotsRow.awayVal === "number"
                  ? (100 * Number(shotsRow.homeVal)) /
                    (Number(shotsRow.homeVal) + Number(shotsRow.awayVal) || 1)
                  : undefined
              }
            />
          )}

          <hr className={styles.rule} />

          <div className={styles.scorersTitle}>Scorers</div>
          <div className={styles.scorers}>
            {scorers.length > 0 ? (
              scorers.map((s, i) => (
                <span key={i} className={styles.pill}>
                  {s.minute ? `${s.minute}ʼ — ` : ""}
                  {s.name} {s.teamAbbr ? `(${s.teamAbbr})` : ""}
                </span>
              ))
            ) : (
              <span className={styles.pill}>—</span>
            )}
          </div>

          <div className={styles.ctaWrap}>
            <Link
              className={styles.cta}
              to={`/matchviewer?id=${encodeURIComponent(ev.id)}`}
              aria-label={`Open Match Viewer for match ${ev.id}`}
            >
              Open Match Viewer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Grid with fallback, de-dupe, accordion + 15s polling ---------------- */
const POLL_MS = 15_000;

export default function LiveMatchCard({ showLabel = true }: GridProps) {
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [usedDate, setUsedDate] = useState<Date | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /** The id of the single open card; null means all collapsed */
  const [openId, setOpenId] = useState<string | null>(null);

  /** prevent overlapping requests during polling */
  const inFlightRef = useRef(false);

  // Load once: today, or most recent day with games (up to 7 days back).
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);

      const maxLookback = 7;
      let day = new Date();
      let found: ScoreboardResponse | null = null;
      let picked: Date | null = null;

      for (let i = 0; i <= maxLookback; i++) {
        try {
          const res = await fetchScoreboard(day);
          const evs = uniqueEvents(res?.events ?? []);
          if (evs.length > 0) {
            found = { ...res, events: evs };
            picked = new Date(day);
            break;
          }
        } catch {
          /* keep trying previous day */
        }
        day = addDays(day, -1);
      }

      if (!alive) return;
      if (found) {
        setData(found);
        setUsedDate(picked);
      } else {
        setErr("No matches found in the last 7 days.");
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Always call hooks before early returns (stable hook order)
  const events = useMemo(() => {
    const list = uniqueEvents(data?.events ?? []);
    return list.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [data]);

  const hasLive = useMemo(
    () => events.some((ev) => ev?.status?.type?.state === "in"),
    [events]
  );

  // Accordion toggle: clicking a card opens it and closes any other.
  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  // ---- 15s polling while tab is visible ----
  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const pollOnce = async () => {
      if (cancelled || inFlightRef.current) return;
      inFlightRef.current = true;

      const targetDate = usedDate ?? new Date();
      try {
        const res = await fetchScoreboard(targetDate);
        const evs = uniqueEvents(res?.events ?? []);

        // Keep currently open card open if it still exists after refresh
        setData({ ...res, events: evs });

        // If the currently open match vanished (finished/day rolled), close it
        if (openId && !evs.some((e) => e.id === openId)) {
          setOpenId(null);
        }
      } catch {
        /* swallow polling errors */
      } finally {
        inFlightRef.current = false;
      }
    };

    const start = () => {
      if (timer !== null) return;
      void pollOnce();
      timer = window.setInterval(pollOnce, POLL_MS);
    };

    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const shouldPoll =
      hasLive || (usedDate ? sameYMD(usedDate, new Date()) : true);

    if (shouldPoll) {
      start();
      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [usedDate, hasLive, openId]);

  if (loading) return <div className={styles.state}>Loading matches…</div>;
  if (err)
    return <div className={`${styles.state} ${styles.error}`}>{err}</div>;
  if (!events.length)
    return <div className={styles.state}>No matches found.</div>;

  return (
    <>
      {showLabel && (
        <div className={styles.state} style={{ opacity: 0.75 }}>
          {hasLive ? (
            <>Live now</>
          ) : (
            <>
              Showing matches for{" "}
              <strong>{usedDate ? ymd(usedDate) : ymd(new Date())}</strong>
            </>
          )}
        </div>
      )}

      <div className={styles.grid}>
        {events.map((ev) => (
          <LiveMatchCardSingle
            key={ev.id}
            ev={ev}
            open={openId === ev.id}
            onToggle={() => handleToggle(ev.id)}
          />
        ))}
      </div>
    </>
  );
}
