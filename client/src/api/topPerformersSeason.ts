// src/api/topPerformersSeason.ts
// Season-wide leaders built ONLY from the scoreboard endpoint.
// We walk the season's calendar dates, aggregate goals / yellows / reds,
// and compute TEAM clean sheets as a GK proxy. Results are cached per season.

import { fetchScoreboard, formatEspnDate } from "./espn";

export type LeaderItem = {
  id: string;            // athlete id OR "team:<id>"
  name: string;          // player name or team name
  teamId?: string;
  teamName?: string;
  teamLogo?: string;
  value: number;
};

export type TopPerformersSeason = {
  seasonYear: number;    // e.g., 2025 for 2025-26
  fetchedAt: number;
  goals: LeaderItem[];   // sorted desc
  yellows: LeaderItem[];
  reds: LeaderItem[];
  cleanSheetsTeam: LeaderItem[];
};

const LS_KEY = (year: number) => `top-performers-season:eng1:${year}`;
const CACHE_TTL_MS = 1000 * 60 * 60; // 60 minutes

type Competitor = {
  homeAway?: "home" | "away";
  score?: string;
  team?: {
    id: string;
    displayName: string;
    shortDisplayName?: string;
    logo?: string;
    logos?: Array<{ href: string }>;
  };
};

type Scoreboard = {
  leagues?: Array<{
    season?: { year?: number };
    calendar?: string[]; // ISO dates for the matchdays
  }>;
  events?: Array<{
    competitions?: Array<{
      competitors?: Competitor[];
      details?: any[]; // event "moments" (goals / cards)
    }>;
  }>;
};

function firstLogo(c?: Competitor) {
  const logos = c?.team?.logos;
  if (logos?.[0]?.href) return logos[0].href;
  // some payloads give single `logo`
  return c?.team?.logo;
}

function add(map: Map<string, LeaderItem>, key: string, base: Omit<LeaderItem, "value">, by = 1) {
  const prev = map.get(key);
  if (prev) prev.value += by;
  else map.set(key, { ...base, value: by });
}

function dateFromYYYYMMDD(s: string) {
  return new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T00:00:00Z`);
}

/** Get the season's calendar by asking the scoreboard for any day around August of that year */
async function getSeasonCalendar(year: number): Promise<string[]> {
  // anchor in mid-August (EPL start)
  const anchor = new Date(Date.UTC(year, 7, 18));
  const board = (await fetchScoreboard(anchor)) as unknown as Scoreboard;
  return board?.leagues?.[0]?.calendar ?? [];
}

/** Build leaders for a whole season (may take a few seconds on first run). */
export async function buildTopPerformersSeason(year: number, signal?: AbortSignal): Promise<TopPerformersSeason> {
  // 1) cache
  try {
    const raw = localStorage.getItem(LS_KEY(year));
    if (raw) {
      const cached = JSON.parse(raw) as TopPerformersSeason;
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached;
    }
  } catch {}

  const goals = new Map<string, LeaderItem>();
  const yellows = new Map<string, LeaderItem>();
  const reds = new Map<string, LeaderItem>();
  const cleanSheets = new Map<string, LeaderItem>(); // TEAM

  // 2) calendar
  const calendarIsos = await getSeasonCalendar(year);
  if (!calendarIsos.length) {
    // fall back to "today" so the card doesn't look broken
    const today = new Date();
    const sb = (await fetchScoreboard(today)) as unknown as Scoreboard;
    processBoard(sb, goals, yellows, reds, cleanSheets, signal);
  } else {
    // iterate matchdays (serial to be gentle on ESPN)
    for (const iso of calendarIsos) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const yyyymmdd = formatEspnDate(new Date(iso));
      const sb = (await fetchScoreboard(dateFromYYYYMMDD(yyyymmdd))) as unknown as Scoreboard;
      processBoard(sb, goals, yellows, reds, cleanSheets, signal);
    }
  }

  const toTop = (m: Map<string, LeaderItem>) =>
    [...m.values()].sort((a, b) => b.value - a.value);

  const result: TopPerformersSeason = {
    seasonYear: year,
    fetchedAt: Date.now(),
    goals: toTop(goals),
    yellows: toTop(yellows),
    reds: toTop(reds),
    cleanSheetsTeam: toTop(cleanSheets),
  };

  try { localStorage.setItem(LS_KEY(year), JSON.stringify(result)); } catch {}

  return result;
}

function processBoard(
  board: Scoreboard,
  goals: Map<string, LeaderItem>,
  yellows: Map<string, LeaderItem>,
  reds: Map<string, LeaderItem>,
  cleanSheets: Map<string, LeaderItem>,
  signal?: AbortSignal
) {
  for (const ev of board?.events ?? []) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const comp = ev.competitions?.[0];
    const home = comp?.competitors?.find((c) => c.homeAway === "home");
    const away = comp?.competitors?.find((c) => c.homeAway === "away");

    // Team clean sheets
    const h = Number(home?.score ?? "0");
    const a = Number(away?.score ?? "0");
    if (away && a === 0 && home?.team?.id) {
      add(cleanSheets, `team:${home.team.id}`, {
        id: `team:${home.team.id}`,
        name: home.team.displayName,
        teamId: home.team.id,
        teamName: home.team.displayName,
        teamLogo: firstLogo(home),
      }, 1);
    }
    if (home && h === 0 && away?.team?.id) {
      add(cleanSheets, `team:${away.team.id}`, {
        id: `team:${away.team.id}`,
        name: away.team.displayName,
        teamId: away.team.id,
        teamName: away.team.displayName,
        teamLogo: firstLogo(away),
      }, 1);
    }

    const details: any[] = Array.isArray(comp?.details)
      ? (comp?.details as any[])
      : (comp?.details?.scoringPlays as any[]) || [];

    for (const d of details ?? []) {
      const athlete = d?.athletesInvolved?.[0];
      if (!athlete?.id) continue;

      const teamId = athlete?.team?.id ?? d?.team?.id;
      const carrier =
        (home?.team?.id === teamId ? home : undefined) ??
        (away?.team?.id === teamId ? away : undefined);

      const base = {
        id: athlete.id,
        name: athlete.displayName ?? "Player",
        teamId,
        teamName: carrier?.team?.displayName,
        teamLogo: firstLogo(carrier),
      };

      if (d?.scoringPlay) add(goals, athlete.id, base, 1);
      if (d?.yellowCard) add(yellows, athlete.id, base, 1);
      if (d?.redCard) add(reds, athlete.id, base, 1);
    }
  }
}
