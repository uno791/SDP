// src/api/espn.ts

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

// Pull a scorer's name out of ESPN free text like:
// "Goal! Team A 1, Team B 0. Mohamed Salah converts the penalty."
// "Erling Haaland (Manchester City) right footed shot..."
// "Goal - Son Heung-Min"
// "Bruno Fernandes scores" / "by Kylian Mbappé"
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
  /** percent of left/home share (0–100) */
  homePct?: number;
  /** raw values so UI can show both sides */
  homeVal?: number;
  awayVal?: number;
};
export type MatchDetailsFromScoreboard = {
  metrics: StatMetric[]; // possession + (sot|shots|corners|fouls)
  saves?: { home?: number; away?: number; homeAbbr?: string; awayAbbr?: string };
  scorers: Scorer[];
};

// ---------- helpers ----------
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
function toPercent(n: number | null | undefined): number | null {
  if (n == null) return null;
  if (!isFinite(n)) return null;
  if (n > 0 && n <= 1) return Math.round(n * 100);
  return Math.round(n);
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

/** Build maps to infer sides/abbrs reliably */
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

/** Scorers from scoreboard-like event (robust: infers side when missing) */
/** Scorers from scoreboard-like event (robust: includes player names + penalty flag) */
/** Scorers from scoreboard-like event (robust: includes player names + penalty flag) */
export function extractScorersFromScoreboardEvent(ev: any): Scorer[] {
  const comp = ev?.competitions?.[0];
  const competitors = comp?.competitors ?? [];
  const { idToSide, idToAbbr, abbrToSide } = buildTeamMaps(competitors);

  const fromArray = Array.isArray(comp?.details) ? comp?.details : [];
  const fromScoring = !Array.isArray(comp?.details) ? comp?.details?.scoringPlays ?? [] : [];
  const plays = [...fromArray.filter((p: any) => p?.scoringPlay), ...fromScoring];

  const normalizeMinute = (v?: string) => {
    if (!v) return undefined;
    const m = v.match(/\d+(?:\+\d+)?/);
    return m ? `${m[0]}'` : v;
  };

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

    // add tags once
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
  const possHomePct =
    typeof hPoss === "number"
      ? Math.round(hPoss)
      : typeof aPoss === "number"
      ? 100 - Math.round(aPoss)
      : undefined;

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
  possessionPct: number | null; // e.g., 67.1 or 67
  passesAttempted: number | null; // e.g., 636
  accuratePasses: number | null; // e.g., 544
  passCompletionPct: number | null; // e.g., 90
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

  // ⬇️ ADD THESE THREE
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

  // General participation
  appearances?: number | null;
  subsOn?: number | null;
  subbedIn?: boolean | null;
  subbedOut?: boolean | null;

  // Discipline
  foulsCommitted?: number | null;
  foulsSuffered?: number | null;
  yellowCards?: number | null;
  redCards?: number | null;
  ownGoals?: number | null;

  // Goalkeeping (GK)
  goalsAgainst?: number | null;
  saves?: number | null;
  shotsOnTargetFaced?: number | null;

  // Attacking
  goals?: number | null;
  assists?: number | null;
  shotsTotal?: number | null;
  shotsOnTarget?: number | null;
  offsides?: number | null;
};

/** extra types for Summary */
export type SummaryScore = { home: number | null; away: number | null };

export type SummaryNormalized = {
  eventId: string;
  home: TeamStatsBundle;
  away: TeamStatsBundle;
  players: PlayerLine[];
  score?: SummaryScore;
  statusText?: string | null;
  scorers?: Scorer[];
  compDate?: string | null; // ⬅️ add this
};


/** ---- helpers for Summary parsing ---- */
type AnyObj = Record<string, any>;

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

/** Map one team node from summary → TeamStatsBundle */
function extractTeamFromSummaryTeamNode(node: AnyObj, side: TeamSide): TeamStatsBundle {
  const { team } = node;
    const teamAbbr = team?.abbreviation ?? team?.shortDisplayName ?? null;
  const logoUrl =
    team?.logos?.[0]?.href ??
    team?.logo ??
    (team as any)?.alternateLogo ??
    null;

  const stats: AnyObj[] = node.statistics ?? [];

  // Discipline & Fouls
  const foulsCommitted = statVal(stats, ["fouls committed", "fouls", "fc"]);
  const yellowCards = statVal(stats, ["yellow cards", "yc"]);
  const redCards = statVal(stats, ["red cards", "rc"]);
  const offsides = statVal(stats, ["offsides", "offside", "of"]);

  // Set Pieces & Saves
  const cornerKicksWon = statVal(stats, ["corner kicks", "corner kicks won", "corners", "won corners"]);
  const savesByGK = statVal(stats, ["saves", "sv", "saves made"]);

  // Possession & Passing
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

  // Fallback: derive attempts if missing
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

  // Shooting
  const totalShots = statVal(stats, ["total shots", "shots", "shots total", "sh"]);
  const shotsOnTarget = statVal(stats, ["shots on target", "st", "sot"]);
  const onTargetPct = toPercent(statVal(stats, ["shotpct", "on-target %", "on target %", "shots on target %"]));
  const blockedShots = statVal(stats, ["blocked shots", "blocks"]);
  const penaltyKicksTaken = statVal(stats, ["penalties taken", "penalty kicks taken", "pk att", "penaltykickshots"]);
  const penaltyGoals = statVal(stats, ["penalty goals", "pk goals", "penaltykickgoals"]);

  // Crossing & Long Balls
  const crossesAttempted = statVal(stats, ["crosses attempted", "crosses", "totalcrosses"]);
  const accurateCrosses = statVal(stats, ["accurate crosses", "crosses completed"]);
  const crossAccuracyPct = toPercent(statVal(stats, ["crosspct", "cross %", "crosses %", "crossing %"]));
  const longBallsAttempted = statVal(stats, ["long balls attempted", "long balls", "totallongballs", "total long balls"]);
  const accurateLongBalls = statVal(stats, ["accurate long balls", "long balls completed"]);
  const longBallAccuracyPct = toPercent(statVal(stats, ["longballpct", "long balls %", "long ball accuracy"]));

  // Defensive Actions
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

/** Players */
function extractPlayersFromSummary(playersNode: AnyObj[]): PlayerLine[] {
  const out: PlayerLine[] = [];
  for (const team of playersNode ?? []) {
    const teamId = String(team?.team?.id ?? "");
    const teamName = team?.team?.displayName ?? "";
    for (const group of team?.statistics ?? []) {
      for (const p of group?.athletes ?? []) {
        const base: PlayerLine = {
          athleteId: String(p?.athlete?.id ?? ""),
          athleteName: p?.athlete?.displayName ?? "Player",
          teamId,
          teamName,
        };
        const statsArr: AnyObj[] = p?.stats ?? p?.statistics ?? [];
        const v = (names: string[]) => statVal(statsArr, names);

        base.appearances = v(["appearances", "apps", "app"]);
        base.subsOn = v(["sub appearances", "substitute appearances", "subin"]);
        const hasSubIn = !!statObj(statsArr, ["subbed in", "sub on", "subbed on"]);
        const hasSubOut = !!statObj(statsArr, ["subbed out", "sub off"]);
        base.subbedIn = hasSubIn || undefined;
        base.subbedOut = hasSubOut || undefined;

        base.foulsCommitted = v(["fouls committed", "fouls", "fc"]);
        base.foulsSuffered = v(["fouls drawn", "fouls suffered"]);
        base.yellowCards = v(["yellow cards", "yc"]);
        base.redCards = v(["red cards", "rc"]);
        base.ownGoals = v(["own goals", "og"]);

        base.goalsAgainst = v(["goals conceded", "goals against", "ga"]);
        base.saves = v(["saves", "sv"]);
        base.shotsOnTargetFaced = v(["shots on target faced", "shots faced", "shf"]);

        base.goals = v(["goals", "g"]);
        base.assists = v(["assists", "a"]);
        base.shotsTotal = v(["shots", "total shots", "sh"]);
        base.shotsOnTarget = v(["shots on target", "st", "sg"]);
        base.offsides = v(["offsides", "offside", "of"]);

        out.push(base);
      }
    }
  }
  return out;
}

// -------- cover more Summary scorer shapes + reliable side inference --------
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


/** Extract score + status + scorers from summary header.competitions[0] with fallbacks */
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

  // Primary extraction from "details" / "scoringPlays"
  let scorers: Scorer[] = extractScorersFromScoreboardEvent({ competitions: [comp] });

  // Fallbacks: Summary-level scoring plays or commentary
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

/** Fetch + normalize full summary (team + player) for one event */
export async function fetchSummaryNormalized(eventId: string): Promise<SummaryNormalized> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=${encodeURIComponent(
    eventId
  )}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`ESPN summary fetch failed: ${res.status}`);

  const json: AnyObj = await res.json();

  const headerEventId = json?.header?.id ?? eventId;
  const box = json?.boxscore ?? {};

  // Teams node usually has two entries with .statistics
  const teamsArr: AnyObj[] = box?.teams ?? [];
  const homeNode =
    teamsArr.find((t) => (t?.homeAway ?? t?.team?.homeAway) === "home") ?? teamsArr[0];
  const awayNode =
    teamsArr.find((t) => (t?.homeAway ?? t?.team?.homeAway) === "away") ?? teamsArr[1];

  const home = extractTeamFromSummaryTeamNode(homeNode, "home");
  const away = extractTeamFromSummaryTeamNode(awayNode, "away");

  // Players node groups by team → groups → athletes
  const players: PlayerLine[] = extractPlayersFromSummary(box?.players ?? []);

  // Score/status/scorers from header (with fallbacks)
  let { score, statusText, scorers, compDate } = extractHeaderBits(json);

  // FINAL FALLBACK #1: synthesize scorers from player goal counts
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

  // FINAL FALLBACK #2: fetch scoreboard for that date and lift scorers
  if (!scorers || scorers.length === 0) {
    try {
      const date = compDate ? new Date(compDate) : undefined;
      if (date && !isNaN(date.getTime())) {
        const sb = await fetchScoreboard(date);
        const ev = (sb.events ?? []).find((e) => String(e.id) === String(eventId));
        if (ev) {
          const det = extractStatsFromScoreboardEvent(ev);
          if (det.scorers?.length) scorers = det.scorers;
          // If scoreboard had a clearer score, keep it (but we already have one)
          if (!score?.home || !score?.away) {
            const comp = ev?.competitions?.[0];
            const compHome = comp?.competitors?.find((c: any) => c.homeAway === "home");
            const compAway = comp?.competitors?.find((c: any) => c.homeAway === "away");
            const hs = compHome?.score != null ? Number(compHome.score) : null;
            const as = compAway?.score != null ? Number(compAway.score) : null;
            score = { home: Number.isFinite(hs!) ? hs! : score?.home ?? null, away: Number.isFinite(as!) ? as! : score?.away ?? null };
          }
        }
      }
    } catch {
      // ignore — scorers remain empty
    }
  }

  return {
  eventId: String(headerEventId ?? ""),
  home,
  away,
  players,
  score,
  statusText,
  scorers,
  compDate, // ⬅️ add this
};

}
