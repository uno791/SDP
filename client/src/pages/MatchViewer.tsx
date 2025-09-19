// src/pages/MatchViewer.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ComicCard from "../components/MatchViewerComp/ComicCard";
import GameSummaryCard from "../components/MatchViewerComp/GameSummaryCard";
import PlayerStatsCard from "../components/MatchViewerComp/PlayerStatsCard";
import PlayerStats from "./PlayerStats";
import { Link } from "react-router-dom";

import {
  fetchSummaryNormalized,
  type SummaryNormalized,
  type Scorer,
  fetchScoreboard,
  extractStatsFromScoreboardEvent,
  type ScoreboardResponse,
} from "../api/espn";

/** ───────────────── TriStatRow (inline) ───────────────── */
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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.25rem 0",
      }}
    >
      <div style={{ justifySelf: "start", fontWeight: 600 }}>{left ?? "—"}</div>
      <div style={{ justifySelf: "center", fontWeight: 700 }}>{label}</div>
      <div style={{ justifySelf: "end", fontWeight: 600 }}>{right ?? "—"}</div>
    </div>
  );
}

/** ───────────────── Local helpers ───────────────── */
function first<T>(arr: T[] | undefined | null): T | undefined {
  return Array.isArray(arr) && arr.length ? arr[0] : undefined;
}
function normalizeMinute(v?: string | number) {
  if (v == null) return undefined;
  const s = String(v);
  const m = s.match(/\d+(?:\+\d+)?/);
  return m ? `${m[0]}'` : s;
}
function parseNameFromText(raw?: string): { name?: string; isPenalty?: boolean; isOG?: boolean } {
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
  return /\bown[- ]goal\b|\(OG\)/i.test(t) || /owngoal/i.test(p?.type?.id ?? "");
}

/** tolerant scorer → string (used only for fallback display) */
function fmtScorer(s: Scorer | any): string {
  let name =
    s?.player ??
    s?.name ??
    s?.scorer ??
    s?.athlete?.displayName ??
    s?.athleteName ??
    "Goal";

  // remove pre-existing tags; we'll add our own when we know
  name = String(name).replace(/\s*\((?:P|p)\)\s*/g, "").replace(/\s*\(OG\)\s*/g, "");

  const minuteRaw =
    s?.minute ??
    s?.min ??
    s?.time ??
    s?.minuteText ??
    s?.clock ??
    undefined;

  const min = normalizeMinute(minuteRaw);
  if (s?.isPenalty) name += " (p)";
  if (s?.isOG) name += " (OG)";

  return `${name}${min ? ` ${min}` : ""}`.trim();
}

/** ───────────────── Component ───────────────── */
export default function MatchViewer() {
  const [sp] = useSearchParams();
  const eventId = sp.get("id") ?? undefined;

  const [data, setData] = useState<SummaryNormalized | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Fallback scorers pulled from scoreboard if Summary lacks them
  const [sbScorers, setSbScorers] = useState<Scorer[] | null>(null);
  // Keep raw scoreboard event so we can repair names and get logos
  const [sbEvent, setSbEvent] = useState<ScoreboardResponse["events"][number] | null>(null);

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

        // ── Fetch the scoreboard for the MATCH DATE (fallback to today) ──
        try {
          const when =
            (d as any)?.compDate && !Number.isNaN(Date.parse((d as any).compDate))
              ? new Date((d as any).compDate)
              : today;

          const sb = await fetchScoreboard(when);
          if (cancelled) return;

          const ev = (sb.events ?? []).find((e) => String(e.id) === String(eventId)) || null;
          setSbEvent(ev);

          // Prefer good summary scorers; else fallback to scoreboard scorers (same logic as PastLeagueGames)
          const details = ev ? extractStatsFromScoreboardEvent(ev) : { scorers: [] as Scorer[] };

          const hasGoodSummaryScorers =
            Array.isArray(d.scorers) &&
            d.scorers.length > 0 &&
            d.scorers.some((s: any) => typeof s?.player === "string" && !/^Goal\b/i.test(s.player));

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
        <div style={{ padding: "1rem" }}>
          Missing <code>?id</code> in URL
        </div>
      </ComicCard>
    );
  if (loading)
    return (
      <ComicCard>
        <div style={{ padding: "1rem" }}>Loading…</div>
      </ComicCard>
    );
  if (err || !data)
    return (
      <ComicCard>
        <div style={{ padding: "1rem" }}>Failed to load: {err}</div>
      </ComicCard>
    );

  const H = data.home;
  const A = data.away;
  const fmt = (n?: number | null, suffix = "") => (n == null ? "—" : `${n}${suffix}`);

  // score & status from summary
  const homeScore = (data as any)?.score?.home ?? null;
  const awayScore = (data as any)?.score?.away ?? null;
  const statusText = (data as any)?.statusText ?? null;

  // summary → scoreboard fallback
  const allScorers: Scorer[] =
    (data as any)?.scorers?.length ? (data as any).scorers : sbScorers ?? [];

  /** Rebuild/repair scorer list from raw scoreboard plays (ensures (p)/(OG)) */
  function buildDisplayScorers(): { home: string[]; away: string[] } {
    const baseHome = allScorers.filter((x: any) => x.homeAway === "home").map(fmtScorer);
    const baseAway = allScorers.filter((x: any) => x.homeAway === "away").map(fmtScorer);

    const needsFix =
      ([...baseHome, ...baseAway].some((s) => /^Goal\b/i.test(s)) &&
        sbEvent &&
        sbEvent.competitions &&
        sbEvent.competitions[0]);

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
    const fromScoring = !Array.isArray(comp?.details) ? comp?.details?.scoringPlays ?? [] : [];
    const plays = [...fromArray.filter((p: any) => p?.scoringPlay), ...fromScoring];

    const homeOut: string[] = [];
    const awayOut: string[] = [];

    for (const p of plays ?? []) {
      const ai0: any = first(p?.athletesInvolved as any[]);
      let name: string | undefined = undefined;

      if (ai0?.displayName) name = ai0.displayName;
      else if (ai0?.athlete?.displayName) name = ai0.athlete.displayName;
      else if ((p as any)?.athlete?.displayName) name = (p as any).athlete.displayName;

      const parsed = parseNameFromText(p?.text);
      if (!name && parsed.name) name = parsed.name;
      if (!name) name = "Goal";

      const pen = isPenaltyPlay(p) || !!parsed.isPenalty;
      const og = isOwnGoalPlay(p) || !!parsed.isOG;

      // tag flags once
      name = name.replace(/\s*\((?:P|p)\)\s*/g, "").replace(/\s*\(OG\)\s*/g, "");
      if (pen) name = `${name} (p)`;
      if (og) name = `${name} (OG)`;

      const minute = normalizeMinute(p?.clock?.displayValue) ?? normalizeMinute(p?.text);
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

  /** derive team logos (scoreboard → summary fallbacks) */
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
      <div style={{ padding: "1rem" }}>
        {/* Top buttons (non-functional for now) */}
       <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button
          style={{
            border: "2px solid black",
            background: "orange",
            padding: "6px 10px",
            fontWeight: 700,
            boxShadow: "2px 2px 0 black",
            cursor: "pointer",
          }}
        >
          Team Stats
        </button>

        {/* Use <Link> styled as a button for Player Stats */}
        <Link
          to={`/playerstats?id=${encodeURIComponent(eventId ?? "")}`}
          style={{
            display: "inline-block",
            border: "2px solid black",
            background: "white",
            padding: "6px 10px",
            fontWeight: 700,
            boxShadow: "2px 2px 0 black",
            textDecoration: "none",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Player Stats
        </Link>
      </div>

        {/* Header */}
        <h1
          style={{
            fontWeight: "bold",
            fontSize: "1.5rem",
            marginBottom: "0.25rem",
          }}
        >
          {H.teamName} vs {A.teamName}
        </h1>
        <div style={{ opacity: 0.7, marginBottom: "1rem" }}>Match Statistics</div>

        {/* Live summary + per-side scorers + logos */}
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

        {/* ===== Possession & Passing ===== */}
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Possession &amp; Passing</h2>

          <TriStatRow
            label="Possession"
            left={<b>{fmt(H.possessionPassing.possessionPct, "%")}</b>}
            right={<b>{fmt(A.possessionPassing.possessionPct, "%")}</b>}
          />
          <TriStatRow
            label="Passes attempted"
            left={fmt(H.possessionPassing.passesAttempted)}
            right={fmt(A.possessionPassing.passesAttempted)}
          />
          <TriStatRow
            label="Accurate passes"
            left={fmt(H.possessionPassing.accuratePasses)}
            right={fmt(A.possessionPassing.accuratePasses)}
          />
          <TriStatRow
            label="Pass completion %"
            left={fmt(H.possessionPassing.passCompletionPct, "%")}
            right={fmt(A.possessionPassing.passCompletionPct, "%")}
          />
        </section>

        {/* ===== Discipline & Fouls ===== */}
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Discipline &amp; Fouls</h2>
          <TriStatRow
            label="Fouls committed"
            left={fmt(H.disciplineFouls.foulsCommitted)}
            right={fmt(A.disciplineFouls.foulsCommitted)}
          />
          <TriStatRow
            label="Yellow cards"
            left={fmt(H.disciplineFouls.yellowCards)}
            right={fmt(A.disciplineFouls.yellowCards)}
          />
          <TriStatRow
            label="Red cards"
            left={fmt(H.disciplineFouls.redCards)}
            right={fmt(A.disciplineFouls.redCards)}
          />
          <TriStatRow
            label="Offsides"
            left={fmt(H.disciplineFouls.offsides)}
            right={fmt(A.disciplineFouls.offsides)}
          />
        </section>

        {/* ===== Shooting ===== */}
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Shooting</h2>
          <TriStatRow
            label="Total shots"
            left={fmt(H.shooting.totalShots)}
            right={fmt(A.shooting.totalShots)}
          />
          <TriStatRow
            label="Shots on target"
            left={fmt(H.shooting.shotsOnTarget)}
            right={fmt(A.shooting.shotsOnTarget)}
          />
          <TriStatRow
            label="Blocked shots"
            left={fmt(H.shooting.blockedShots)}
            right={fmt(A.shooting.blockedShots)}
          />
          <TriStatRow
            label="Penalty kicks taken"
            left={fmt(H.shooting.penaltyKicksTaken)}
            right={fmt(A.shooting.penaltyKicksTaken)}
          />
          <TriStatRow
            label="Penalty goals"
            left={fmt(H.shooting.penaltyGoals)}
            right={fmt(A.shooting.penaltyGoals)}
          />
        </section>

        {/* ===== Set Pieces & Saves ===== */}
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Set Pieces &amp; Saves</h2>
          <TriStatRow
            label="Corner kicks won"
            left={fmt(H.setPiecesSaves.cornerKicksWon)}
            right={fmt(A.setPiecesSaves.cornerKicksWon)}
          />
          <TriStatRow
            label="Saves (GK)"
            left={fmt(H.setPiecesSaves.savesByGK)}
            right={fmt(A.setPiecesSaves.savesByGK)}
          />
        </section>

        {/* ===== Crossing & Long Balls ===== */}
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Crossing &amp; Long Balls</h2>
          <TriStatRow
            label="Crosses attempted"
            left={fmt(H.crossingLongBalls.crossesAttempted)}
            right={fmt(A.crossingLongBalls.crossesAttempted)}
          />
          <TriStatRow
            label="Accurate crosses"
            left={fmt(H.crossingLongBalls.accurateCrosses)}
            right={fmt(A.crossingLongBalls.accurateCrosses)}
          />
          <TriStatRow
            label="Long balls attempted"
            left={fmt(H.crossingLongBalls.longBallsAttempted)}
            right={fmt(A.crossingLongBalls.longBallsAttempted)}
          />
          <TriStatRow
            label="Accurate long balls"
            left={fmt(H.crossingLongBalls.accurateLongBalls)}
            right={fmt(A.crossingLongBalls.accurateLongBalls)}
          />
          <TriStatRow
            label="Long ball accuracy"
            left={fmt(H.crossingLongBalls.longBallAccuracyPct, "%")}
            right={fmt(A.crossingLongBalls.longBallAccuracyPct, "%")}
          />
        </section>

        {/* ===== Defensive Actions ===== */}
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Defensive Actions</h2>
          <TriStatRow
            label="Total tackles"
            left={fmt(H.defensiveActions.tacklesTotal)}
            right={fmt(A.defensiveActions.tacklesTotal)}
          />
          <TriStatRow
            label="Effective tackles"
            left={fmt(H.defensiveActions.tacklesWon)}
            right={fmt(A.defensiveActions.tacklesWon)}
          />
          <TriStatRow
            label="Tackle success rate"
            left={fmt(H.defensiveActions.tackleSuccessPct, "%")}
            right={fmt(A.defensiveActions.tackleSuccessPct, "%")}
          />
          <TriStatRow
            label="Interceptions"
            left={fmt(H.defensiveActions.interceptions)}
            right={fmt(A.defensiveActions.interceptions)}
          />
        </section>

        {/* (Optional) player stats — unchanged */}
        <PlayerStatsCard />
      </div>
    </ComicCard>
  );
}
