// src/api/espn.ts

/** ---------------- Shared utils ---------------- */
type AnyObj = Record<string, any>;

function parseNum(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const m = v.match(/-?\d+(\.\d+)?/);
    if (m) return Number(m[0]);
  }
  return undefined;
}
function toPercent(n: number | null | undefined): number | null {
  if (n == null) return null;
  if (!isFinite(n)) return null;
  if (n > 0 && n <= 1) return Math.round(n * 100);
  return Math.round(n);
}
function normKey(s?: string) {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function valFrom(stat: any) {
  if (!stat) return undefined;
  return parseNum(stat.value ?? stat.displayValue ?? stat.stat);
}
function findStat(stats: any[] | undefined, candidates: string[]) {
  if (!stats) return undefined;
  for (const s of stats) {
    const key =
      normKey(s?.name) ||
      normKey(s?.displayName) ||
      normKey(s?.shortDisplayName) ||
      normKey(s?.abbreviation) ||
      normKey(s?.type) ||
      normKey(s?.label);
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

/** Minute helpers */
function minuteToNumber(v?: string): number | undefined {
  if (!v) return undefined;
  const m = v.match(/(\d+)(?:\+(\d+))?/);
  if (!m) return undefined;
  const base = parseInt(m[1]!, 10);
  const extra = m[2] ? parseInt(m[2], 10) : 0;
  const n = base + extra;
  return Number.isFinite(n) ? n : undefined;
}
function normalizeMinute(v?: string) {
  if (!v) return undefined;
  const m = v.match(/\d+(?:\+\d+)?/);
  return m ? `${m[0]}'` : v;
}

/** Name-normalization helpers for matching */
function normName(s?: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9 ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
function parseReplacesNames(text?: string): { inName?: string; outName?: string } {
  if (!text) return {};
  const m = text.match(/([\p{L}'\-. ]+)\s+replaces\s+([\p{L}'\-. ]+)/iu);
  if (!m) return {};
  return { inName: m[1]?.trim(), outName: m[2]?.trim() };
}

/** ---------------- Scoreboard ---------------- */
export type ScoreboardResponse = {
  events: Array<{
    id: string;
    date: string;
    shortName: string;
    status: {
      type: { state: "pre" | "in" | "post"; detail: string; completed: boolean };
    };
    competitions: Array<{
      competitors: Array<{
        homeAway: "home" | "away";
        score?: string;
        team: {
          shortDisplayName: string;
          logo?: string;
          logos?: Array<{ href?: string }>;
          abbreviation?: string;
          id?: string;
        };
        statistics?: Array<{
          name?: string;
          displayName?: string;
          shortDisplayName?: string;
          abbreviation?: string;
          type?: string;
          value?: number | string;
          displayValue?: string;
          stat?: string;
          label?: string;
        }>;
      }>;
      details?:
        | Array<{
            type?: { id?: string; text?: string };
            clock?: { displayValue?: string };
            team?: { id?: string; abbreviation?: string };
            homeAway?: "home" | "away";
            scoringPlay?: boolean;
            athletesInvolved?: Array<{ id?: string; displayName?: string; athlete?: { displayName?: string } }>;
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

/** parse goal-scorer text bits */
function parseScorerText(raw?: string): { name?: string; isPenalty?: boolean; isOG?: boolean } {
  if (!raw) return {};
  const text = String(raw).trim();

  const isPenalty = /\bpen(?:alty|alties)?\b|\(PEN\)|\((?:P)\)/i.test(text);
  const isOG = /\bown[- ]goal\b|\(OG\)/i.test(text);

  let m = text.match(/\bby\s+([\p{L}][\p{L}'.\- ]+)/iu);
  if (m?.[1]) return { name: m[1].trim(), isPenalty, isOG };

  m = text.match(/^([\p{L}][\p{L}'.\- ]+?)\s*(?:\(|\s+)(?:converts|scores|nets|finishes|heads|strikes|fires)/iu);
  if (m?.[1]) return { name: m[1].trim(), isPenalty, isOG };

  m = text.match(/\.\s*([\p{L}][\p{L}'.\- ]+?)\s+(?:converts|scores|nets|finishes|heads|strikes|fires)/iu);
  if (m?.[1]) return { name: m[1].trim(), isPenalty, isOG };

  m = text.match(/-\s*([\p{L}][\p{L}'.\- ]+)/iu);
  if (m?.[1]) return { name: m[1].trim(), isPenalty, isOG };

  m = text.match(/^([\p{L}][\p{L}'.\- ]+?)\s*\(/iu);
  if (m?.[1]) return { name: m[1].trim(), isPenalty, isOG };

  return { isPenalty, isOG };
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

const NEWS_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news";

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
export type Scorer = {
  minute?: string;
  player: string;
  teamAbbr?: string;
  homeAway?: "home" | "away";
};
export type StatMetric = {
  key: string;
  label: string;
  homePct?: number;
  homeVal?: number;
  awayVal?: number;
};
export type MatchDetailsFromScoreboard = {
  metrics: StatMetric[];
  saves?: { home?: number; away?: number; homeAbbr?: string; awayAbbr?: string };
  scorers: Scorer[];
};

function buildTeamMaps(competitors: any[] | undefined) {
  const idToSide: Record<string, "home" | "away"> = {};
  const idToAbbr: Record<string, string> = {};
  const abbrToSide: Record<string, "home" | "away"> = {};
  (competitors ?? []).forEach((c: any) => {
    const id = String(c?.team?.id ?? c?.id ?? "");
    const ab = c?.team?.abbreviation;
    const side = c?.homeAway as "home" | "away";
    if (id && side) idToSide[id] = side;
    if (id && ab) idToAbbr[id] = ab;
    if (ab && side) abbrToSide[ab] = side;
  });
  return { idToSide, idToAbbr, abbrToSide };
}

export function extractScorersFromScoreboardEvent(ev: any): Scorer[] {
  const comp = ev?.competitions?.[0];
  const competitors = comp?.competitors ?? [];
  const { idToSide, idToAbbr, abbrToSide } = buildTeamMaps(competitors);

  const fromArray = Array.isArray(comp?.details) ? comp?.details : [];
  const fromScoring = !Array.isArray(comp?.details) ? comp?.details?.scoringPlays ?? [] : [];
  const plays = [...fromArray.filter((p: any) => p?.scoringPlay), ...fromScoring];

  return plays.map((p: any) => {
    const minute = normalizeMinute(p?.clock?.displayValue) ?? normalizeMinute(p?.text);

    let name =
      p?.athletesInvolved?.[0]?.displayName ??
      p?.athletesInvolved?.[0]?.athlete?.displayName ??
      (p as any)?.athlete?.displayName ??
      undefined;

    const { name: parsed, isPenalty, isOG } = parseScorerText(p?.text);
    if (!name && parsed) name = parsed;
    if (!name) name = "Goal";

    name = name.replace(/\s*\((?:P|p)\)\s*/g, "").replace(/\s*\(OG\)\s*/g, "");
    if (isPenalty) name += " (p)";
    if (isOG) name += " (OG)";

    const teamId = p?.team?.id ? String(p.team.id) : undefined;
    const teamAbbr = p?.team?.abbreviation ?? (teamId ? idToAbbr[teamId] : undefined);

    const homeAway =
      (p?.homeAway as "home" | "away" | undefined) ??
      (teamId ? idToSide[teamId] : undefined) ??
      (teamAbbr ? abbrToSide[teamAbbr] : undefined);

    return { minute, player: name, teamAbbr, homeAway };
  });
}

export function extractStatsFromScoreboardEvent(ev: any): MatchDetailsFromScoreboard {
  const comp = ev?.competitions?.[0];
  const home = comp?.competitors?.find((c: any) => c.homeAway === "home");
  const away = comp?.competitors?.find((c: any) => c.homeAway === "away");
  const hStats = home?.statistics ?? [];
  const aStats = away?.statistics ?? [];

  const hPoss = findStat(hStats, ["possessionPct", "possession%", "possession"]);
  const aPoss = findStat(aStats, ["possessionPct", "possession%", "possession"]);
  const possHomePct =
    typeof hPoss === "number"
      ? Math.round(hPoss)
      : typeof aPoss === "number"
      ? 100 - Math.round(aPoss)
      : undefined;

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

/** =================== SUMMARY → FULL TEAM & PLAYER STATS =================== */
export type TeamSide = "home" | "away";

export type TeamDisciplineFouls = {
  foulsCommitted: number | null;
  yellowCards: number | null;
  redCards: number | null;
  offsides: number | null;
};

export type TeamSetPiecesSaves = {
  cornerKicksWon: number | null;
  savesByGK: number | null;
};

export type TeamPossessionPassing = {
  possessionPct: number | null;
  passesAttempted: number | null;
  accuratePasses: number | null;
  passCompletionPct: number | null;
};

export type TeamShooting = {
  totalShots: number | null;
  shotsOnTarget: number | null;
  onTargetPct: number | null;
  blockedShots: number | null;
  penaltyKicksTaken: number | null;
  penaltyGoals: number | null;
};

export type TeamCrossLong = {
  crossesAttempted: number | null;
  accurateCrosses: number | null;
  crossAccuracyPct: number | null;
  longBallsAttempted: number | null;
  accurateLongBalls: number | null;
  longBallAccuracyPct: number | null;
};

export type TeamDefActions = {
  tacklesTotal: number | null;
  tacklesWon: number | null;
  tackleSuccessPct: number | null;
  interceptions: number | null;
  clearancesTotal: number | null;
  clearancesEffective: number | null;
};

export type TeamStatsBundle = {
  teamId: string;
  teamName: string;
  side: TeamSide;
  teamAbbr?: string | null;
  logoUrl?: string | null;
  crest?: string | null;

  disciplineFouls: TeamDisciplineFouls;
  setPiecesSaves: TeamSetPiecesSaves;
  possessionPassing: TeamPossessionPassing;
  shooting: TeamShooting;
  crossingLongBalls: TeamCrossLong;
  defensiveActions: TeamDefActions;
};

export type PlayerLine = {
  athleteId: string;
  athleteName: string;
  teamId: string;
  teamName: string;

  headshotUrl?: string | null;
  jersey?: string | number | null;
  positionAbbr?: string | null;

  appearances?: number | null;
  subsOn?: number | null;
  subbedIn?: boolean | null;
  subbedOut?: boolean | null;

  // minutes (NEW)
  subInMinute?: number | null;
  subOutMinute?: number | null;

  foulsCommitted?: number | null;
  foulsSuffered?: number | null;
  yellowCards?: number | null;
  redCards?: number | null;
  ownGoals?: number | null;

  goalsAgainst?: number | null;
  saves?: number | null;
  shotsOnTargetFaced?: number | null;

  goals?: number | null;
  assists?: number | null;
  shotsTotal?: number | null;
  shotsOnTarget?: number | null;
  offsides?: number | null;
};

export type SummaryScore = { home: number | null; away: number | null };
export type SummaryNormalized = {
  eventId: string;
  home: TeamStatsBundle;
  away: TeamStatsBundle;
  players: PlayerLine[];
  score?: SummaryScore;
  statusText?: string | null;
  scorers?: Scorer[];
  compDate?: string | null;
};

const numOrNull = (v: any): number | null => {
  const n = parseNum(v);
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};
function statObj(stats: AnyObj[] | undefined, names: string[]): AnyObj | undefined {
  if (!stats) return;
  for (const s of stats) {
    const key =
      normKey(s?.name) ||
      normKey(s?.displayName) ||
      normKey(s?.shortDisplayName) ||
      normKey(s?.abbreviation) ||
      normKey(s?.type) ||
      normKey(s?.label);
    if (!key) continue;
    if (names.some((n) => key === normKey(n))) return s;
  }
  return;
}
function statVal(stats: AnyObj[] | undefined, names: string[]): number | null {
  const s = statObj(stats, names);
  if (!s) return null;
  return numOrNull(s.value ?? s.displayValue ?? s.stat);
}
function idFromUid(uid?: string): string | undefined {
  const m = uid?.match(/(?:^|~)a:(\d+)/);
  return m?.[1];
}
function headshotFromAthlete(a?: AnyObj): string | null {
  const direct =
    a?.headshot?.href ||
    a?.image?.href ||
    a?.images?.[0]?.url ||
    a?.photo?.href ||
    null;
  if (direct) return direct;
  const rawId = String(a?.id ?? "") || idFromUid(a?.uid);
  const pid = rawId && /^\d+$/.test(rawId) ? rawId : undefined;
  return pid ? `https://a.espncdn.com/i/headshots/soccer/players/full/${pid}.png` : null;
}

/** Map team node from summary → bundle */
function extractTeamFromSummaryTeamNode(node: AnyObj, side: TeamSide): TeamStatsBundle {
  const { team } = node;
  const teamAbbr = team?.abbreviation ?? team?.shortDisplayName ?? null;
  const logoUrl =
    team?.logos?.[0]?.href ??
    team?.logo ??
    (team as any)?.alternateLogo ??
    null;

  const stats: AnyObj[] = node.statistics ?? [];

  const foulsCommitted = statVal(stats, ["fouls committed", "fouls", "fc"]);
  const yellowCards = statVal(stats, ["yellow cards", "yc"]);
  const redCards = statVal(stats, ["red cards", "rc"]);
  const offsides = statVal(stats, ["offsides", "offside", "of"]);

  const cornerKicksWon = statVal(stats, ["corner kicks", "corner kicks won", "corners", "won corners"]);
  const savesByGK = statVal(stats, ["saves", "sv", "saves made"]);

  const possessionPct = toPercent(statVal(stats, ["possession", "possession%", "possessionpct"]));
  let passesAttempted = statVal(stats, [
    "totalpasses",
    "total passes",
    "passes total",
    "passes attempted",
    "attempted passes",
    "passes",
  ]);
  let accuratePasses = statVal(stats, [
    "accuratepasses",
    "accurate passes",
    "passes completed",
    "completed passes",
    "completed",
    "passes",
  ]);
  const passCompletionPct = toPercent(
    statVal(stats, ["passpct", "pass completion %", "pass accuracy", "passing %", "passing accuracy", "pass accuracy %"])
  );

  if (
    passesAttempted == null &&
    accuratePasses != null &&
    passCompletionPct != null &&
    passCompletionPct > 0
  ) {
    const acc = Number(accuratePasses);
    const pct = Number(passCompletionPct) / 100;
    if (Number.isFinite(acc) && pct > 0) passesAttempted = Math.round(acc / pct);
  }

  const totalShots = statVal(stats, ["total shots", "shots", "shots total", "sh"]);
  const shotsOnTarget = statVal(stats, ["shots on target", "st", "sot"]);
  const onTargetPct = toPercent(statVal(stats, ["shotpct", "on-target %", "on target %", "shots on target %"]));
  const blockedShots = statVal(stats, ["blocked shots", "blocks"]);
  const penaltyKicksTaken = statVal(stats, ["penalties taken", "penalty kicks taken", "pk att", "penaltykickshots"]);
  const penaltyGoals = statVal(stats, ["penalty goals", "pk goals", "penaltykickgoals"]);

  const crossesAttempted = statVal(stats, ["crosses attempted", "crosses", "totalcrosses"]);
  const accurateCrosses = statVal(stats, ["accurate crosses", "crosses completed"]);
  const crossAccuracyPct = toPercent(statVal(stats, ["crosspct", "cross %", "crosses %", "crossing %"]));
  const longBallsAttempted = statVal(stats, ["long balls attempted", "long balls", "totallongballs", "total long balls"]);
  const accurateLongBalls = statVal(stats, ["accurate long balls", "long balls completed"]);
  const longBallAccuracyPct = toPercent(statVal(stats, ["longballpct", "long balls %", "long ball accuracy"]));

  const tacklesTotal = statVal(stats, ["total tackles", "tackles"]);
  const tacklesWon = statVal(stats, ["tackles won", "effective tackles"]);
  const tackleSuccessPct = toPercent(statVal(stats, ["tacklepct", "tackles %", "tackle success rate"]));
  const interceptions = statVal(stats, ["interceptions"]);
  const clearancesTotal = statVal(stats, ["clearances", "totalclearance", "total clearance"]);
  const clearancesEffective = statVal(stats, ["effective clearances", "effectiveclearance", "effective clearance"]);

  return {
    teamId: String(team?.id ?? ""),
    teamName: team?.displayName ?? team?.name ?? "",
    side,
    teamAbbr,
    logoUrl,
    crest: logoUrl,
    disciplineFouls: { foulsCommitted, yellowCards, redCards, offsides },
    setPiecesSaves: { cornerKicksWon, savesByGK },
    possessionPassing: { possessionPct, passesAttempted, accuratePasses, passCompletionPct },
    shooting: { totalShots, shotsOnTarget, onTargetPct, blockedShots, penaltyKicksTaken, penaltyGoals },
    crossingLongBalls: {
      crossesAttempted,
      accurateCrosses,
      crossAccuracyPct,
      longBallsAttempted,
      accurateLongBalls,
      longBallAccuracyPct,
    },
    defensiveActions: {
      tacklesTotal,
      tacklesWon,
      tackleSuccessPct,
      interceptions,
      clearancesTotal,
      clearancesEffective,
    },
  };
}

/** Flatten players from summary (supports multiple shapes) */
function extractPlayersFromSummary(summary: any): PlayerLine[] {
  const direct: PlayerLine[] = Array.isArray(summary?.players) ? summary.players : [];
  if (direct.length > 0) return direct;

  const out: PlayerLine[] = [];

  const statify = (arr: any[]): Record<string, number> => {
    const m: Record<string, number> = {};
    for (const s of arr ?? []) {
      if (s?.statistics && typeof s.statistics === "object") {
        for (const [k, v] of Object.entries(s.statistics)) {
          const n = Number(v as any);
          if (!Number.isNaN(n)) m[String(k).toLowerCase()] = n;
        }
      } else {
        const key = String(s?.name ?? "").toLowerCase();
        const raw = s?.value ?? s?.displayValue;
        const num = typeof raw === "number" ? raw : Number(String(raw ?? "").replace(/[^\d.-]/g, ""));
        if (key && !Number.isNaN(num)) m[key] = num;
      }
    }
    return m;
  };

  // boxscore.players[].athletes[]
  const bsPlayers = summary?.boxscore?.players;
  if (Array.isArray(bsPlayers) && bsPlayers.length) {
    for (const teamBlock of bsPlayers) {
      const teamId = String(teamBlock?.team?.id ?? teamBlock?.teamId ?? "");
      const teamName = String(teamBlock?.team?.displayName ?? teamBlock?.team?.name ?? "");
      const athletes = Array.isArray(teamBlock?.athletes) ? teamBlock.athletes : [];
      for (const a of athletes) {
        const ath = a?.athlete ?? {};
        const stats = statify(a?.stats ?? a?.statistics ?? []);
        out.push({
          teamId,
          teamName,
          athleteId: String(ath?.id ?? a?.id ?? Math.random().toString(36).slice(2)),
          athleteName: String(ath?.displayName ?? ath?.fullName ?? "Unknown"),
          jersey: a?.jersey ?? ath?.jersey ?? undefined,
          positionAbbr: a?.position?.abbreviation ?? ath?.position?.abbreviation ?? undefined,

          appearances: stats["appearances"],
          subsOn: stats["subins"] ?? stats["subs on"],
          subbedIn: a?.subbedIn ?? (a?.starter === false ? true : undefined),
          subbedOut: a?.subbedOut,

          foulsCommitted: stats["foulscommitted"],
          foulsSuffered: stats["foulssuffered"],
          yellowCards: stats["yellowcards"],
          redCards: stats["redcards"],
          ownGoals: stats["owngoals"],

          goalsAgainst: stats["goalsconceded"],
          saves: stats["saves"] ?? stats["savesmade"],
          shotsOnTargetFaced: stats["shotsfaced"],

          goals: stats["totalgoals"] ?? stats["goals"],
          assists: stats["goalassists"] ?? stats["assists"],
          shotsTotal: stats["totalshots"] ?? stats["shots"],
          shotsOnTarget: stats["shotsontarget"],
          offsides: stats["offsides"],
        });
      }
    }
    if (out.length) return out;
  }

  // boxscore.teams[].players[] (older shape)
  const bsTeams = summary?.boxscore?.teams;
  if (Array.isArray(bsTeams) && bsTeams.length) {
    for (const t of bsTeams) {
      const teamId = String(t?.team?.id ?? t?.teamId ?? "");
      const teamName = String(t?.team?.displayName ?? t?.team?.name ?? "");
      const roster = Array.isArray(t?.players) ? t.players : [];
      for (const rp of roster) {
        const ath = rp?.athlete ?? {};
        const stats = statify(rp?.stats ?? rp?.statistics ?? []);
        out.push({
          teamId,
          teamName,
          athleteId: String(ath?.id ?? rp?.id ?? Math.random().toString(36).slice(2)),
          athleteName: String(ath?.displayName ?? ath?.fullName ?? "Unknown"),
          jersey: rp?.jersey ?? ath?.jersey ?? undefined,
          positionAbbr: rp?.position?.abbreviation ?? ath?.position?.abbreviation ?? undefined,

          appearances: stats["appearances"],
          subsOn: stats["subins"],
          subbedIn: rp?.subbedIn,
          subbedOut: rp?.subbedOut,

          foulsCommitted: stats["foulscommitted"],
          foulsSuffered: stats["foulssuffered"],
          yellowCards: stats["yellowcards"],
          redCards: stats["redcards"],
          ownGoals: stats["owngoals"],

          goalsAgainst: stats["goalsconceded"],
          saves: stats["saves"] ?? stats["savesmade"],
          shotsOnTargetFaced: stats["shotsfaced"],

          goals: stats["totalgoals"],
          assists: stats["goalassists"],
          shotsTotal: stats["totalshots"],
          shotsOnTarget: stats["shotsontarget"],
          offsides: stats["offsides"],
        });
      }
    }
  }

  return out;
}

/** ----- Scorers + header from Summary header.competitions[0] ----- */
function mapGenericPlaysToScorers(
  plays: any[],
  idToSide: Record<string, "home" | "away">,
  idToAbbr: Record<string, string>,
  abbrToSide: Record<string, "home" | "away">
): Scorer[] {
  return (plays ?? []).filter(Boolean).map((p: any) => {
    const minute = normalizeMinute(p?.clock?.displayValue) ?? normalizeMinute(p?.text);

    let name =
      p?.athletesInvolved?.[0]?.displayName ??
      p?.athletesInvolved?.[0]?.athlete?.displayName ??
      p?.athlete?.displayName ??
      undefined;

    const { name: parsed, isPenalty, isOG } = parseScorerText(p?.text);
    if (!name && parsed) name = parsed;
    if (!name) name = "Goal";
    if (isPenalty) name = `${name} (P)`;
    if (isOG) name = `${name} (OG)`;

    const teamId = p?.team?.id ? String(p.team.id) : undefined;
    const teamAbbr = p?.team?.abbreviation ?? (teamId ? idToAbbr[teamId] : undefined);

    const homeAway =
      (p?.homeAway as "home" | "away" | undefined) ??
      (teamId ? idToSide[teamId] : undefined) ??
      (teamAbbr ? abbrToSide[teamAbbr] : undefined);

    return { minute, player: name, teamAbbr, homeAway };
  });
}

function extractHeaderBits(json: AnyObj): {
  score?: { home: number | null; away: number | null };
  statusText?: string | null;
  scorers?: Scorer[];
  compDate?: string | null;
} {
  const comp = json?.header?.competitions?.[0];
  const competitors: AnyObj[] = comp?.competitors ?? [];

  const home = competitors.find((c) => c?.homeAway === "home");
  const away = competitors.find((c) => c?.homeAway === "away");

  const scoreHome =
    home?.score != null ? Number(String(home.score).replace(/[^\d.-]/g, "")) : null;
  const scoreAway =
    away?.score != null ? Number(String(away.score).replace(/[^\d.-]/g, "")) : null;

  const statusText =
    comp?.status?.type?.detail ??
    json?.header?.competitions?.[0]?.status?.type?.shortDetail ??
    null;

  const { idToSide, idToAbbr, abbrToSide } = buildTeamMaps(competitors);

  let scorers: Scorer[] = extractScorersFromScoreboardEvent({ competitions: [comp] });

  if (!scorers.length) {
    const genericScoringPlays =
      (Array.isArray(json?.scoringPlays) ? json.scoringPlays : []) ||
      (Array.isArray(json?.commentary?.plays)
        ? json.commentary.plays.filter((p: any) => p?.scoringPlay)
        : []);
    scorers = mapGenericPlaysToScorers(
      genericScoringPlays,
      idToSide,
      idToAbbr,
      abbrToSide
    );
  }

  const compDate = comp?.date ?? json?.header?.competitions?.[0]?.date ?? null;

  return {
    score: {
      home: Number.isFinite(scoreHome!) ? scoreHome! : null,
      away: Number.isFinite(scoreAway!) ? scoreAway! : null,
    },
    statusText,
    scorers,
    compDate,
  };
}

/** ----- Sub minutes from Summary commentary (ID-based) ----- */
function extractSubMinutesFromSummary(json: AnyObj): Record<string, { in?: number; out?: number }> {
  const plays: any[] =
    (Array.isArray(json?.commentary?.plays) ? json.commentary.plays : []) ||
    (Array.isArray(json?.header?.competitions?.[0]?.details)
      ? json.header.competitions[0].details
      : []);

  const out: Record<string, { in?: number; out?: number }> = {};

  for (const p of plays) {
    const isSub =
      String(p?.type?.id ?? "").toLowerCase() === "substitution" ||
      /substitution/i.test(String(p?.text ?? ""));
    if (!isSub) continue;

    const minute =
      minuteToNumber(p?.clock?.displayValue) ??
      minuteToNumber((p as any)?.time) ??
      minuteToNumber(p?.text);

    const athletes: any[] = Array.isArray(p?.athletesInvolved) ? p.athletesInvolved : [];
    const aIn = athletes[0]?.id ?? athletes[0]?.athlete?.id;
    const aOut = athletes[1]?.id ?? athletes[1]?.athlete?.id;

    if (aIn) {
      const k = String(aIn);
      out[k] = { ...(out[k] || {}), in: minute };
    }
    if (aOut) {
      const k = String(aOut);
      out[k] = { ...(out[k] || {}), out: minute };
    }
  }

  return out;
}

/** ----- Play-by-Play fetch (used only if Summary minutes missing) ----- */
async function fetchPlayByPlay(eventId: string): Promise<any | null> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/playbyplay?event=${encodeURIComponent(eventId)}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) return null;
  return res.json();
}

function buildNameIndex(players: PlayerLine[]): Record<string, string> {
  const idx: Record<string, string> = {};
  for (const p of players) {
    const full = normName(p.athleteName);
    if (full && !idx[full]) idx[full] = p.athleteId;
    const parts = full.split(" ");
    if (parts.length >= 2) {
      const short = `${parts[0]} ${parts[parts.length - 1]}`;
      if (!idx[short]) idx[short] = p.athleteId;
    }
  }
  return idx;
}

function extractSubMinutesFromPBPByName(pbpJson: any, nameIndex: Record<string, string>):
  Record<string, { in?: number; out?: number }> {

  const out: Record<string, { in?: number; out?: number }> = {};

  const plays: any[] =
    (Array.isArray(pbpJson?.plays) ? pbpJson.plays : []) ||
    (Array.isArray(pbpJson?.commentary?.plays) ? pbpJson.commentary.plays : []) ||
    (Array.isArray(pbpJson?.drives?.current?.plays) ? pbpJson.drives.current.plays : []);

  for (const wrap of plays) {
    const p = wrap?.play ?? wrap;
    const t = String(p?.type?.text ?? p?.type ?? "");
    const isSub =
      String(p?.type?.id ?? "").toLowerCase() === "substitution" ||
      /substitution/i.test(t) ||
      /substitution/i.test(String(p?.text ?? "")) ||
      /replaces/i.test(String(p?.text ?? ""));

    if (!isSub) continue;

    const minute =
      minuteToNumber(p?.clock?.displayValue) ??
      minuteToNumber(wrap?.time?.displayValue) ??
      minuteToNumber(p?.text);

    const participants: any[] = Array.isArray(p?.participants) ? p.participants
                             : Array.isArray(p?.athletesInvolved) ? p.athletesInvolved
                             : [];

    let inName: string | undefined;
    let outName: string | undefined;

    if (participants.length >= 2) {
      inName  = participants[0]?.athlete?.displayName ?? participants[0]?.displayName;
      outName = participants[1]?.athlete?.displayName ?? participants[1]?.displayName;
    } else {
      const parsed = parseReplacesNames(p?.text);
      inName = inName ?? parsed.inName;
      outName = outName ?? parsed.outName;
    }

    const inId  = inName  ? nameIndex[normName(inName)]  : undefined;
    const outId = outName ? nameIndex[normName(outName)] : undefined;

    if (inId)  out[inId]  = { ...(out[inId]  || {}), in:  minute };
    if (outId) out[outId] = { ...(out[outId] || {}), out: minute };
  }

  return out;
}

/** ----------- MAIN: fetch + normalize full summary ----------- */
export async function fetchSummaryNormalized(eventId: string): Promise<SummaryNormalized> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=${encodeURIComponent(
    eventId
  )}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`ESPN summary fetch failed: ${res.status}`);

  const json: AnyObj = await res.json();

  const headerEventId = json?.header?.id ?? eventId;
  const box = json?.boxscore ?? {};

  const teamsArr: AnyObj[] = box?.teams ?? [];
  const homeNode =
    teamsArr.find((t) => (t?.homeAway ?? t?.team?.homeAway) === "home") ?? teamsArr[0];
  const awayNode =
    teamsArr.find((t) => (t?.homeAway ?? t?.team?.homeAway) === "away") ?? teamsArr[1];

  const home = extractTeamFromSummaryTeamNode(homeNode, "home");
  const away = extractTeamFromSummaryTeamNode(awayNode, "away");

  // Players (flatten)
  const playersRaw: PlayerLine[] = extractPlayersFromSummary(json);

  // Sub minutes from Summary commentary (ID-based)
  const subFromSummary = extractSubMinutesFromSummary(json);
  let players: PlayerLine[] = playersRaw.map((p) => {
    const mm = subFromSummary[p.athleteId];
    const subInMinute  = mm?.in  ?? (p as any).subInMinute  ?? null;
    const subOutMinute = mm?.out ?? (p as any).subOutMinute ?? null;
    return {
      ...p,
      subInMinute,
      subOutMinute,
      subbedIn:  p.subbedIn  ?? (subInMinute  != null ? true : null),
      subbedOut: p.subbedOut ?? (subOutMinute != null ? true : null),
    };
  });

  // Fallback: if none attached, fetch Play-by-Play and match by names
  const gotAnyMinutes = players.some(pl => pl.subInMinute != null || pl.subOutMinute != null);
  if (!gotAnyMinutes) {
    try {
      const pbp = await fetchPlayByPlay(eventId);
      if (pbp) {
        const nameIndex = buildNameIndex(playersRaw);
        const subFromPBP = extractSubMinutesFromPBPByName(pbp, nameIndex);
        if (Object.keys(subFromPBP).length) {
          players = players.map((p) => {
            const mm = subFromPBP[p.athleteId];
            const subInMinute  = (p.subInMinute  != null ? p.subInMinute  : mm?.in  ?? null);
            const subOutMinute = (p.subOutMinute != null ? p.subOutMinute : mm?.out ?? null);
            return {
              ...p,
              subInMinute,
              subOutMinute,
              subbedIn:  p.subbedIn  ?? (subInMinute  != null ? true : null),
              subbedOut: p.subbedOut ?? (subOutMinute != null ? true : null),
            };
          });
        }
      }
    } catch {
      // ignore
    }
  }

  // Score/status/scorers
  let { score, statusText, scorers, compDate } = extractHeaderBits(json);

  // Fallback #1: synthesize scorers from player goal counts
  if ((!scorers || scorers.length === 0) && players?.length) {
    const synth: Scorer[] = [];
    const homeTeamId = home.teamId;
    const awayTeamId = away.teamId;
    for (const p of players) {
      const n = (p.goals ?? 0) || 0;
      if (n > 0) {
        const side: "home" | "away" = p.teamId === homeTeamId ? "home" : "away";
        for (let i = 0; i < n; i++) synth.push({ player: p.athleteName, homeAway: side });
      }
    }
    scorers = synth;
  }

  // Fallback #2: scoreboard (for scorers/score)
  if (!scorers || scorers.length === 0) {
    try {
      const date = compDate ? new Date(compDate) : undefined;
      if (date && !isNaN(date.getTime())) {
        const sb = await fetchScoreboard(date);
        const ev = (sb.events ?? []).find((e) => String(e.id) === String(eventId));
        if (ev) {
          const det = extractStatsFromScoreboardEvent(ev);
          if (det.scorers?.length) scorers = det.scorers;

          if (!score?.home || !score?.away) {
            const comp = ev?.competitions?.[0];
            const compHome = comp?.competitors?.find((c: any) => c.homeAway === "home");
            const compAway = comp?.competitors?.find((c: any) => c.homeAway === "away");
            const hs = compHome?.score != null ? Number(compHome.score) : null;
            const as = compAway?.score != null ? Number(compAway.score) : null;
            score = {
              home: Number.isFinite(hs!) ? hs! : score?.home ?? null,
              away: Number.isFinite(as!) ? as! : score?.away ?? null,
            };
          }
        }
      }
    } catch { /* ignore */ }
  }

  return {
    eventId: String(headerEventId ?? ""),
    home,
    away,
    players,
    score,
    statusText,
    scorers,
    compDate,
  };
}
