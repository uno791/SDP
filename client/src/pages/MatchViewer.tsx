import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

import ComicCard from "../components/MatchViewerComp/ComicCard";
import GameSummaryCard from "../components/MatchViewerComp/GameSummaryCard";
import PlayerStatsCard from "../components/MatchViewerComp/PlayerStatsCard";

import {
  fetchSummaryNormalized,
  type SummaryNormalized,
  type Scorer,
  fetchScoreboard,
  extractStatsFromScoreboardEvent,
  type ScoreboardResponse,
} from "../api/espn";

import triStyles from "../components/MatchViewerComp/TriStatRow.module.css";
import styles from "../components/MatchViewerComp/MatchView.module.css";

/* ───────────────── TriStatRow ───────────────── */
function TriStatRow({
  label,
  left,
  right,
}: {
  label: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className={triStyles.row}>
      <div className={triStyles.left}>{left ?? "—"}</div>
      <div className={triStyles.label}>{label}</div>
      <div className={triStyles.right}>{right ?? "—"}</div>
    </div>
  );
}

/* ───────────────── Helpers ───────────────── */
function first<T>(arr: T[] | undefined | null): T | undefined {
  return Array.isArray(arr) && arr.length ? arr[0] : undefined;
}
function normalizeMinute(v?: string | number) {
  if (v == null) return undefined;
  const s = String(v);
  const m = s.match(/\d+(?:\+\d+)?/);
  return m ? `${m[0]}'` : s;
}
function parseNameFromText(raw?: string): {
  name?: string;
  isPenalty?: boolean;
  isOG?: boolean;
} {
  if (!raw) return {};
  const text = String(raw).trim();
  const isPenalty = /\bpen(?:alty|alties)?\b|\(PEN\)|\((?:P)\)/i.test(text);
  const isOG = /\bown[- ]goal\b|\(OG\)/i.test(text);

  const patterns = [
    /\bby\s+([\p{L}][\p{L}'\.\-\s]+)/iu,
    /^([\p{L}][\p{L}'\.\-\s]+?)\s*(?:\(|\s+)(?:converts|scores|nets|finishes|heads|strikes|fires)/iu,
    /\.\s*([\p{L}][\p{L}'\.\-\s]+?)\s+(?:converts|scores|nets|finishes|heads|strikes|fires)/iu,
    /-\s*([\p{L}][\p{L}'\.\-\s]+)/iu,
    /^([\p{L}][\p{L}'\.\-\s]+?)\s*\(/iu,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return { name: m[1].trim(), isPenalty, isOG };
  }
  return { isPenalty, isOG };
}
function isPenaltyPlay(p: any): boolean {
  const t = `${p?.type?.id ?? ""} ${p?.type?.text ?? ""} ${p?.text ?? ""}`;
  return /\bpen(?:alty|alties)?\b|\(PEN\)|\((?:P)\)/i.test(t);
}
function isOwnGoalPlay(p: any): boolean {
  const t = `${p?.type?.id ?? ""} ${p?.type?.text ?? ""} ${p?.text ?? ""}`;
  return (
    /\bown[- ]goal\b|\(OG\)/i.test(t) || /owngoal/i.test(p?.type?.id ?? "")
  );
}
function fmtScorer(s: Scorer | any): string {
  let name =
    s?.player ??
    s?.name ??
    s?.scorer ??
    s?.athlete?.displayName ??
    s?.athleteName ??
    "Goal";

  name = String(name)
    .replace(/\s*\((?:P|p)\)\s*/g, "")
    .replace(/\s*\(OG\)\s*/g, "");

  const minuteRaw =
    s?.minute ?? s?.min ?? s?.time ?? s?.minuteText ?? s?.clock ?? undefined;

  const min = normalizeMinute(minuteRaw);
  if (s?.isPenalty) name += " (p)";
  if (s?.isOG) name += " (OG)";

  return `${name}${min ? ` ${min}` : ""}`.trim();
}

/* ───────────────── Component ───────────────── */
export default function MatchViewer() {
  const [sp] = useSearchParams();
  const eventId = sp.get("id") ?? undefined;

  const [data, setData] = useState<SummaryNormalized | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [sbScorers, setSbScorers] = useState<Scorer[] | null>(null);
  const [sbEvent, setSbEvent] = useState<
    ScoreboardResponse["events"][number] | null
  >(null);

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const d = await fetchSummaryNormalized(eventId);
        if (cancelled) return;
        setData(d);

        try {
          const when =
            (d as any)?.compDate &&
            !Number.isNaN(Date.parse((d as any).compDate))
              ? new Date((d as any).compDate)
              : today;

          const sb = await fetchScoreboard(when);
          if (cancelled) return;

          const ev =
            (sb.events ?? []).find((e) => String(e.id) === String(eventId)) ||
            null;
          setSbEvent(ev);

          const details = ev
            ? extractStatsFromScoreboardEvent(ev)
            : { scorers: [] as Scorer[] };

          const hasGoodSummaryScorers =
            Array.isArray(d.scorers) &&
            d.scorers.length > 0 &&
            d.scorers.some(
              (s: any) =>
                typeof s?.player === "string" && !/^Goal\b/i.test(s.player)
            );

          setSbScorers(hasGoodSummaryScorers ? null : details.scorers ?? []);
        } catch {
          setSbScorers(null);
          setSbEvent(null);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId, today]);

  if (!eventId)
    return (
      <ComicCard>
        <div className="p-4">
          Missing <code>?id</code> in URL
        </div>
      </ComicCard>
    );
  if (loading)
    return (
      <ComicCard>
        <div className="p-4">Loading…</div>
      </ComicCard>
    );
  if (err || !data)
    return (
      <ComicCard>
        <div className="p-4">Failed to load: {err}</div>
      </ComicCard>
    );

  const H = data.home;
  const A = data.away;
  const fmt = (n?: number | null, suffix = "") =>
    n == null ? "—" : `${n}${suffix}`;

  const homeScore = (data as any)?.score?.home ?? null;
  const awayScore = (data as any)?.score?.away ?? null;
  const statusText = (data as any)?.statusText ?? null;
  // summary → scoreboard fallback
  const allScorers: Scorer[] = (data as any)?.scorers?.length
    ? (data as any).scorers
    : sbScorers ?? [];

  /** Rebuild/repair scorer list from raw scoreboard plays (ensures scorer names + tags) */
  function buildDisplayScorers(): { home: string[]; away: string[] } {
    const baseHome = allScorers
      .filter((x: any) => x.homeAway === "home")
      .map(fmtScorer);
    const baseAway = allScorers
      .filter((x: any) => x.homeAway === "away")
      .map(fmtScorer);

    const needsFix =
      [...baseHome, ...baseAway].some((s) => /^Goal\b/i.test(s)) &&
      sbEvent &&
      sbEvent.competitions &&
      sbEvent.competitions[0];

    if (!needsFix) return { home: baseHome, away: baseAway };

    const comp = sbEvent!.competitions[0];
    const competitors = comp?.competitors ?? [];
    const idToSide: Record<string, "home" | "away"> = {};
    (competitors ?? []).forEach((c: any) => {
      const id = String(c?.team?.id ?? c?.id ?? "");
      const side = c?.homeAway as "home" | "away";
      if (id && side) idToSide[id] = side;
    });

    const fromArray = Array.isArray(comp?.details) ? comp?.details : [];
    const fromScoring = !Array.isArray(comp?.details)
      ? comp?.details?.scoringPlays ?? []
      : [];
    const plays = [
      ...fromArray.filter((p: any) => p?.scoringPlay),
      ...fromScoring,
    ];

    const homeOut: string[] = [];
    const awayOut: string[] = [];

    for (const p of plays ?? []) {
      const ai0: any = first(p?.athletesInvolved as any[]);
      let name: string | undefined = undefined;

      if (ai0?.displayName) name = ai0.displayName;
      else if (ai0?.athlete?.displayName) name = ai0.athlete.displayName;
      else if ((p as any)?.athlete?.displayName)
        name = (p as any).athlete.displayName;

      const parsed = parseNameFromText(p?.text);
      if (!name && parsed.name) name = parsed.name;
      if (!name) name = "Goal";

      const pen = isPenaltyPlay(p) || !!parsed.isPenalty;
      const og = isOwnGoalPlay(p) || !!parsed.isOG;

      name = name
        .replace(/\s*\((?:P|p)\)\s*/g, "")
        .replace(/\s*\(OG\)\s*/g, "");
      if (pen) name = `${name} (p)`;
      if (og) name = `${name} (OG)`;

      const minute =
        normalizeMinute(p?.clock?.displayValue) ?? normalizeMinute(p?.text);
      const label = `${name}${minute ? ` ${minute}` : ""}`.trim();

      const teamId = p?.team?.id ? String(p.team.id) : undefined;
      const side =
        (p?.homeAway as "home" | "away" | undefined) ??
        (teamId ? idToSide[teamId] : undefined);

      if (side === "home") homeOut.push(label);
      else if (side === "away") awayOut.push(label);
    }

    return {
      home: homeOut.length ? homeOut : baseHome,
      away: awayOut.length ? awayOut : baseAway,
    };
  }

  const fixed = buildDisplayScorers();
  const homeScorers = fixed.home;
  const awayScorers = fixed.away;

  // Logos (scoreboard → summary fallback)
  const comp = (sbEvent as any)?.competitions?.[0];
  const homeC = comp?.competitors?.find((c: any) => c.homeAway === "home");
  const awayC = comp?.competitors?.find((c: any) => c.homeAway === "away");
  const homeLogoUrl =
    homeC?.team?.logo ??
    homeC?.team?.logos?.[0]?.href ??
    (H as any)?.logoUrl ??
    (H as any)?.logo ??
    (H as any)?.crest ??
    null;
  const awayLogoUrl =
    awayC?.team?.logo ??
    awayC?.team?.logos?.[0]?.href ??
    (A as any)?.logoUrl ??
    (A as any)?.logo ??
    (A as any)?.crest ??
    null;

  return (
    <ComicCard>
      <div className={styles.container}>
        {/* Buttons */}
        <div className={styles.buttonRow}>
          <button className={styles.teamButton}>Team Stats</button>
          <Link
            to={`/playerstats?id=${encodeURIComponent(eventId ?? "")}`}
            className={styles.playerButton}
          >
            Player Stats
          </Link>
        </div>

        {/* Header */}
        <h1 className={styles.heading}>
          {H.teamName} vs {A.teamName}
        </h1>
        <div className={styles.subheading}>Match Statistics</div>

        <GameSummaryCard
          homeName={H.teamName}
          awayName={A.teamName}
          homeScore={homeScore ?? (H as any)?.score ?? null}
          awayScore={awayScore ?? (A as any)?.score ?? null}
          statusText={statusText}
          homeLogoUrl={homeLogoUrl}
          awayLogoUrl={awayLogoUrl}
          homeScorers={homeScorers}
          awayScorers={awayScorers}
        />
        {/* Possession & Passing */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Possession &amp; Passing</h2>
          <TriStatRow
            label="Possession"
            left={<b>{fmt(H.possessionPassing?.possessionPct, "%")}</b>}
            right={<b>{fmt(A.possessionPassing?.possessionPct, "%")}</b>}
          />
          <TriStatRow
            label="Passes attempted"
            left={fmt(H.possessionPassing?.passesAttempted)}
            right={fmt(A.possessionPassing?.passesAttempted)}
          />
          <TriStatRow
            label="Accurate passes"
            left={fmt(H.possessionPassing?.accuratePasses)}
            right={fmt(A.possessionPassing?.accuratePasses)}
          />
          <TriStatRow
            label="Pass completion %"
            left={fmt(H.possessionPassing?.passCompletionPct, "%")}
            right={fmt(A.possessionPassing?.passCompletionPct, "%")}
          />
        </section>

        {/* Discipline & Fouls */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Discipline &amp; Fouls</h2>
          <TriStatRow
            label="Fouls committed"
            left={fmt(H.disciplineFouls?.foulsCommitted)}
            right={fmt(A.disciplineFouls?.foulsCommitted)}
          />
          <TriStatRow
            label="Yellow cards"
            left={fmt(H.disciplineFouls?.yellowCards)}
            right={fmt(A.disciplineFouls?.yellowCards)}
          />
          <TriStatRow
            label="Red cards"
            left={fmt(H.disciplineFouls?.redCards)}
            right={fmt(A.disciplineFouls?.redCards)}
          />
          <TriStatRow
            label="Offsides"
            left={fmt(H.disciplineFouls?.offsides)}
            right={fmt(A.disciplineFouls?.offsides)}
          />
        </section>

        {/* Shooting */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Shooting</h2>
          <TriStatRow
            label="Total shots"
            left={fmt(H.shooting?.totalShots)}
            right={fmt(A.shooting?.totalShots)}
          />
          <TriStatRow
            label="Shots on target"
            left={fmt(H.shooting?.shotsOnTarget)}
            right={fmt(A.shooting?.shotsOnTarget)}
          />
          <TriStatRow
            label="Blocked shots"
            left={fmt(H.shooting?.blockedShots)}
            right={fmt(A.shooting?.blockedShots)}
          />
          <TriStatRow
            label="Penalty kicks taken"
            left={fmt(H.shooting?.penaltyKicksTaken)}
            right={fmt(A.shooting?.penaltyKicksTaken)}
          />
          <TriStatRow
            label="Penalty goals"
            left={fmt(H.shooting?.penaltyGoals)}
            right={fmt(A.shooting?.penaltyGoals)}
          />
        </section>

        {/* Set Pieces & Saves */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Set Pieces &amp; Saves</h2>
          <TriStatRow
            label="Corner kicks won"
            left={fmt(H.setPiecesSaves?.cornerKicksWon)}
            right={fmt(A.setPiecesSaves?.cornerKicksWon)}
          />
          <TriStatRow
            label="Saves (GK)"
            left={fmt(H.setPiecesSaves?.savesByGK)}
            right={fmt(A.setPiecesSaves?.savesByGK)}
          />
        </section>

        {/* Crossing & Long Balls */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Crossing &amp; Long Balls</h2>
          <TriStatRow
            label="Crosses attempted"
            left={fmt(H.crossingLongBalls?.crossesAttempted)}
            right={fmt(A.crossingLongBalls?.crossesAttempted)}
          />
          <TriStatRow
            label="Accurate crosses"
            left={fmt(H.crossingLongBalls?.accurateCrosses)}
            right={fmt(A.crossingLongBalls?.accurateCrosses)}
          />
          <TriStatRow
            label="Long balls attempted"
            left={fmt(H.crossingLongBalls?.longBallsAttempted)}
            right={fmt(A.crossingLongBalls?.longBallsAttempted)}
          />
          <TriStatRow
            label="Accurate long balls"
            left={fmt(H.crossingLongBalls?.accurateLongBalls)}
            right={fmt(A.crossingLongBalls?.accurateLongBalls)}
          />
          <TriStatRow
            label="Long ball accuracy"
            left={fmt(H.crossingLongBalls?.longBallAccuracyPct, "%")}
            right={fmt(A.crossingLongBalls?.longBallAccuracyPct, "%")}
          />
        </section>

        {/* Defensive Actions */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Defensive Actions</h2>
          <TriStatRow
            label="Total tackles"
            left={fmt(H.defensiveActions?.tacklesTotal)}
            right={fmt(A.defensiveActions?.tacklesTotal)}
          />
          <TriStatRow
            label="Effective tackles"
            left={fmt(H.defensiveActions?.tacklesWon)}
            right={fmt(A.defensiveActions?.tacklesWon)}
          />
          <TriStatRow
            label="Tackle success rate"
            left={fmt(H.defensiveActions?.tackleSuccessPct, "%")}
            right={fmt(A.defensiveActions?.tackleSuccessPct, "%")}
          />
          <TriStatRow
            label="Interceptions"
            left={fmt(H.defensiveActions?.interceptions)}
            right={fmt(A.defensiveActions?.interceptions)}
          />
        </section>

        {/* Player Stats */}
        <PlayerStatsCard />
      </div>
    </ComicCard>
  );
}
