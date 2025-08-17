// LivePremScoreboard.tsx
import React, { useEffect, useMemo, useState } from "react";

/** ---- Minimal types for just what we use ---- */
type ApiStat = { name: string; abbreviation: string; displayValue?: string };
type ApiTeam = {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  name: string;
  logo: string;
};
type ApiCompetitor = {
  id: string;
  homeAway: "home" | "away";
  winner?: boolean;
  score: string;
  statistics?: ApiStat[];
  team: ApiTeam;
};
type ApiDetail = {
  type: { id: string; text: string };
  clock?: { value?: number; displayValue?: string };
  team?: { id: string };
  scoreValue?: number;
  redCard?: boolean;
  yellowCard?: boolean;
  penaltyKick?: boolean;
  ownGoal?: boolean;
  scoringPlay?: boolean;
  athletesInvolved?: Array<{
    id: string;
    displayName: string;
    position?: string;
  }>;
};
type ApiOddsProvider = {
  id: string;
  name: string;
  priority: number;
};
type ApiMoneyline = {
  home?: { current?: { odds?: string } };
  away?: { current?: { odds?: string } };
  draw?: { current?: { odds?: string } };
};
type ApiTotal = {
  over?: { current?: { line?: string; odds?: string } };
  under?: { current?: { line?: string; odds?: string } };
};
type ApiPointSpreadSide = { current?: { line?: string; odds?: string } };
type ApiPointSpread = {
  home?: ApiPointSpreadSide;
  away?: ApiPointSpreadSide;
};
type ApiOdds = {
  provider: ApiOddsProvider;
  moneyline?: ApiMoneyline;
  total?: ApiTotal;
  pointSpread?: ApiPointSpread;
  details?: string;
};
type ApiCompetition = {
  id: string;
  status: {
    clock?: number;
    displayClock?: string;
    period?: number;
    type: {
      id: string;
      name: string;
      state: string;
      detail: string;
      shortDetail: string;
    };
  };
  competitors: ApiCompetitor[];
  details?: ApiDetail[];
  venue?: {
    id?: string;
    fullName?: string;
    address?: { city?: string; country?: string };
  };
  broadcasts?: Array<{ market?: string; names?: string[] }>;
  links?: Array<{
    rel?: string[];
    href?: string;
    text?: string;
    shortText?: string;
  }>;
  odds?: ApiOdds[];
};
type ApiEvent = {
  id: string;
  name: string;
  shortName: string;
  competitions: ApiCompetition[];
  venue?: { displayName?: string };
};
type ApiRoot = {
  events?: ApiEvent[];
};

const ESPN_EPL_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard";

/** ---- Helpers ---- */
const getStat = (team: ApiCompetitor | undefined, key: string) => {
  if (!team?.statistics) return undefined;
  const s = team.statistics.find(
    (x) => x.name === key || x.abbreviation?.toLowerCase() === key.toLowerCase()
  );
  return s?.displayValue;
};
const pctNumber = (val?: string) => {
  if (!val) return undefined;
  // ESPN sometimes gives possession as "63.4" (not "63%"). Keep one decimal.
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : undefined;
};

const formatBroadcasters = (c?: ApiCompetition) =>
  c?.broadcasts?.flatMap((b) => b.names ?? [])?.filter(Boolean) ?? [];

const minutes = (d?: ApiDetail) => d?.clock?.displayValue ?? "";

const isGoal = (d: ApiDetail) => d.type?.id === "70";
const isYellow = (d: ApiDetail) => d.type?.id === "94";
const isRed = (d: ApiDetail) => d.type?.id === "93";

const teamCardCount = (
  details: ApiDetail[] | undefined,
  teamId: string,
  kind: "yellow" | "red"
) => {
  if (!details) return 0;
  return details.filter(
    (d) =>
      d.team?.id === teamId && (kind === "yellow" ? d.yellowCard : d.redCard)
  ).length;
};

const pickOdds = (c?: ApiCompetition): ApiOdds | undefined => {
  if (!c?.odds?.length) return undefined;
  // Prefer ESPN BET if present, otherwise provider with lowest priority number
  const espn = c.odds.find((o) =>
    o.provider?.name?.toUpperCase().includes("ESPN")
  );
  if (espn) return espn;
  return [...c.odds].sort(
    (a, b) => (a.provider?.priority ?? 99) - (b.provider?.priority ?? 99)
  )[0];
};

/** ---- UI Bits ---- */
const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
    {children}
  </span>
);

const StatRow: React.FC<{ label: string; home?: string; away?: string }> = ({
  label,
  home,
  away,
}) => (
  <div className="grid grid-cols-5 items-center text-sm">
    <div className="text-right font-mono">{home ?? "-"}</div>
    <div className="col-span-3 text-center text-xs text-neutral-500">
      {label}
    </div>
    <div className="text-left font-mono">{away ?? "-"}</div>
  </div>
);

const PossessionBar: React.FC<{ homePct?: number; awayPct?: number }> = ({
  homePct,
  awayPct,
}) => {
  const h = Math.max(0, Math.min(100, homePct ?? 0));
  const a = Math.max(0, Math.min(100, awayPct ?? 0));
  return (
    <div
      className="w-full rounded-md bg-neutral-200 overflow-hidden h-2"
      title="Possession"
    >
      <div className="h-2 bg-neutral-800" style={{ width: `${h}%` }} />
    </div>
  );
};

/** ---- Main component ---- */
export default function LivePremScoreboard() {
  const [data, setData] = useState<ApiRoot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      setError(null);
      const res = await fetch(ESPN_EPL_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiRoot = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 15000); // refresh every 15s
    return () => clearInterval(t);
  }, []);

  const liveEvents = useMemo(() => {
    const events = data?.events ?? [];
    return events.filter((ev) => {
      const comp = ev.competitions?.[0];
      return comp?.status?.type?.state === "in";
    });
  }, [data]);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Premier League — Live Games</h1>
        <div className="flex items-center gap-2">
          <Badge>Auto-refresh: 15s</Badge>
          {loading ? <Badge>Loading…</Badge> : <Badge>Updated</Badge>}
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}. If you hit CORS in the browser, fetch this endpoint from a
          server route and call that from the client.
        </div>
      )}

      {(!liveEvents || liveEvents.length === 0) && !loading && !error && (
        <div className="rounded-lg border p-6 text-center text-sm text-neutral-600">
          No live Premier League matches right now.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {liveEvents.map((ev) => {
          const comp = ev.competitions[0];
          const clock =
            comp.status.displayClock ?? comp.status.type.shortDetail;
          const state = comp.status.type.detail;
          const home = comp.competitors.find((t) => t.homeAway === "home");
          const away = comp.competitors.find((t) => t.homeAway === "away");

          const venueName =
            comp.venue?.fullName || ev.venue?.displayName || "—";
          const broadcasters = formatBroadcasters(comp);

          // Stats
          const homePoss = pctNumber(getStat(home, "possessionPct"));
          const awayPoss = pctNumber(getStat(away, "possessionPct"));
          const homeShots = getStat(home, "totalShots");
          const awayShots = getStat(away, "totalShots");
          const homeOnTarget = getStat(home, "shotsOnTarget");
          const awayOnTarget = getStat(away, "shotsOnTarget");
          const homeCorners = getStat(home, "wonCorners");
          const awayCorners = getStat(away, "wonCorners");
          const homeFouls = getStat(home, "foulsCommitted");
          const awayFouls = getStat(away, "foulsCommitted");

          // Cards via details
          const details = comp.details ?? [];
          const homeY = teamCardCount(details, home?.id ?? "", "yellow");
          const awayY = teamCardCount(details, away?.id ?? "", "yellow");
          const homeR = teamCardCount(details, home?.id ?? "", "red");
          const awayR = teamCardCount(details, away?.id ?? "", "red");

          // Odds (best-effort)
          const odds = pickOdds(comp);
          const mlHome = odds?.moneyline?.home?.current?.odds;
          const mlAway = odds?.moneyline?.away?.current?.odds;
          const mlDraw = odds?.moneyline?.draw?.current?.odds;
          const totalOver = odds?.total?.over?.current?.line;
          const totalOverOdds = odds?.total?.over?.current?.odds;
          const totalUnder = odds?.total?.under?.current?.line;
          const totalUnderOdds = odds?.total?.under?.current?.odds;

          return (
            <article
              key={ev.id}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              {/* Header */}
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge>Live</Badge>
                  <span className="text-sm text-neutral-600">{state}</span>
                </div>
                <div className="text-sm font-medium tabular-nums">{clock}</div>
              </div>

              {/* Teams & Score */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="flex items-center gap-2">
                  {home?.team?.logo && (
                    <img
                      src={home.team.logo}
                      alt={home.team.shortDisplayName}
                      className="h-7 w-7"
                    />
                  )}
                  <div className="truncate">
                    <div className="text-sm text-neutral-500">Home</div>
                    <div className="truncate text-base font-medium">
                      {home?.team.displayName ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold tabular-nums leading-none">
                    {(home?.score ?? "0") + " – " + (away?.score ?? "0")}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <div className="text-right">
                    <div className="text-sm text-neutral-500">Away</div>
                    <div className="truncate text-base font-medium">
                      {away?.team.displayName ?? "—"}
                    </div>
                  </div>
                  {away?.team?.logo && (
                    <img
                      src={away.team.logo}
                      alt={away.team.shortDisplayName}
                      className="h-7 w-7"
                    />
                  )}
                </div>
              </div>

              {/* Venue + Broadcast */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
                <div title="Venue">🏟️ {venueName}</div>
                {broadcasters.length > 0 && (
                  <div title="Broadcast">📺 {broadcasters.join(" · ")}</div>
                )}
              </div>

              {/* Possession */}
              <div className="mt-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span>
                    {homePoss !== undefined ? `${homePoss.toFixed(1)}%` : "—"}
                  </span>
                  <span>Possession</span>
                  <span>
                    {awayPoss !== undefined ? `${awayPoss.toFixed(1)}%` : "—"}
                  </span>
                </div>
                <PossessionBar homePct={homePoss} awayPct={awayPoss} />
              </div>

              {/* Stats grid */}
              <div className="mt-3 grid gap-1 rounded-lg border bg-neutral-50 p-3">
                <StatRow
                  label="Shots (on target)"
                  home={
                    homeShots && homeOnTarget
                      ? `${homeShots} (${homeOnTarget})`
                      : homeShots ?? "-"
                  }
                  away={
                    awayShots && awayOnTarget
                      ? `${awayShots} (${awayOnTarget})`
                      : awayShots ?? "-"
                  }
                />
                <StatRow
                  label="Corners"
                  home={homeCorners}
                  away={awayCorners}
                />
                <StatRow label="Fouls" home={homeFouls} away={awayFouls} />
                <StatRow
                  label="Yellow cards"
                  home={String(homeY)}
                  away={String(awayY)}
                />
                <StatRow
                  label="Red cards"
                  home={String(homeR)}
                  away={String(awayR)}
                />
              </div>

              {/* Timeline (goals + cards) */}
              {details.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-semibold">
                    Match timeline
                  </div>
                  <ul className="space-y-1 text-sm">
                    {details
                      .filter((d) => isGoal(d) || isYellow(d) || isRed(d))
                      .map((d, idx) => {
                        const teamSide =
                          d.team?.id === home?.id
                            ? home?.team?.shortDisplayName
                            : away?.team?.shortDisplayName;
                        const who = d.athletesInvolved
                          ?.map((a) => a.displayName)
                          .join(", ");
                        const icon = isGoal(d) ? "⚽" : isRed(d) ? "🟥" : "🟨";
                        return (
                          <li
                            key={`${d.type?.id}-${idx}`}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="flex-1 truncate">
                              {icon} {teamSide ? `${teamSide}: ` : ""}
                              {who ?? d.type?.text}
                            </span>
                            <span className="text-xs tabular-nums text-neutral-600">
                              {minutes(d)}
                            </span>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}

              {/* Odds (if present) */}
              {odds && (
                <div className="mt-4 rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold">Odds</span>
                    <span className="text-neutral-600">
                      {odds.provider?.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-md bg-neutral-50 p-2 text-center">
                      <div className="text-xs text-neutral-500">Home ML</div>
                      <div className="font-mono">{mlHome ?? "—"}</div>
                    </div>
                    <div className="rounded-md bg-neutral-50 p-2 text-center">
                      <div className="text-xs text-neutral-500">Draw</div>
                      <div className="font-mono">{mlDraw ?? "—"}</div>
                    </div>
                    <div className="rounded-md bg-neutral-50 p-2 text-center">
                      <div className="text-xs text-neutral-500">Away ML</div>
                      <div className="font-mono">{mlAway ?? "—"}</div>
                    </div>
                  </div>
                  {(totalOver || totalUnder) && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-md bg-neutral-50 p-2 text-center">
                        <div className="text-xs text-neutral-500">Over</div>
                        <div className="font-mono">
                          {totalOver ?? ""} {totalOverOdds ?? ""}
                        </div>
                      </div>
                      <div className="rounded-md bg-neutral-50 p-2 text-center">
                        <div className="text-xs text-neutral-500">Under</div>
                        <div className="font-mono">
                          {totalUnder ?? ""} {totalUnderOdds ?? ""}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
