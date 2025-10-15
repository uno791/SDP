import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { PlayCircle } from "lucide-react";

import styles from "../components/LandingPageComp/WatchalongHub.module.css";
import { fetchScoreboard, type LeagueId, type ScoreboardResponse } from "../api/espn";
import {
  fetchWatchalongContent,
  type WatchalongItem,
  type WatchalongResponse,
} from "../api/watchalongs";

type MatchOption = {
  id: string;
  label: string;
  status: "pre" | "in" | "post";
  detail: string;
  accent: "live" | "upcoming" | "final";
  startTimeIso: string;
  watchQuery: string;
  reactionQuery: string;
};

const SA_TZ = "Africa/Johannesburg";

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: SA_TZ,
});

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: SA_TZ,
});

const publishedFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

const FontImports = () => (
  <style>
    {`@import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Alumni+Sans+Pinstripe:ital@0;1&display=swap');`}
  </style>
);

type ScoreboardEvent = ScoreboardResponse["events"][number];
type Competition = ScoreboardEvent["competitions"][number];
type Competitor = Competition["competitors"][number];

const LEAGUE_STORAGE_KEY = "league";
const LEAGUE_OPTIONS: Array<{ id: LeagueId; label: string }> = [
  { id: "eng1", label: "Premier League" },
  { id: "esp1", label: "LaLiga" },
  { id: "ita1", label: "Serie A" },
  { id: "ger1", label: "Bundesliga" },
  { id: "fra1", label: "Ligue 1" },
  { id: "ucl", label: "UEFA Champions League" },
  { id: "uel", label: "UEFA Europa League" },
  { id: "uecl", label: "UEFA Europa Conference League" },
];

const isLeagueId = (value: string | null): value is LeagueId =>
  value != null && LEAGUE_OPTIONS.some((option) => option.id === value);

function addDays(base: Date, delta: number) {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + delta);
  return copy;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(a: Date, b: Date) {
  const diff = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

function describeDay(date: Date) {
  const today = new Date();
  const delta = daysBetween(date, today);
  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta === -1) return "Yesterday";
  return dayFormatter.format(date);
}

function matchDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function extractMatchOption(ev: ScoreboardEvent): MatchOption | null {
  const comp = ev?.competitions?.[0] as Competition | undefined;
  if (!comp) return null;
  const competitors = (comp.competitors ?? []) as Competitor[];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const homeName =
    home.team?.shortDisplayName || home.team?.abbreviation || "Home";
  const awayName =
    away.team?.shortDisplayName || away.team?.abbreviation || "Away";

  const kickoff = new Date(ev.date);
  const detail = ev?.status?.type?.detail ?? "";
  const state = ev?.status?.type?.state ?? "pre";
  const day = describeDay(kickoff);
  const time = timeFormatter.format(kickoff);

  let accent: MatchOption["accent"] = "upcoming";
  if (state === "in") accent = "live";
  if (state === "post") accent = "final";

  let info = "";
  if (state === "pre") info = `${day} • ${time}`;
  else if (state === "in") info = `${detail || "Live"} • ${day}`;
  else info = `Final • ${day}`;

  return {
    id: ev.id,
    label: `${homeName} vs ${awayName}`,
    status: state,
    detail: info,
    accent,
    startTimeIso: kickoff.toISOString(),
    watchQuery: `${homeName} vs ${awayName} watchalong`,
    reactionQuery: `${homeName} vs ${awayName} fan reaction`,
  };
}

function orderByKickoffAsc(a: MatchOption, b: MatchOption) {
  return (
    new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime()
  );
}

function orderByKickoffDesc(a: MatchOption, b: MatchOption) {
  return (
    new Date(b.startTimeIso).getTime() - new Date(a.startTimeIso).getTime()
  );
}

async function fetchMatchesWindow(league: LeagueId): Promise<{
  liveUpcoming: MatchOption[];
  completed: MatchOption[];
}> {
  const now = new Date();
  const offsets = [0, -1, -2, -3, -4, -5, -6];
  const liveMap = new Map<string, MatchOption>();
  const completedByDay = new Map<
    string,
    { date: Date; matches: Map<string, MatchOption> }
  >();

  for (const offset of offsets) {
    if (offset < 0 && completedByDay.size >= 2) break;

    let response: ScoreboardResponse;
    try {
      response = await fetchScoreboard(addDays(now, offset), league);
    } catch (error) {
      console.warn("Failed to fetch scoreboard", error);
      continue;
    }

    const events = (response.events ?? []) as ScoreboardResponse["events"];
    if (!events.length) continue;

    for (const ev of events) {
      const option = extractMatchOption(ev);
      if (!option) continue;

      if (option.status === "post") {
        const eventDate = new Date(ev.date);
        const dayKey = matchDayKey(eventDate);
        let bucket = completedByDay.get(dayKey);
        if (!bucket) {
          bucket = {
            date: startOfDay(eventDate),
            matches: new Map<string, MatchOption>(),
          };
          completedByDay.set(dayKey, bucket);
        }
        if (!bucket.matches.has(option.id)) {
          bucket.matches.set(option.id, option);
        }
      } else if (!liveMap.has(option.id)) {
        liveMap.set(option.id, option);
      }
    }
  }

  const liveUpcoming = Array.from(liveMap.values()).sort(orderByKickoffAsc);

  const completedBuckets = Array.from(completedByDay.values()).sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  const completed = completedBuckets
    .slice(0, 2)
    .flatMap((bucket) =>
      Array.from(bucket.matches.values()).sort(orderByKickoffDesc)
    );

  return { liveUpcoming, completed };
}

type ContentState = {
  items: WatchalongItem[];
  loading: boolean;
  error: string | null;
  isFallback: boolean;
};

const initialContentState: ContentState = {
  items: [],
  loading: false,
  error: null,
  isFallback: false,
};

export default function Watchalongs() {
  const [league, setLeague] = useState<LeagueId>(() => {
    if (typeof window === "undefined") return "eng1";
    try {
      const params = new URLSearchParams(window.location.search);
      const query = params.get("league");
      if (isLeagueId(query)) {
        localStorage.setItem(LEAGUE_STORAGE_KEY, query);
        return query;
      }
      const stored = localStorage.getItem(LEAGUE_STORAGE_KEY);
      if (isLeagueId(stored)) return stored;
    } catch {
      /* ignore */
    }
    return "eng1";
  });

  const [liveMatches, setLiveMatches] = useState<MatchOption[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchOption[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const [watchalongsState, setWatchalongsState] =
    useState<ContentState>(initialContentState);
  const [reactionsState, setReactionsState] =
    useState<ContentState>(initialContentState);

  const leagueLabel = useMemo(
    () => LEAGUE_OPTIONS.find((option) => option.id === league)?.label ?? "Selected league",
    [league]
  );

  const handleLeagueChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLeague(event.target.value as LeagueId);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LEAGUE_STORAGE_KEY, league);
    } catch {
      /* ignore */
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("league", league);
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      /* ignore */
    }
  }, [league]);

  useEffect(() => {
    let cancelled = false;
    setMatchesLoading(true);
    setMatchesError(null);

    setLiveMatches([]);
    setRecentMatches([]);
    setSelectedMatchId(null);

    fetchMatchesWindow(league)
      .then(({ liveUpcoming, completed }) => {
        if (cancelled) return;
        setLiveMatches(liveUpcoming);
        setRecentMatches(completed);

        setSelectedMatchId((prev) => {
          const combined = [...liveUpcoming, ...completed].sort(
            (a, b) =>
              new Date(b.startTimeIso).getTime() -
              new Date(a.startTimeIso).getTime()
          );
          if (prev && combined.some((m) => m.id === prev)) {
            return prev;
          }
          return (
            liveUpcoming.find((m) => m.status === "in")?.id ||
            liveUpcoming[0]?.id ||
            completed[0]?.id ||
            null
          );
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load matches", error);
        setMatchesError(
          error instanceof Error
            ? error.message
            : `Failed to load ${leagueLabel} fixtures.`
        );
      })
      .finally(() => {
        if (!cancelled) setMatchesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [league, leagueLabel]);

  const selectedMatch = useMemo(() => {
    return (
      liveMatches.find((m) => m.id === selectedMatchId) ||
      recentMatches.find((m) => m.id === selectedMatchId) ||
      null
    );
  }, [liveMatches, recentMatches, selectedMatchId]);

  const matchList = useMemo(() => {
    const combined = [...liveMatches, ...recentMatches];
    return combined.sort(
      (a, b) =>
        new Date(b.startTimeIso).getTime() - new Date(a.startTimeIso).getTime()
    );
  }, [liveMatches, recentMatches]);

  const liveNowCount = useMemo(
    () => liveMatches.filter((match) => match.status === "in").length,
    [liveMatches]
  );
  const upcomingCount = useMemo(
    () => liveMatches.filter((match) => match.status === "pre").length,
    [liveMatches]
  );
  const recentCount = useMemo(() => recentMatches.length, [recentMatches]);

  const kickoffDate = useMemo(
    () => (selectedMatch ? new Date(selectedMatch.startTimeIso) : null),
    [selectedMatch]
  );
  const kickoffDay = kickoffDate ? dayFormatter.format(kickoffDate) : null;
  const kickoffTime = kickoffDate ? timeFormatter.format(kickoffDate) : null;

  const watchalongCount = watchalongsState.items.length;
  const reactionCount = reactionsState.items.length;

  useEffect(() => {
    if (!selectedMatch) {
      setWatchalongsState(initialContentState);
      return;
    }

    let cancelled = false;
    setWatchalongsState((prev) => ({ ...prev, loading: true, error: null }));

    fetchWatchalongContent(selectedMatch.watchQuery, {
      mode: "watchalong",
      limit: 6,
    })
      .then((resp: WatchalongResponse) => {
        if (cancelled) return;
        setWatchalongsState({
          items: resp.items,
          loading: false,
          error: null,
          isFallback: Boolean(resp.isFallback),
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setWatchalongsState({
          items: [],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to fetch watchalong streams.",
          isFallback: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMatch]);

  useEffect(() => {
    if (!selectedMatch) {
      setReactionsState(initialContentState);
      return;
    }

    let cancelled = false;
    setReactionsState((prev) => ({ ...prev, loading: true, error: null }));

    fetchWatchalongContent(selectedMatch.reactionQuery, {
      mode: "clips",
      limit: 6,
    })
      .then((resp: WatchalongResponse) => {
        if (cancelled) return;
        setReactionsState({
          items: resp.items,
          loading: false,
          error: null,
          isFallback: Boolean(resp.isFallback),
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setReactionsState({
          items: [],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to fetch fan reactions.",
          isFallback: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMatch]);

  function renderBadge(match: MatchOption) {
    const text =
      match.accent === "live"
        ? "Live now"
        : match.accent === "final"
        ? "Full time"
        : "Upcoming";
    const className =
      match.accent === "live"
        ? styles.badgeLive
        : match.accent === "final"
        ? styles.badgeFinal
        : styles.badgeUpcoming;

    return <span className={className}>{text}</span>;
  }

  function renderContent(state: ContentState, emptyLabel: string) {
    if (state.loading) {
      return <div className={styles.loading}>Loading match content…</div>;
    }
    if (state.error) {
      return <div className={styles.error}>{state.error}</div>;
    }
    if (!state.items.length) {
      return <div className={styles.emptyState}>{emptyLabel}</div>;
    }

    return (
      <div className={styles.contentGrid}>
        {state.items.map((item) => (
          <article key={item.id} className={styles.contentCard}>
            <div className={styles.thumbnailWrapper}>
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className={styles.thumbnail}
                  loading="lazy"
                />
              ) : null}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>{item.title}</div>
              <div className={styles.cardMeta}>
                <span>{item.channelTitle}</span>
                {item.publishedAt ? (
                  <span>
                    Published{" "}
                    {publishedFormatter.format(new Date(item.publishedAt))}
                  </span>
                ) : null}
                {item.isLive && item.liveViewers ? (
                  <span>{item.liveViewers.toLocaleString()} watching</span>
                ) : null}
                {item.viewCount && !item.isLive ? (
                  <span>{item.viewCount.toLocaleString()} views</span>
                ) : null}
              </div>
              {item.description ? (
                <p className={styles.cardDescription}>{item.description}</p>
              ) : null}
              <div className={styles.cardFooter}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.cardLink}
                >
                  <PlayCircle size={16} /> Watch
                </a>
                {item.duration ? (
                  <span className={styles.cardStat}>{item.duration}</span>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <FontImports />
      <div className={styles.pageGlow} aria-hidden="true" />
      <div className={styles.inner}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            {/* <span className={styles.heroBadge}>Premier League Companion</span> */}
            <h1 className={styles.heroTitle}>Watchalong</h1>
            <p className={styles.heroSubtitle}>
              Pick a {leagueLabel} fixture, jump into trusted creator
              watchalongs, and catch the latest fan reaction clips while the
              action unfolds.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              <label htmlFor="watchalongs-league-select" style={{ fontWeight: 600 }}>
                League
              </label>
              <select
                id="watchalongs-league-select"
                value={league}
                onChange={handleLeagueChange}
                aria-label="Select league"
                style={{
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  color: "#000",
                }}
              >
                {LEAGUE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Live now</span>
                <span className={styles.statValue}>
                  {matchesLoading ? "..." : liveNowCount}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Upcoming</span>
                <span className={styles.statValue}>
                  {matchesLoading ? "..." : upcomingCount}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Reactions ready</span>
                <span className={styles.statValue}>
                  {matchesLoading ? "..." : recentCount}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.matchSection}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <h2 className={styles.sectionTitle}>Choose your match</h2>
              <p className={styles.sectionSubtitle}>
                Live and upcoming fixtures pull through automatically, with
                reaction support for the latest two matchdays played.
              </p>
            </div>
            {selectedMatch ? (
              <span className={styles.sectionChip}>{selectedMatch.label}</span>
            ) : null}
          </div>

          <div className={styles.matchLayout}>
            <div className={styles.matchColumn}>
              {matchesLoading ? (
                <div className={styles.loading}>
                  Fetching today&apos;s fixtures…
                </div>
              ) : matchesError ? (
                <div className={styles.error}>{matchesError}</div>
              ) : matchList.length ? (
                <div className={styles.matchList}>
                  {matchList.map((match) => (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => setSelectedMatchId(match.id)}
                      className={`${styles.matchButton} ${
                        selectedMatchId === match.id
                          ? styles.matchButtonActive
                          : ""
                      }`}
                    >
                      <div className={styles.matchInfo}>
                        <div className={styles.matchMetaRow}>
                          {renderBadge(match)}
                          <span className={styles.matchDetail}>
                            {match.detail}
                          </span>
                        </div>
                        <div className={styles.matchTitle}>{match.label}</div>
                      </div>
                      <span className={styles.matchChevron}>▸</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  No fixtures found for this window.
                </div>
              )}
            </div>

            <aside className={styles.spotlightColumn}>
              {selectedMatch ? (
                <div className={styles.spotlightCard}>
                  {/* <div className={styles.spotlightHeader}>
                    {renderBadge(selectedMatch)}
                    <span className={styles.spotlightLabel}>
                      Premier League
                    </span>
                  </div> */}
                  <h3 className={styles.spotlightTitle}>
                    {selectedMatch.label}
                  </h3>
                  <p className={styles.spotlightDetail}>
                    {selectedMatch.detail}
                  </p>
                  <div className={styles.spotlightMetaGrid}>
                    {kickoffDay ? (
                      <div>
                        <span className={styles.metaLabel}>Matchday</span>
                        <span className={styles.metaValue}>{kickoffDay}</span>
                      </div>
                    ) : null}
                    {kickoffTime ? (
                      <div>
                        <span className={styles.metaLabel}>Kick-off</span>
                        <span className={styles.metaValue}>
                          {kickoffTime} SAST
                        </span>
                      </div>
                    ) : null}
                    <div>
                      <span className={styles.metaLabel}>Watch parties</span>
                      <span className={styles.metaValue}>
                        {watchalongsState.loading ? "…" : watchalongCount}
                      </span>
                    </div>
                    <div>
                      <span className={styles.metaLabel}>Reaction clips</span>
                      <span className={styles.metaValue}>
                        {reactionsState.loading ? "…" : reactionCount}
                      </span>
                    </div>
                  </div>
                  <p className={styles.spotlightNote}>
                    Switch fixtures to refresh curated coverage from trusted
                    creators and the most electric fan reactions.
                  </p>
                </div>
              ) : (
                <div className={styles.spotlightPlaceholder}>
                  <h3>Select a fixture</h3>
                  <p>
                    Pick a match to unlock curated watch parties and fan
                    reactions.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </section>

        <section className={styles.contentSection}>
          <div className={styles.contentHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Watchalong streams</h2>
              <p className={styles.sectionSubtitle}>
                Curated live creator streams and watch parties for the selected
                match.
              </p>
            </div>
            {selectedMatch ? (
              <span className={styles.sectionChip}>{selectedMatch.label}</span>
            ) : null}
          </div>
          {renderContent(
            watchalongsState,
            "No live watchalong streams surfaced. Try another match or come back closer to kick-off."
          )}
          {watchalongsState.isFallback ? (
            <div className={styles.fallbackNotice}>
              Showing curated sample streams. Add a valid{" "}
              <code>YOUTUBE_API_KEY</code> to back-end environment for live
              YouTube search results.
            </div>
          ) : null}
        </section>

        <section className={styles.contentSection}>
          <div className={styles.contentHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Fan reaction clips</h2>
              <p className={styles.sectionSubtitle}>
                Relive the biggest moments from recent fixtures with supporter
                reactions and highlights from the selected match.
              </p>
            </div>
            {selectedMatch ? (
              <span className={styles.sectionChip}>{selectedMatch.label}</span>
            ) : null}
          </div>

          {renderContent(
            reactionsState,
            "No reaction clips yet. They usually drop shortly after the final whistle."
          )}
          {reactionsState.isFallback ? (
            <div className={styles.fallbackNotice}>
              Showing curated sample clips. Configure{" "}
              <code>YOUTUBE_API_KEY</code> for up-to-date creator content.
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
