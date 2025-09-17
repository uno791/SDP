import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./PastMatchCard.module.css";

/* Adjust path if your espn API file sits elsewhere */
import {
  fetchScoreboard,
  extractStatsFromScoreboardEvent,
  type ScoreboardResponse,
} from "../../api/espn";

type Event = ScoreboardResponse["events"][number];

/* ==================== Strict local date helpers (fixes 2001 bugs) ==================== */
function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function dateFromYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date();
  dt.setFullYear(y, (m || 1) - 1, d || 1);
  dt.setHours(12, 0, 0, 0); // local noon prevents TZ rollovers
  return dt;
}
function addDaysLocal(ymd: string, delta: number): string {
  const dt = dateFromYMD(ymd);
  dt.setDate(dt.getDate() + delta);
  return formatYMD(dt);
}
function labelLong(ymd: string) {
  const dt = dateFromYMD(ymd);
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

/* ==================== Utilities ==================== */
function uniqueEvents(events: Event[] = []) {
  const m = new Map<string, Event>();
  for (const ev of events) if (!m.has(ev.id)) m.set(ev.id, ev);
  return Array.from(m.values());
}
function team(ev: Event, side: "home" | "away") {
  const comp = ev?.competitions?.[0];
  const c = comp?.competitors?.find((x) => x.homeAway === side);
  return {
    name:
      c?.team?.shortDisplayName ||
      c?.team?.displayName ||
      c?.team?.name ||
      (side === "home" ? "Home" : "Away"),
    logo: c?.team?.logo || c?.team?.logos?.[0]?.href || "",
    score: Number(c?.score ?? "0"),
  };
}
const tidyScorer = (s: any) => {
  let name = (s?.player || s?.name || s?.text || "").trim();
  if (!name) name = "Unknown scorer";
  return {
    name,
    minute: s?.minute ?? s?.min ?? undefined,
    teamAbbr: s?.teamAbbr || s?.team || "",
  };
};

/* ==================== Single Card ==================== */
function Card({
  ev,
  open,
  onToggle,
}: {
  ev: Event;
  open: boolean;
  onToggle: () => void;
}) {
  const home = team(ev, "home");
  const away = team(ev, "away");
  const details = useMemo(() => extractStatsFromScoreboardEvent(ev), [ev]);

  const poss = details.metrics.find((m) => m.key === "poss");
  const shotsRow =
    details.metrics.find((m) => /shotsontarget|sot|st/i.test(m.key)) ||
    details.metrics.find((m) => /shots|total/i.test(m.key));
  const scorers = (details.scorers ?? []).map(tidyScorer);

  const kickoff = new Date(ev.date);
  const subDate = kickoff.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  return (
    <div
      className={`${styles.card} ${open ? "open" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      {/* Header row (center stack left, caret right) */}
      <div className={styles.row}>
        <div className={styles.left}>
          <div className={styles.rowTeams}>
            <span className={styles.teamWrap}>
              {home.logo ? (
                <img className={styles.logo} src={home.logo} alt={home.name} />
              ) : null}
              <span className={styles.matchup}>{home.name}</span>
            </span>
            <span className={styles.vs}>vs</span>
            <span className={styles.teamWrap}>
              <span className={styles.matchup}>{away.name}</span>
              {away.logo ? (
                <img className={styles.logo} src={away.logo} alt={away.name} />
              ) : null}
            </span>
          </div>

          {/* Score centered below teams */}
          <div className={styles.score}>
            {home.score} <span style={{ opacity: 0.6 }}>-</span> {away.score}
          </div>

          {/* Date centered below score */}
          <div className={styles.date}>{subDate}</div>
        </div>

        {/* Caret on right */}
        <div className={styles.right}>
          <span className={styles.caret}>▾</span>
        </div>
      </div>

      {/* Details below header so score stays pinned */}
      {open && (
        <div className={styles.details} onClick={(e) => e.stopPropagation()}>
          {poss && (
            <div className={styles.statBlock}>
              <div className={styles.statLabel}>Possession (%)</div>
              <div className={styles.statRow}>
                <div>{poss.homeVal ?? "-"}</div>
                <div className={styles.bar}>
                  <div
                    className={styles.barInner}
                    style={{ width: `${poss.homePct ?? 0}%` }}
                  />
                </div>
                <div>{poss.awayVal ?? "-"}</div>
              </div>
            </div>
          )}

          {shotsRow && (
            <div className={styles.statBlock}>
              <div className={styles.statLabel}>
                {/shotsontarget|sot|st/i.test(shotsRow.key)
                  ? "Shots on Target"
                  : "Total Shots"}
              </div>
              <div className={styles.statRow}>
                <div>{shotsRow.homeVal ?? "-"}</div>
                <div className={styles.bar}>
                  <div
                    className={styles.barInner}
                    style={{
                      width:
                        typeof shotsRow.homeVal === "number" &&
                        typeof shotsRow.awayVal === "number"
                          ? `${
                              (100 * shotsRow.homeVal) /
                              (shotsRow.homeVal + shotsRow.awayVal || 1)
                            }%`
                          : "0%",
                    }}
                  />
                </div>
                <div>{shotsRow.awayVal ?? "-"}</div>
              </div>
            </div>
          )}

          <div className={styles.statBlock}>
            <div className={styles.statLabel}>Scorers</div>
            <div className={styles.scorers}>
              {scorers.length ? (
                scorers.map((s, i) => (
                  <span key={i} className={styles.pill}>
                    {s.minute ? `${s.minute}ʼ — ` : ""}
                    {s.name}
                    {s.teamAbbr ? ` (${s.teamAbbr})` : ""}
                  </span>
                ))
              ) : (
                <span className={styles.pill}>—</span>
              )}
            </div>
          </div>

          <div className={styles.ctaWrap}>
            <a
              className={styles.cta}
              href={`https://www.espn.com/soccer/match/_/gameId/${encodeURIComponent(
                ev.id
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              Open Match Viewer
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== Grid with header controls ==================== */
export default function PastMatchCard() {
  // keep date as YYYY-MM-DD string (prevents timezone parsing issues)
  const [ymd, setYmd] = useState<string | null>(null);
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  /* Auto-pick the most recent day with all games finished */
  useEffect(() => {
    let alive = true;
    if (ymd) return;
    (async () => {
      let probe = formatYMD(new Date());
      for (let i = 0; i < 30; i++) {
        try {
          const res = await fetchScoreboard(dateFromYMD(probe));
          const evs = uniqueEvents(res?.events ?? []);
          const allPost =
            evs.length > 0 &&
            evs.every(
              (e) =>
                e?.status?.type?.state === "post" ||
                !!e?.status?.type?.completed
            );
          if (allPost) {
            if (alive) setYmd(probe);
            return;
          }
        } catch {
          /* try previous */
        }
        probe = addDaysLocal(probe, -1);
      }
      if (alive) setYmd(addDaysLocal(formatYMD(new Date()), -1));
    })();
    return () => {
      alive = false;
    };
  }, [ymd]);

  /* Fetch matches for selected date (post only) */
  useEffect(() => {
    let alive = true;
    if (!ymd) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetchScoreboard(dateFromYMD(ymd));
        const evs = uniqueEvents(res?.events ?? []).filter(
          (e) =>
            e?.status?.type?.state === "post" || !!e?.status?.type?.completed
        );
        if (alive) setData({ ...res, events: evs });
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Failed to load matches.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ymd]);

  const events = useMemo(
    () =>
      uniqueEvents(data?.events ?? []).sort(
        (a, b) => +new Date(a.date) - +new Date(b.date)
      ),
    [data]
  );

  const prev = () => ymd && setYmd(addDaysLocal(ymd, -1));
  const next = () => ymd && setYmd(addDaysLocal(ymd, +1));
  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    // @ts-ignore
    if (el.showPicker) el.showPicker();
    else el.focus();
  };
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) =>
    e.target.value && setYmd(e.target.value);

  return (
    <>
      {/* Title + date controls in one line (use sectionStrip wrapper if you want cream bg) */}
      <div className={styles.headerRow}>
        <h3 className={styles.headerTitle}>Past Matches</h3>

        <div className={styles.dateControls}>
          <button
            className={styles.dateBtn}
            onClick={prev}
            aria-label="Previous day"
          >
            ◀
          </button>
          <div
            className={styles.dateLabel}
            onClick={openPicker}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPicker();
              }
            }}
          >
            {ymd ? labelLong(ymd) : "—"}
          </div>
          <button
            className={styles.dateBtn}
            onClick={next}
            aria-label="Next day"
          >
            ▶
          </button>

          <input
            ref={inputRef}
            type="date"
            className={styles.dateInput}
            value={ymd ?? ""}
            onChange={onPick}
            min="2005-01-01"
            max="2099-12-31"
          />
        </div>
      </div>

      {loading && <div className={styles.state}>Loading past matches…</div>}
      {err && <div className={`${styles.state} ${styles.error}`}>{err}</div>}
      {!loading && !err && events.length === 0 && (
        <div className={styles.state}>No completed matches on this date.</div>
      )}

      {!loading &&
        !err &&
        events.map((ev) => (
          <Card
            key={ev.id}
            ev={ev}
            open={openId === ev.id}
            onToggle={() =>
              setOpenId((prev) => (prev === ev.id ? null : ev.id))
            }
          />
        ))}
    </>
  );
}
