import { useEffect, useMemo, useState } from "react";
import { PlayCircle, Sparkles } from "lucide-react";

import styles from "../components/LandingPageComp/WatchalongHub.module.css";
import type { ScoreboardResponse } from "../api/espn";
import { fetchScoreboard } from "../api/espn";
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

type ScoreboardEvent = ScoreboardResponse["events"][number];
type Competition = ScoreboardEvent["competitions"][number];
type Competitor = Competition["competitors"][number];

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
  return new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime();
}

function orderByKickoffDesc(a: MatchOption, b: MatchOption) {
  return new Date(b.startTimeIso).getTime() - new Date(a.startTimeIso).getTime();
}

async function fetchMatchesWindow(): Promise<{
  liveUpcoming: MatchOption[];
  completed: MatchOption[];
}> {
  const now = new Date();
  const [today, yesterday] = await Promise.all([
    fetchScoreboard(now),
    fetchScoreboard(addDays(now, -1)),
  ]);

  const mergedEvents = [
    ...((today.events ?? []) as ScoreboardResponse["events"]),
    ...((yesterday.events ?? []) as ScoreboardResponse["events"]),
  ];

  const map = new Map<string, MatchOption>();
  for (const ev of mergedEvents) {
    const opt = extractMatchOption(ev);
    if (!opt) continue;
    if (!map.has(opt.id)) map.set(opt.id, opt);
  }

  const options = Array.from(map.values());
  const liveUpcoming = options
    .filter((m) => m.status !== "post")
    .sort(orderByKickoffAsc);
  const completed = options
    .filter((m) => m.status === "post")
    .sort(orderByKickoffDesc)
    .slice(0, 12);

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
  const [liveMatches, setLiveMatches] = useState<MatchOption[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchOption[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedReactionId, setSelectedReactionId] = useState<string | null>(null);

  const [watchalongsState, setWatchalongsState] = useState<ContentState>(
    initialContentState,
  );
  const [reactionsState, setReactionsState] = useState<ContentState>(
    initialContentState,
  );

  useEffect(() => {
    let cancelled = false;
    setMatchesLoading(true);
    setMatchesError(null);

    fetchMatchesWindow()
      .then(({ liveUpcoming, completed }) => {
        if (cancelled) return;
        setLiveMatches(liveUpcoming);
        setRecentMatches(completed);

        setSelectedMatchId((prev) => {
          if (prev && (liveUpcoming.some((m) => m.id === prev) || completed.some((m) => m.id === prev))) {
            return prev;
          }
          return (
            liveUpcoming.find((m) => m.status === "in")?.id ||
            liveUpcoming[0]?.id ||
            completed[0]?.id ||
            null
          );
        });

        setSelectedReactionId((prev) => {
          if (prev && completed.some((m) => m.id === prev)) return prev;
          return (
            completed[0]?.id ||
            liveUpcoming.find((m) => m.status === "in")?.id ||
            liveUpcoming[0]?.id ||
            null
          );
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load matches", error);
        setMatchesError(
          error instanceof Error ? error.message : "Failed to load Premier League fixtures.",
        );
      })
      .finally(() => {
        if (!cancelled) setMatchesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedMatch = useMemo(() => {
    return (
      liveMatches.find((m) => m.id === selectedMatchId) ||
      recentMatches.find((m) => m.id === selectedMatchId) ||
      null
    );
  }, [liveMatches, recentMatches, selectedMatchId]);

  const selectedReactionMatch = useMemo(() => {
    return (
      recentMatches.find((m) => m.id === selectedReactionId) ||
      liveMatches.find((m) => m.id === selectedReactionId) ||
      null
    );
  }, [recentMatches, liveMatches, selectedReactionId]);

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
    if (!selectedReactionMatch) {
      setReactionsState(initialContentState);
      return;
    }

    let cancelled = false;
    setReactionsState((prev) => ({ ...prev, loading: true, error: null }));

    fetchWatchalongContent(selectedReactionMatch.reactionQuery, {
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
  }, [selectedReactionMatch]);

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
                    Published {publishedFormatter.format(new Date(item.publishedAt))}
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
      <div className={styles.inner}>
        <section className={styles.hero}>
          <div className={styles.heroBadge}>
            <Sparkles size={16} /> Live Match Companion
          </div>
          <h1 className={styles.heroTitle}>Watchalong Hub</h1>
          <p className={styles.heroSubtitle}>
            Pick a Premier League fixture, jump into trusted creator watchalongs, and catch
            the latest fan reaction clips while the action unfolds.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Choose your match</h2>
          <p className={styles.sectionSubtitle}>
            Live and upcoming fixtures pull through automatically from the Premier League scoreboard.
          </p>

          {matchesLoading ? (
            <div className={styles.loading}>Fetching today&apos;s fixtures…</div>
          ) : matchesError ? (
            <div className={styles.error}>{matchesError}</div>
          ) : liveMatches.length || recentMatches.length ? (
            <div className={styles.matchGrid}>
              {[...liveMatches, ...recentMatches].map((match) => (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => setSelectedMatchId(match.id)}
                  className={`${styles.matchButton} ${
                    selectedMatchId === match.id ? styles.matchButtonActive : ""
                  }`}
                >
                  <div className={styles.matchMetaRow}>
                    {renderBadge(match)}
                    <span className={styles.matchDetail}>{match.detail}</span>
                  </div>
                  <div className={styles.matchTitle}>{match.label}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>No fixtures found for this window.</div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <h2 className={styles.sectionTitle}>Watchalong streams</h2>
              <p className={styles.sectionSubtitle}>
                Curated live creator streams and watch parties for the selected match.
              </p>
            </div>
            {selectedMatch ? (
              <div className={styles.matchDetail}>
                <strong>{selectedMatch.label}</strong>
              </div>
            ) : null}
          </div>
          {renderContent(
            watchalongsState,
            "No live watchalong streams surfaced. Try another match or come back closer to kick-off.",
          )}
          {watchalongsState.isFallback ? (
            <div className={styles.fallbackNotice}>
              Showing curated sample streams. Add a valid <code>YOUTUBE_API_KEY</code> to back-end
              environment for live YouTube search results.
            </div>
          ) : null}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Fan reaction clips</h2>
          <p className={styles.sectionSubtitle}>
            Relive the biggest moments from recent fixtures with supporter reactions and highlights.
          </p>

          {recentMatches.length ? (
            <div className={styles.pillRow}>
              {recentMatches.map((match) => (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => setSelectedReactionId(match.id)}
                  className={`${styles.pill} ${
                    selectedReactionId === match.id ? styles.pillActive : ""
                  }`}
                >
                  {match.label}
                </button>
              ))}
            </div>
          ) : null}

          {renderContent(
            reactionsState,
            "No reaction clips yet. They usually drop shortly after the final whistle.",
          )}
          {reactionsState.isFallback ? (
            <div className={styles.fallbackNotice}>
              Showing curated sample clips. Configure <code>YOUTUBE_API_KEY</code> for up-to-date creator content.
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
