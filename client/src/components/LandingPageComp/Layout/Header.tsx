import { Menu } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import styles from "./Header.module.css";
import { useUser } from "../../../Users/UserContext";
import { baseURL } from "../../../config";
import {
  fetchScoreboard,
  type LeagueId,
  type ScoreboardResponse,
} from "../../../api/espn";
import { LEAGUE_OPTIONS } from "../../FavouritePageComp/leagues";

type HeaderProps = {
  onOpenMenu: () => void;
};

type FavouriteTeamRecord = {
  team_id?: number | null;
  team_name?: string | null;
  teamName?: string | null;
  name?: string | null;
};

type HighlightItem = {
  key: string;
  teamName: string;
  label: string;
  text: string;
};

type ScoreboardEvent = ScoreboardResponse["events"][number];

const scoreboardCache = new Map<string, Promise<ScoreboardResponse>>();
const LEAGUE_IDS: LeagueId[] = LEAGUE_OPTIONS.map((option) => option.id);
const PAST_OFFSETS = [0, 1, 2, 3, 4, 5, 6];
const FUTURE_OFFSETS = [0, 1, 2, 3, 4, 5, 6];

function canonicalName(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/\b(football|club|fc|cf|ac|sc|the)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function ymdFromDate(date: Date): string {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

function dateFromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
}

async function fetchScoreboardCached(
  ymd: string,
  league: LeagueId
): Promise<ScoreboardResponse> {
  const key = `${league}-${ymd}`;
  if (!scoreboardCache.has(key)) {
    const date = dateFromYmd(ymd);
    const promise = fetchScoreboard(date, league).catch((err) => {
      scoreboardCache.delete(key);
      throw err;
    });
    scoreboardCache.set(key, promise);
  }
  return scoreboardCache.get(key)!;
}

function competitorNames(candidate: any): string[] {
  if (!candidate) return [];
  const team = candidate.team ?? {};
  return [
    team.displayName,
    team.shortDisplayName,
    team.name,
    team.club?.name,
    team.alternateDisplayName,
    team.abbreviation,
  ].filter(Boolean);
}

function matchTeamInEvent(
  event: ScoreboardEvent,
  teamName: string
):
  | {
      team: any;
      opponent: any | undefined;
    }
  | null {
  const comp = event?.competitions?.[0];
  const competitors: any[] = comp?.competitors ?? [];
  const target = canonicalName(teamName);
  if (!target) return null;

  for (const candidate of competitors) {
    const matches = competitorNames(candidate).some((value) => {
      const normalised = canonicalName(value);
      if (!normalised) return false;
      return (
        normalised === target ||
        normalised.includes(target) ||
        target.includes(normalised)
      );
    });

    if (matches) {
      const opponent = competitors.find((entry) => entry !== candidate);
      return { team: candidate, opponent };
    }
  }

  return null;
}

function toScore(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function opponentName(opponent: any | undefined): string {
  if (!opponent) return "Opponent";
  return (
    opponent.team?.shortDisplayName ??
    opponent.team?.displayName ??
    opponent.team?.name ??
    "Opponent"
  );
}

function formatPastHighlight(
  teamName: string,
  event: ScoreboardEvent,
  teamComp: any,
  opponentComp: any
): HighlightItem {
  const teamScore = toScore(teamComp?.score);
  const opponentScore = toScore(opponentComp?.score);
  const opponentLabel = opponentName(opponentComp);

  let outcome = "Played";
  if (teamScore !== null && opponentScore !== null) {
    if (teamScore > opponentScore) outcome = "Won";
    else if (teamScore < opponentScore) outcome = "Lost";
    else outcome = "Drew";
  }

  const scoreText =
    teamScore !== null && opponentScore !== null
      ? `${teamScore}-${opponentScore}`
      : "Full time";

  const dateLabel = new Date(event.date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const text = `${outcome} ${scoreText} vs ${opponentLabel} (${dateLabel})`;

  return {
    key: `${teamName}-last-${event.id}`,
    teamName,
    label: "Last",
    text,
  };
}

function formatFutureHighlight(
  teamName: string,
  event: ScoreboardEvent,
  opponentComp: any
): HighlightItem {
  const opponentLabel = opponentName(opponentComp);
  const kickoff = new Date(event.date);
  const dateLabel = kickoff.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = kickoff.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const text = `vs ${opponentLabel} • ${dateLabel} ${timeLabel}`;

  return {
    key: `${teamName}-next-${event.id}`,
    teamName,
    label: "Next",
    text,
  };
}

async function seekTeamEvent(
  teamName: string,
  offsets: number[],
  direction: "past" | "future"
) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (const offset of offsets) {
    const probe = new Date(today);
    probe.setDate(today.getDate() + (direction === "past" ? -offset : offset));
    const ymd = ymdFromDate(probe);

    for (const league of LEAGUE_IDS) {
      try {
        const board = await fetchScoreboardCached(ymd, league);
        const events = board?.events ?? [];
        for (const event of events) {
          const state = event?.status?.type?.state;
          const eligible =
            direction === "past" ? state !== "pre" : state === "pre";
          if (!eligible) continue;

          const match = matchTeamInEvent(event, teamName);
          if (match) {
            return {
              event,
              team: match.team,
              opponent: match.opponent,
            };
          }
        }
      } catch (error) {
        console.error(
          `[Header] scoreboard fetch failed for league=${league} date=${ymd}`,
          error
        );
      }
    }
  }

  return null;
}

async function buildTeamHighlights(teamName: string): Promise<HighlightItem[]> {
  if (!teamName) return [];

  const items: HighlightItem[] = [];

  try {
    const lastMatch = await seekTeamEvent(teamName, PAST_OFFSETS, "past");
    if (lastMatch) {
      items.push(
        formatPastHighlight(
          teamName,
          lastMatch.event,
          lastMatch.team,
          lastMatch.opponent
        )
      );
    }

    const nextMatch = await seekTeamEvent(teamName, FUTURE_OFFSETS, "future");
    if (nextMatch) {
      items.push(
        formatFutureHighlight(
          teamName,
          nextMatch.event,
          nextMatch.opponent
        )
      );
    }
  } catch (error) {
    console.error(`[Header] Failed to build highlights for ${teamName}`, error);
  }

  return items;
}

export default function Header({ onOpenMenu }: HeaderProps) {
  const { user, username } = useUser();
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [loadingHighlights, setLoadingHighlights] = useState(false);

  const displayName = useMemo(() => {
    const fromUser = user?.username?.trim();
    const fromContext = username?.trim();
    return fromUser || fromContext || "FootBook";
  }, [user?.username, username]);

  useEffect(() => {
    let alive = true;
    const isTestEnv =
      typeof process !== "undefined" && process.env.NODE_ENV === "test";

    if (!user?.id || isTestEnv) {
      setHighlights([]);
      setHighlightIndex(0);
      setLoadingHighlights(false);
      return;
    }

    setLoadingHighlights(true);

    (async () => {
      try {
        const { data } = await axios.get<FavouriteTeamRecord[]>(
          `${baseURL}/favourite-teams/${user.id}`
        );

        if (!alive) return;

        const teamNames = Array.from(
          new Set(
            (data ?? [])
              .map(
                (row) =>
                  row.team_name ?? row.teamName ?? row.name ?? undefined
              )
              .filter((value): value is string => typeof value === "string")
              .map((name) => name.trim())
              .filter(Boolean)
          )
        );

        if (!teamNames.length) {
          setHighlights([]);
          setHighlightIndex(0);
          return;
        }

        const results = await Promise.all(
          teamNames.map((team) => buildTeamHighlights(team))
        );

        if (!alive) return;

        const flattened = results.flat().filter(Boolean);
        setHighlights(flattened);
        setHighlightIndex(0);
      } catch (error) {
        if (!alive) return;
        console.error("[Header] Failed to load favourite highlights", error);
        setHighlights([]);
        setHighlightIndex(0);
      } finally {
        if (alive) setLoadingHighlights(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [highlights.length]);

  useEffect(() => {
    if (highlights.length <= 1) return;
    const id = window.setInterval(() => {
      setHighlightIndex((prev) =>
        highlights.length ? (prev + 1) % highlights.length : 0
      );
    }, 6000);
    return () => window.clearInterval(id);
  }, [highlights]);

  const activeHighlight =
    highlights.length > 0
      ? highlights[highlightIndex % highlights.length]
      : null;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <div className={styles.logo}>FB</div>
          <div className={styles.brandText}>
            <div className={styles.title}>{displayName}</div>
            {user ? (
              <div className={styles.highlightRow}>
                {loadingHighlights ? (
                  <span className={styles.highlightPlaceholder}>
                    Syncing favourites…
                  </span>
                ) : activeHighlight ? (
                  <>
                    <span className={styles.highlightTeam}>
                      {activeHighlight.teamName}
                    </span>
                    <span className={styles.highlightDivider}>•</span>
                    <span className={styles.highlightLabel}>
                      {activeHighlight.label}:
                    </span>
                    <span className={styles.highlightText}>
                      {activeHighlight.text}
                    </span>
                  </>
                ) : (
                  <span className={styles.highlightPlaceholder}>
                    Add favourite teams to see their fixtures here.
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
        <button
          aria-label="Open menu"
          className={styles.menuButton}
          onClick={onOpenMenu}
        >
          <Menu />
        </button>
      </div>
    </header>
  );
}
