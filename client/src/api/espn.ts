// src/api/espn.ts

/** ---------------- Scoreboard (kept from before) ---------------- */
export type ScoreboardResponse = {
  events: Array<{
    id: string;
    date: string;
    shortName: string;
    status: { type: { state: "pre" | "in" | "post"; detail: string; completed: boolean } };
    competitions: Array<{
      competitors: Array<{
        homeAway: "home" | "away";
        score?: string;
        team: { shortDisplayName: string; logo?: string };
      }>;
    }>;
  }>;
};

const SCOREBOARD_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard";

/** Format YYYYMMDD for ESPN’s `?dates=` */
export function formatEspnDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export async function fetchScoreboard(date?: Date): Promise<ScoreboardResponse> {
  const url = new URL(SCOREBOARD_BASE);
  if (date) url.searchParams.set("dates", formatEspnDate(date));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`ESPN scoreboard fetch failed: ${res.status}`);
  return res.json();
}

/** ---------------- News (new) ---------------- */
export type EspnNewsResponse = {
  header?: string;
  articles: Array<{
    type?: string;
    headline: string;
    description?: string;
    published: string; // ISO
    lastModified?: string; // ISO
    links?: { web?: { href?: string } };
    images?: Array<{ url: string; width?: number; height?: number; name?: string }>;
    byline?: string;
    categories?: Array<{ type: string; description?: string }>;
  }>;
};

const NEWS_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news";

/** Fetch top EPL news from ESPN */
export async function fetchEplNews(): Promise<EspnNewsResponse> {
  const res = await fetch(NEWS_URL);
  if (!res.ok) throw new Error(`ESPN news fetch failed: ${res.status}`);
  return res.json();
}

/** ---------------- Standings (robust) ----------------
 * Uses site.web.api and falls back across seasontype and container shapes.
 * Example: https://site.web.api.espn.com/apis/v2/sports/soccer/eng.1/standings?season=2025&level=3
 */
export type StandingsEntry = {
  team: { id: string; displayName: string; abbreviation?: string; logos?: { href: string }[] };
  note?: { rank?: number };
  stats: Array<{ name: string; value?: number; displayValue?: string }>;
};

export type StandingsWire = {
  standings?: Array<{ entries: StandingsEntry[] }>;
  children?: Array<{ name?: string; standings: { entries: StandingsEntry[] } }>;
  season?: number;
  seasonType?: number;
};

const STANDINGS_BASE =
  "https://site.web.api.espn.com/apis/v2/sports/soccer/eng.1/standings";

/** Extract entries from either `standings[]` or `children[]` */
function extractEntries(data: StandingsWire): StandingsEntry[] {
  const direct = (data.standings ?? []).flatMap(s => s?.entries ?? []);
  const fromChildren = (data.children ?? []).flatMap(c => c?.standings?.entries ?? []);
  return [...direct, ...fromChildren];
}

/** Convert ESPN stats into our compact row */
function mapRow(e: StandingsEntry) {
  const g = (k: string) => e.stats.find((s) => s.name === k);
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0));

  const rankStat = g("rank")?.value ?? g("rank")?.displayValue;
  const rankNote = e.note?.rank;
  const rank = num(rankStat ?? rankNote ?? 0);

  const P = num(g("gamesPlayed")?.value ?? g("gamesPlayed")?.displayValue);
  const W = num(g("wins")?.value ?? g("wins")?.displayValue);
  const D = num(g("ties")?.value ?? g("ties")?.displayValue); // draws
  const L = num(g("losses")?.value ?? g("losses")?.displayValue);

  const GD =
    num(g("goalDifferential")?.value ?? g("goalDifferential")?.displayValue) ||
    num(g("pointDifferential")?.value ?? g("pointDifferential")?.displayValue);

  const PTS = num(g("points")?.value ?? g("points")?.displayValue);

  return {
    pos: rank || 0,
    team: e.team.displayName,
    p: P, w: W, d: D, l: L, gd: GD, pts: PTS,
  };
}

/**
 * Fetch EPL standings for a season (YYYY).
 * We try seasontype in this order: undefined (let ESPN choose), 2 (regular), 1 (pre), 3 (post).
 * Returns sorted rows by pos; if no rank, sorts by pts, gd, goalsFor.
 */
export async function fetchEplStandings(opts?: {
  season?: number;
  seasontype?: 1 | 2 | 3; // optional override
  level?: number; // default 3
}) {
  const season = opts?.season;
  const level = String(opts?.level ?? 3);

  // try candidates until one returns non-empty entries
  const seasonTypeCandidates = opts?.seasontype
    ? [opts.seasontype]
    : [undefined, 2, 1, 3] as Array<1 | 2 | 3 | undefined>;

  for (const st of seasonTypeCandidates) {
    const url = new URL(STANDINGS_BASE);
    if (season) url.searchParams.set("season", String(season));
    url.searchParams.set("level", level);
    if (st !== undefined) url.searchParams.set("seasontype", String(st));

    const res = await fetch(url.toString());
    if (!res.ok) continue; // try next
    const data: StandingsWire = await res.json();

    const entries = extractEntries(data);
    if (entries.length > 0) {
      const rows = entries.map(mapRow);

      // If rank missing/zero for some entries, sort by points/gd/name as fallback
      const allHaveRank = rows.every(r => r.pos > 0);
      if (!allHaveRank) {
        rows.sort((a, b) =>
          b.pts - a.pts ||
          b.gd - a.gd ||
          a.team.localeCompare(b.team)
        );
        // assign positions
        rows.forEach((r, i) => (r.pos = i + 1));
      } else {
        rows.sort((a, b) => a.pos - b.pos);
      }

      return rows;
    }
  }

  // nothing worked
  return [];
}
