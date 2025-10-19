import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom"; // 👈 NEW
import styles from "./PastMatchCard.module.css";

import {
  fetchScoreboard,
  extractStatsFromScoreboardEvent,
  type LeagueId,
  type ScoreboardResponse,
} from "../../api/espn";

type Event = ScoreboardResponse["events"][number];

type PastMatchCardProps = {
  league?: LeagueId;
  title?: string;
  teamNames?: string[];
  emptyMessage?: string;
};

/* ─────────────────────────  SAST helpers  ───────────────────────── */
const SAST_TZ = "Africa/Johannesburg";

/** YYYY-MM-DD in SAST (no time) */
function ymdInSAST(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SAST_TZ }).format(d);
}

/** “Sunday 14 September” */
function formatDateSAST(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: SAST_TZ,
  });
}

/** “Sun, 14 Sep” */
function formatShortDateSAST(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: SAST_TZ,
  });
}

/** 24-hour time in SAST, e.g. “14:30” */
function formatTimeSAST(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SAST_TZ,
  });
}

/** “Sunday, 14 September, 14:30” (no timezone string) */
function formatDateTimeSAST(d: Date): string {
  return `${formatDateSAST(d)}, ${formatTimeSAST(d)}`;
}

/* Local day math (we display & navigate by SA calendar days) */
function formatYMD(d: Date): string {
  return ymdInSAST(d);
}
function dateFromYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date();
  dt.setFullYear(y, (m || 1) - 1, d || 1);
  dt.setHours(12, 0, 0, 0); // midday to avoid DST edges; display will force SAST
  return dt;
}
function addDaysLocal(ymd: string, delta: number): string {
  const dt = dateFromYMD(ymd);
  dt.setDate(dt.getDate() + delta);
  return formatYMD(dt);
}
function labelLong(ymd: string) {
  return formatDateSAST(dateFromYMD(ymd));
}

const normalizeName = (value: string | undefined | null) =>
  value?.toLowerCase().trim() ?? "";

/* ───────────── Utilities ───────────── */
function uniqueEvents(events: Event[] = []) {
  const m = new Map<string, Event>();
  for (const ev of events) if (!m.has(ev.id)) m.set(ev.id, ev);
  return Array.from(m.values());
}

function team(ev: Event, side: "home" | "away") {
  const comp = ev?.competitions?.[0];
  const c = comp?.competitors?.find((x) => x.homeAway === side);
  const rawScore = c?.score;
  const score =
    rawScore === undefined || rawScore === null || rawScore === ""
      ? undefined
      : Number(rawScore);
  return {
    name:
      c?.team?.shortDisplayName ||
      c?.team?.displayName ||
      c?.team?.name ||
      (side === "home" ? "Home" : "Away"),
    logo: c?.team?.logo || c?.team?.logos?.[0]?.href || "",
    score,
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

/** What appears under the score in the collapsed row */
function subline(ev: Event) {
  const t = ev?.status?.type;
  const dt = new Date(ev.date);

  if (!t) return formatShortDateSAST(dt);

  if (t.state === "in") return "LIVE";
  if (t.state === "post" || t.completed) return "FT";

  // Upcoming: show full SA date + 24h time, with no timezone text
  return formatDateTimeSAST(dt);
}

/* ───────────── Single Card ───────────── */
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

  const isPre = ev?.status?.type?.state === "pre";
  const poss = details.metrics.find((m) => m.key === "poss");
  const shotsRow =
    details.metrics.find((m) => /shotsontarget|sot|st/i.test(m.key)) ||
    details.metrics.find((m) => /shots|total/i.test(m.key));
  const scorers = (details.scorers ?? []).map(tidyScorer);

  const kickoff = new Date(ev.date);
  const hasScores =
    typeof home.score === "number" && typeof away.score === "number";

  // Prevent opening future fixtures
  const handleToggle = () => {
    if (isPre) return;
    onToggle();
  };

  return (
    <div
      className={`${styles.card} ${open ? "open" : ""}`}
      role="button"
      tabIndex={isPre ? -1 : 0}
      aria-disabled={isPre ? true : undefined}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (isPre) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      style={isPre ? { cursor: "default", opacity: 0.98 } : undefined}
      title={isPre ? "Kickoff in the future" : undefined}
    >
      {/* Header row */}
      <div className={styles.row}>
        <div className={styles.left}>
          {/* Teams centered */}
          <div className={styles.rowTeams}>
            <span className={styles.teamWrap}>
              {home.logo ? (
                <img
                  className={styles.logo}
                  src={home.logo}
                  alt={home.name}
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              <span className={styles.matchup}>{home.name}</span>
            </span>
            <span className={styles.vs}>vs</span>
            <span className={styles.teamWrap}>
              <span className={styles.matchup}>{away.name}</span>
              {away.logo ? (
                <img
                  className={styles.logo}
                  src={away.logo}
                  alt={away.name}
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
            </span>
          </div>

          {/* Score (or em dash for fixtures) */}
          <div className={styles.score}>
            {hasScores ? (
              <>
                {home.score} <span style={{ opacity: 0.6 }}>-</span>{" "}
                {away.score}
              </>
            ) : (
              <>
                — <span style={{ opacity: 0.6 }}>-</span> —
              </>
            )}
          </div>

          {/* SAST subline: LIVE / FT / “Sunday, 14 September, 14:30” */}
          <div className={styles.date}>{subline(ev)}</div>
        </div>

        {/* Caret (dim for fixtures) */}
        <div className={styles.right}>
          <span
            className={styles.caret}
            style={isPre ? { opacity: 0.25, pointerEvents: "none" } : undefined}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Expanded details (never for future fixtures) */}
      {!isPre && open && (
        <div className={styles.details} onClick={(e) => e.stopPropagation()}>
          {/* Stats if available; otherwise show kickoff info */}
          {!(poss || shotsRow || scorers.length) && (
            <div className={styles.statBlock}>
              <div className={styles.statLabel}>Kickoff</div>
              <div className={styles.scorers}>
                <span className={styles.pill}>
                  {formatDateTimeSAST(kickoff)}
                </span>
              </div>
            </div>
          )}

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

          {(scorers.length > 0 || hasScores) && (
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
          )}

          <div className={styles.ctaWrap}>
            {/* ⬇️ Changed from <a href="espn..."> to a client-side route */}
            <Link
              className={styles.cta}
              to={`/matchviewer?id=${encodeURIComponent(ev.id)}`}
              aria-label={`Open Match Viewer for match ${ev.id}`}
            >
              Open Match Viewer
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────── Grid with date controls ───────────── */
export default function PastMatchCard({
  league = "eng1",
  title = "Matches",
  teamNames,
  emptyMessage = "No matches on this date.",
}: PastMatchCardProps) {
  const [ymd, setYmd] = useState<string | null>(null);
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const teamNameSet = useMemo(() => {
    if (teamNames === undefined) return null;
    const normalized = (teamNames ?? [])
      .map((name) => normalizeName(name))
      .filter(Boolean);
    return new Set(normalized);
  }, [teamNames]);

  const matchesTeamFilter = useCallback(
    (ev: Event) => {
      if (!teamNameSet) return true;
      if (teamNameSet.size === 0) return false;
      const comp = ev.competitions?.[0];
      const competitors = comp?.competitors ?? [];
      return competitors.some((competitor) => {
        const team = competitor?.team;
        const namesToCheck = [
          team?.displayName,
          team?.shortDisplayName,
          team?.name,
          team?.abbreviation,
          team?.nickname,
          team?.nickName,
        ];
        return namesToCheck.some((name) =>
          teamNameSet.has(normalizeName(name))
        );
      });
    },
    [teamNameSet]
  );

  const filterEvents = useCallback(
    (events: Event[] = []) => events.filter((ev) => matchesTeamFilter(ev)),
    [matchesTeamFilter]
  );

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setYmd(null);
    setData(null);
    setOpenId(null);
  }, [league]);

  // First day to show: prefer “today” (SAST) if there are any games,
  // otherwise step back until we find a completed day.
  useEffect(() => {
    let alive = true;
    if (ymd) return;
    (async () => {
      const today = ymdInSAST(new Date());
      try {
        const res = await fetchScoreboard(dateFromYMD(today), league);
        const filteredToday = filterEvents(uniqueEvents(res?.events ?? []));
        if (filteredToday.length > 0) {
          if (alive) setYmd(today);
          return;
        }
      } catch {}
      let probe = today;
      for (let i = 0; i < 30; i++) {
        try {
          const res = await fetchScoreboard(dateFromYMD(probe), league);
          const evs = filterEvents(uniqueEvents(res?.events ?? []));
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
        } catch {}
        probe = addDaysLocal(probe, -1);
      }
      if (alive) setYmd(today);
    })();
    return () => {
      alive = false;
    };
  }, [ymd, league, filterEvents]);

  // Fetch all matches (pre/in/post) for the selected SAST date
  useEffect(() => {
    let alive = true;
    if (!ymd) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetchScoreboard(dateFromYMD(ymd), league);
        const evs = uniqueEvents(res?.events ?? []);
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
  }, [ymd, league]);

  const events = useMemo(
    () =>
      filterEvents(uniqueEvents(data?.events ?? [])).sort(
        (a, b) => +new Date(a.date) - +new Date(b.date)
      ),
    [data, filterEvents]
  );

  const prev = () => ymd && setYmd(addDaysLocal(ymd, -1));
  const next = () => ymd && setYmd(addDaysLocal(ymd, +1));
  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    // @ts-ignore
    if (el.showPicker) el.showPicker();
    else el.click();
  };
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) =>
    e.target.value && setYmd(e.target.value);

  return (
    <>
      {/* Title + date controls */}
      <div className={styles.headerRow}>
        <h3 className={styles.headerTitle}>{title}</h3>

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

      {loading && <div className={styles.state}>Loading matches…</div>}
      {err && <div className={`${styles.state} ${styles.error}`}>{err}</div>}
      {!loading && !err && events.length === 0 && (
        <div className={styles.state}>{emptyMessage}</div>
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
