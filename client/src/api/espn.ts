// src/api/espn.ts

/** ---------------- Scoreboard ---------------- */
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
        team: { shortDisplayName: string; logo?: string; abbreviation?: string; id?: string };
        statistics?: Array<{
          name?: string;
          displayName?: string;
          shortDisplayName?: string;
          abbreviation?: string;
          type?: string;
          value?: number | string;
          displayValue?: string;
          stat?: string;
        }>;
      }>;
      details?:
        | Array<{
            type?: { id?: string; text?: string };
            clock?: { displayValue?: string };
            team?: { id?: string; abbreviation?: string };
            homeAway?: "home" | "away";
            scoringPlay?: boolean;
            athletesInvolved?: Array<{ id?: string; displayName?: string }>;
            text?: string;
          }>
        | {
            scoringPlays?: Array<{
              clock?: { displayValue?: string };
              team?: { abbreviation?: string; id?: string };
              homeAway?: "home" | "away";
              athletesInvolved?: Array<{ athlete?: { displayName?: string } }>;
              text?: string;
            }>;
          };
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

/** ---------------- News ---------------- */
export type EspnNewsResponse = {
  header?: string;
  articles: Array<{
    type?: string;
    headline: string;
    description?: string;
    published: string;
    lastModified?: string;
    links?: { web?: { href?: string } };
    images?: Array<{ url: string; width?: number; height?: number; name?: string }>;
    byline?: string;
    categories?: Array<{ type: string; description?: string }>;
  }>;
};

const NEWS_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news";

export async function fetchEplNews(): Promise<EspnNewsResponse> {
  const res = await fetch(NEWS_URL);
  if (!res.ok) throw new Error(`ESPN news fetch failed: ${res.status}`);
  return res.json();
}

/** ---------------- Standings (robust) ---------------- */
export type StandingsEntry = {
  team: { id: string; displayName: string; abbreviation?: string; logos?: { href: string }[] };
  note?: { rank?: number };
  stats: Array<{ name: string; value?: number; displayValue?: string }>;
};
export type StandingsWire = {
  standings?: Array<{ entries: StandingsEntry[] }>;
  children?: Array<{ name?: string; standings: { entries: StandingsEntry[] } }>;
};
const STANDINGS_BASE =
  "https://site.web.api.espn.com/apis/v2/sports/soccer/eng.1/standings";

function extractEntries(data: StandingsWire): StandingsEntry[] {
  const direct = (data.standings ?? []).flatMap((s) => s?.entries ?? []);
  const fromChildren = (data.children ?? []).flatMap((c) => c?.standings?.entries ?? []);
  return [...direct, ...fromChildren];
}
function mapRow(e: StandingsEntry) {
  const g = (k: string) => e.stats.find((s) => s.name === k);
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0));
  const rankStat = g("rank")?.value ?? g("rank")?.displayValue;
  const rankNote = e.note?.rank;
  const rank = num(rankStat ?? rankNote ?? 0);
  const P = num(g("gamesPlayed")?.value ?? g("gamesPlayed")?.displayValue);
  const W = num(g("wins")?.value ?? g("wins")?.displayValue);
  const D = num(g("ties")?.value ?? g("ties")?.displayValue);
  const L = num(g("losses")?.value ?? g("losses")?.displayValue);
  const GD =
    num(g("goalDifferential")?.value ?? g("goalDifferential")?.displayValue) ||
    num(g("pointDifferential")?.value ?? g("pointDifferential")?.displayValue);
  const PTS = num(g("points")?.value ?? g("points")?.displayValue);
  return { pos: rank || 0, team: e.team.displayName, p: P, w: W, d: D, l: L, gd: GD, pts: PTS };
}
export async function fetchEplStandings(opts?: {
  season?: number;
  seasontype?: 1 | 2 | 3;
  level?: number;
}) {
  const season = opts?.season;
  const level = String(opts?.level ?? 3);
  const seasonTypeCandidates = opts?.seasontype
    ? [opts.seasontype]
    : ([undefined, 2, 1, 3] as Array<1 | 2 | 3 | undefined>);
  for (const st of seasonTypeCandidates) {
    const url = new URL(STANDINGS_BASE);
    if (season) url.searchParams.set("season", String(season));
    url.searchParams.set("level", level);
    if (st !== undefined) url.searchParams.set("seasontype", String(st));
    const res = await fetch(url.toString());
    if (!res.ok) continue;
    const data: StandingsWire = await res.json();
    const entries = extractEntries(data);
    if (entries.length > 0) {
      const rows = entries.map(mapRow);
      const allHaveRank = rows.every((r) => r.pos > 0);
      if (!allHaveRank) {
        rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || a.team.localeCompare(b.team));
        rows.forEach((r, i) => (r.pos = i + 1));
      } else rows.sort((a, b) => a.pos - b.pos);
      return rows;
    }
  }
  return [];
}

/** ---------------- Match details (from SCOREBOARD only) ---------------- */
export type Scorer = { minute?: string; player: string; teamAbbr?: string; homeAway?: "home"|"away" };
export type StatMetric = {
  key: string;
  label: string;
  /** percent of left/home share (0–100) */
  homePct?: number;
  /** raw values so UI can show both sides */
  homeVal?: number;
  awayVal?: number;
};
export type MatchDetailsFromScoreboard = {
  metrics: StatMetric[];  // possession + (sot|shots|corners|fouls)
  saves?: { home?: number; away?: number; homeAbbr?: string; awayAbbr?: string };
  scorers: Scorer[];
};

// helpers
function normalizeMinute(v?: string) {
  if (!v) return undefined;
  const m = v.match(/\d+(?:\+\d+)?/);
  return m ? `${m[0]}'` : v;
}
function parseNum(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const m = v.match(/-?\d+(\.\d+)?/);
    if (m) return Number(m[0]);
  }
  return undefined;
}
function valFrom(stat: any) {
  if (!stat) return undefined;
  return parseNum(stat.value ?? stat.displayValue ?? stat.stat);
}
function normKey(s?: string) {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function findStat(stats: any[] | undefined, candidates: string[]) {
  if (!stats) return undefined;
  for (const s of stats) {
    const key =
      normKey(s?.name) ||
      normKey(s?.displayName) ||
      normKey(s?.shortDisplayName) ||
      normKey(s?.abbreviation) ||
      normKey(s?.type);
    if (!key) continue;
    for (const c of candidates) {
      if (key === normKey(c)) {
        const v = valFrom(s);
        if (v !== undefined) return v;
      }
    }
  }
  return undefined;
}
function sharePct(h?: number, a?: number) {
  if (typeof h !== "number" || typeof a !== "number") return undefined;
  const tot = h + a;
  return tot > 0 ? Math.round((h / tot) * 100) : undefined;
}

/** Scorers from scoreboard */
export function extractScorersFromScoreboardEvent(ev: any): Scorer[] {
  const comp = ev?.competitions?.[0];

  const abbrMap: Record<string, string> = {};
  (comp?.competitors ?? []).forEach((c: any) => {
    const id = c?.team?.id ?? c?.id;
    const ab = c?.team?.abbreviation;
    if (id && ab) abbrMap[id] = ab;
  });

  const fromArray = Array.isArray(comp?.details) ? comp?.details : [];
  const fromScoring = !Array.isArray(comp?.details) ? comp?.details?.scoringPlays ?? [] : [];
  const plays = [...fromArray.filter((p: any) => p?.scoringPlay), ...fromScoring];

  return plays.map((p: any) => {
    const minute = normalizeMinute(p?.clock?.displayValue) ?? normalizeMinute(p?.text);
    const player =
      p?.athletesInvolved?.[0]?.displayName ??
      p?.athletesInvolved?.[0]?.athlete?.displayName ??
      (p?.text ? String(p.text).split(" (")[0] : "Goal");
    const teamId = p?.team?.id;
    const teamAbbr = p?.team?.abbreviation ?? (teamId ? abbrMap[teamId] : undefined);
    const homeAway = p?.homeAway as "home" | "away" | undefined;
    return { minute, player, teamAbbr, homeAway };
  });
}

/** Stats from scoreboard (adds raw values for both sides) */
export function extractStatsFromScoreboardEvent(ev: any): MatchDetailsFromScoreboard {
  const comp = ev?.competitions?.[0];
  const home = comp?.competitors?.find((c: any) => c.homeAway === "home");
  const away = comp?.competitors?.find((c: any) => c.homeAway === "away");
  const hStats = home?.statistics ?? [];
  const aStats = away?.statistics ?? [];

  // possession
  const hPoss = findStat(hStats, ["possessionPct", "possession%", "possession"]);
  const aPoss = findStat(aStats, ["possessionPct", "possession%", "possession"]);
  const possHomePct = typeof hPoss === "number" ? Math.round(hPoss) :
                      typeof aPoss === "number" ? 100 - Math.round(aPoss) : undefined;

  // helpers for secondary metrics
  const tryPair = (label: string, names: string[]) => {
    const hv = findStat(hStats, names);
    const av = findStat(aStats, names);
    if (hv !== undefined && av !== undefined) {
      return {
        key: names[0],
        label,
        homeVal: Math.round(Number(hv)),
        awayVal: Math.round(Number(av)),
        homePct: sharePct(Number(hv), Number(av)),
      } as StatMetric;
    }
    return undefined;
  };

  const secondary =
    tryPair("Shots on Target", ["shotsOnTarget", "shotsontarget", "st", "sot"]) ||
    tryPair("Total Shots", ["totalShots", "shots", "sh"]) ||
    tryPair("Corners", ["wonCorners", "cornerkicks", "corners", "cw"]) ||
    tryPair("Fouls", ["foulsCommitted", "fouls", "fc"]);

  const metrics: StatMetric[] = [];
  if (possHomePct !== undefined) {
    const possAway = 100 - possHomePct;
    metrics.push({
      key: "poss",
      label: "Possession (%)",
      homePct: possHomePct,
      homeVal: possHomePct,
      awayVal: possAway,
    });
  }
  if (secondary) metrics.push(secondary);

  // saves (as counts)
  const savesHome = findStat(hStats, ["saves", "sv"]);
  const savesAway = findStat(aStats, ["saves", "sv"]);
  const saves =
    savesHome !== undefined && savesAway !== undefined
      ? {
          home: Number(savesHome),
          away: Number(savesAway),
          homeAbbr: home?.team?.abbreviation,
          awayAbbr: away?.team?.abbreviation,
        }
      : undefined;

  return {
    metrics,
    saves,
    scorers: extractScorersFromScoreboardEvent(ev),
  };
}
