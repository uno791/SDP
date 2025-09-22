import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import StatKey from "../components/PlayerStatsComp/StatKey";
import TeamSection from "../components/PlayerStatsComp/TeamSection";
import type {
  PlayerRow,
  Side,
} from "../components/PlayerStatsComp/PlayerTable";
import { fetchSummaryNormalized, type PlayerLine } from "../api/espn";
import MatchNavBar from "../components/PlayerStatsComp/MatchNavBar";
import styles from "../components/PlayerStatsComp/PlayerStats.module.css";

type TeamTable = { teamName: string; starters: PlayerRow[]; subs: PlayerRow[] };
type MatchPlayerStats = { home: TeamTable; away: TeamTable };

function toRow(p: PlayerLine, side: Side): PlayerRow {
  const anyP = p as any;

  const minuteToNumber = (v: unknown): number | undefined => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const m = v.match(/(\d+)(?:\+(\d+))?/);
      if (m) {
        const base = parseInt(m[1]!, 10);
        const extra = m[2] ? parseInt(m[2], 10) : 0;
        const n = base + extra;
        if (Number.isFinite(n)) return n;
      }
    }
    return undefined;
  };

  const inMinRaw =
    (p as any).subInMinute ??
    anyP.subOnMinute ??
    anyP.sub_in_minute ??
    anyP.subMinuteIn ??
    anyP.inMinute ??
    anyP.enteredMinute;

  const outMinRaw =
    (p as any).subOutMinute ??
    anyP.subOffMinute ??
    anyP.sub_out_minute ??
    anyP.subMinuteOut ??
    anyP.outMinute ??
    anyP.leftMinute;

  const inMin = minuteToNumber(inMinRaw);
  const outMin = minuteToNumber(outMinRaw);

  return {
    id: p.athleteId,
    name: p.athleteName,
    side,
    starter: false,
    position: p.positionAbbr ?? undefined,
    shirt: p.jersey ?? undefined,
    subIn: p.subbedIn ?? (inMin != null ? true : undefined),
    subOut: p.subbedOut ?? (outMin != null ? true : undefined),
    subInMinute: inMin,
    subOutMinute: outMin,
    FC: p.foulsCommitted ?? undefined,
    FA: p.foulsSuffered ?? undefined,
    YC: p.yellowCards ?? undefined,
    RC: p.redCards ?? undefined,
    OG: p.ownGoals ?? undefined,
    GA: p.goalsAgainst ?? undefined,
    SV: p.saves ?? undefined,
    SHF: p.shotsOnTargetFaced ?? undefined,
    G: p.goals ?? undefined,
    A: p.assists ?? undefined,
    SH: p.shotsTotal ?? undefined,
    ST: p.shotsOnTarget ?? undefined,
    OF: p.offsides ?? undefined,
  };
}
function partitionTeam(players: PlayerLine[], side: Side) {
  const rows: PlayerRow[] = players.map((p) => toRow(p, side));

  const played = (r: PlayerRow) => {
    const anyCount =
      (r.G ?? 0) +
      (r.A ?? 0) +
      (r.YC ?? 0) +
      (r.RC ?? 0) +
      (r.SV ?? 0) +
      (r.SH ?? 0) +
      (r.FC ?? 0);
    return r.subIn === true || r.subOut === true || anyCount > 0;
  };

  // Starters = not subbed in, or flagged as starter
  let starters = rows.filter(
    (r) => (r.subIn !== true && r.subInMinute == null) || r.starter === true
  );

  // Subs = everyone else who either subbed in or never played
  let subs = rows.filter((r) => !starters.includes(r));

  // --- Fallbacks ---
  if (starters.length > 11) {
    // Too many, trim to 11 by keeping "most played" first
    const sorted = [...starters].sort(
      (a, b) => (played(b) ? 1 : 0) - (played(a) ? 1 : 0)
    );
    subs = [...subs, ...sorted.slice(11)];
    starters = sorted.slice(0, 11);
  } else if (starters.length < 11 && rows.length >= 11) {
    // Too few, promote extra active players
    const need = 11 - starters.length;
    const candidates = rows.filter((r) => !starters.includes(r));
    const sorted = candidates.sort(
      (a, b) => (played(b) ? 1 : 0) - (played(a) ? 1 : 0)
    );
    starters = [...starters, ...sorted.slice(0, need)];
    subs = rows.filter((r) => !starters.includes(r));
  }

  // Flag
  starters = starters.map((r) => ({ ...r, starter: true }));
  subs = subs.map((r) => ({ ...r, starter: false }));

  return { starters, subs };
}

function statify(arr: any[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const s of arr ?? []) {
    const k = String(s?.name ?? "").toLowerCase();
    const raw = s?.value ?? s?.displayValue ?? s?.stat;
    const n =
      typeof raw === "number"
        ? raw
        : Number(String(raw ?? "").replace(/[^\d.-]/g, ""));
    if (k && !Number.isNaN(n)) m[k] = n;
  }
  return m;
}

function mapAthleteNode(a: any, teamId: string, teamName: string): PlayerLine {
  const ath = a?.athlete ?? a?.player ?? {};
  const st = statify(a?.stats ?? a?.statistics ?? []);
  const headshot = ath?.headshot?.href ?? a?.headshot ?? a?.imageUrl;

  const subInMinute =
    a?.subInMinute ??
    a?.sub_in_minute ??
    a?.subMinuteIn ??
    a?.inMinute ??
    a?.enteredMinute;
  const subOutMinute =
    a?.subOutMinute ??
    a?.sub_out_minute ??
    a?.subMinuteOut ??
    a?.outMinute ??
    a?.leftMinute;

  return {
    athleteId: String(ath?.id ?? a?.id ?? ""),
    athleteName: String(ath?.displayName ?? ath?.shortName ?? a?.name ?? ""),
    headshotUrl: headshot,
    positionAbbr:
      String(
        ath?.position?.abbreviation ?? a?.position?.abbreviation ?? ""
      ).toUpperCase() || undefined,
    jersey: a?.jersey ?? a?.shirt ?? undefined,
    teamId,
    teamName,
    subbedIn: a?.subbedIn ?? (subInMinute != null ? true : undefined),
    subbedOut: a?.subbedOut ?? (subOutMinute != null ? true : undefined),
    foulsCommitted: st["foulscommitted"],
    foulsSuffered: st["foulssuffered"],
    yellowCards: st["yellowcards"],
    redCards: st["redcards"],
    ownGoals: st["owngoals"],
    goalsAgainst: st["goalsconceded"],
    saves: st["saves"] ?? st["savesmade"],
    shotsOnTargetFaced: st["shotsfaced"],
    goals: st["totalgoals"] ?? st["goals"],
    assists: st["goalassists"] ?? st["assists"],
    shotsTotal: st["totalshots"] ?? st["shots"],
    shotsOnTarget: st["shotsontarget"],
    offsides: st["offsides"],
  } as PlayerLine & { subInMinute?: number; subOutMinute?: number };
}

function extractPlayersFromAnySummaryShape(summary: any): {
  players: PlayerLine[];
} {
  if (Array.isArray(summary?.players) && summary.players.length) {
    return { players: summary.players as PlayerLine[] };
  }
  const competitorStats =
    summary?.boxscore?.players ?? summary?.boxscore?.statistics ?? [];
  if (Array.isArray(competitorStats) && competitorStats.length) {
    const out: PlayerLine[] = [];
    for (const comp of competitorStats) {
      const teamId = String(comp?.team?.id ?? comp?.teamId ?? "");
      const teamName = String(
        comp?.team?.displayName ?? comp?.team?.name ?? ""
      );
      const athletes = Array.isArray(comp?.athletes) ? comp.athletes : [];
      for (const a of athletes) out.push(mapAthleteNode(a, teamId, teamName));
    }
    if (out.length) return { players: out };
  }
  const rosters = summary?.rosters ?? summary?.roster ?? [];
  if (Array.isArray(rosters) && rosters.length) {
    const out: PlayerLine[] = [];
    for (const r of rosters) {
      const teamId = String(r?.team?.id ?? r?.teamId ?? "");
      const teamName = String(r?.team?.displayName ?? r?.team?.name ?? "");
      const roster = Array.isArray(r?.roster) ? r.roster : [];
      for (const a of roster) out.push(mapAthleteNode(a, teamId, teamName));
    }
    if (out.length) return { players: out };
  }
  return { players: [] };
}

async function fetchPlayersFallback(eventId: string) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=${encodeURIComponent(
    eventId
  )}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) return { players: [] };
  const json = await res.json();
  return extractPlayersFromAnySummaryShape(json);
}

export default function PlayerStats() {
  const [sp] = useSearchParams();
  const eventId = sp.get("id") ?? "";

  const [data, setData] = useState<MatchPlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!eventId) throw new Error("No event id in URL (?id=...)");
        setLoading(true);
        setErr(null);

        const summary = await fetchSummaryNormalized(eventId);

        const homeId = String(summary.home?.teamId ?? "");
        const awayId = String(summary.away?.teamId ?? "");

        const synthTeamLogo = (tid?: string) =>
          tid && /^\d+$/.test(String(tid))
            ? `https://a.espncdn.com/i/teamlogos/soccer/500/${tid}.png`
            : undefined;

        const homeLogo: string | undefined =
          (summary.home as any)?.logo ?? synthTeamLogo(homeId);
        const awayLogo: string | undefined =
          (summary.away as any)?.logo ?? synthTeamLogo(awayId);

        let allPlayers: PlayerLine[] = Array.isArray(summary.players)
          ? summary.players
          : [];
        if (!allPlayers.length) {
          const fb = await fetchPlayersFallback(eventId);
          allPlayers = fb.players;
        }

        const homePlayers = homeId
          ? allPlayers.filter((p) => String(p.teamId) === homeId)
          : [];
        const awayPlayers = awayId
          ? allPlayers.filter((p) => String(p.teamId) === awayId)
          : [];

        const homePart = partitionTeam(homePlayers, "home");
        const awayPart = partitionTeam(awayPlayers, "away");

        const withLogo =
          (logo?: string) =>
          (r: PlayerRow): PlayerRow => ({ ...r, teamLogoUrl: logo });

        const next: MatchPlayerStats = {
          home: {
            teamName: summary.home?.teamName ?? "Home",
            starters: homePart.starters.map(withLogo(homeLogo)),
            subs: homePart.subs.map(withLogo(homeLogo)),
          },
          away: {
            teamName: summary.away?.teamName ?? "Away",
            starters: awayPart.starters.map(withLogo(awayLogo)),
            subs: awayPart.subs.map(withLogo(awayLogo)),
          },
        };

        if (alive) setData(next);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      let _ = alive;
      alive = false;
    };
  }, [eventId]);

  if (!eventId)
    return (
      <section className={styles.message}>
        Missing event id. Append <code>?id=&lt;ESPN_EVENT_ID&gt;</code>.
      </section>
    );
  if (loading)
    return <section className={styles.message}>Loading player stats…</section>;
  if (err)
    return <section className={styles.message}>Failed to load: {err}</section>;
  if (!data) return <section className={styles.message}>No data.</section>;

  const noPlayerStats =
    data.home.starters.length +
      data.home.subs.length +
      data.away.starters.length +
      data.away.subs.length ===
    0;

  return (
    <>
      <MatchNavBar />
      <section className={styles.container}>
        <header className={styles.header}>
          <strong className={styles.teamLeft}>{data.home.teamName}</strong>
          <div className={styles.headerTitle}>Player Statistics</div>
          <strong className={styles.teamRight}>{data.away.teamName}</strong>
        </header>

        <StatKey />

        {noPlayerStats ? (
          <section className={styles.noStats}>
            Detailed player-level stats were not provided by ESPN for this
            match.
          </section>
        ) : null}

        <TeamSection
          teamName={data.home.teamName}
          starters={data.home.starters}
          subs={data.home.subs}
        />
        <TeamSection
          teamName={data.away.teamName}
          starters={data.away.starters}
          subs={data.away.subs}
        />
      </section>
    </>
  );
}
