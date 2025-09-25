import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import ComicCard from "../components/MatchViewerComp/ComicCard";
import PlayerStatsCard from "../components/MatchViewerComp/PlayerStatsCard";
import MatchNavBar from "../components/PlayerStatsComp/MatchNavBar";
import {
  fetchSummaryNormalized,
  type SummaryNormalized,
  type Scorer,
  fetchScoreboard,
  extractStatsFromScoreboardEvent,
  type ScoreboardResponse,
} from "../api/espn";
import MatchViewerContent, {
  type MatchViewerSection,
} from "../components/MatchViewerComp/MatchViewerContent";

/* ───────── Helpers ───────── */
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
  return { name: undefined, isPenalty, isOG };
}
function isPenaltyPlay(p: any) {
  const t = `${p?.type?.id ?? ""} ${p?.type?.text ?? ""} ${p?.text ?? ""}`;
  return /\bpen(?:alty|alties)?\b|\(PEN\)|\((?:P)\)/i.test(t);
}
function isOwnGoalPlay(p: any) {
  const t = `${p?.type?.id ?? ""} ${p?.type?.text ?? ""} ${p?.text ?? ""}`;
  return (
    /\bown[- ]goal\b|\(OG\)/i.test(t) || /owngoal/i.test(p?.type?.id ?? "")
  );
}
function buildDisplayScorers(
  allScorers: Scorer[],
  sbEvent: ScoreboardResponse["events"][number] | null
): { home: string[]; away: string[] } {
  const baseHome = allScorers
    .filter((x: any) => x.homeAway === "home")
    .map((s) => s.player ?? "Goal");
  const baseAway = allScorers
    .filter((x: any) => x.homeAway === "away")
    .map((s) => s.player ?? "Goal");

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
    const id = String(c?.team?.id ?? c?.id ?? c?.id ?? "");
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
    const ai0: any = Array.isArray(p?.athletesInvolved)
      ? p.athletesInvolved[0]
      : null;

    let name: string | undefined =
      ai0?.displayName ??
      ai0?.athlete?.displayName ??
      (p as any)?.athlete?.displayName;

    const parsed = parseNameFromText(p?.text);
    if (!name && parsed.name) name = parsed.name;
    if (!name) name = "Goal";

    if (isPenaltyPlay(p) || parsed.isPenalty) name += " (p)";
    if (isOwnGoalPlay(p) || parsed.isOG) name += " (OG)";

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

/* ───────── Component ───────── */
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

  const [goalAnim, setGoalAnim] = useState(false);
  const [lastGoalCount, setLastGoalCount] = useState(0);

  const today = useMemo(() => new Date(), []);

  // fetch data
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

        const when =
          (d as any)?.compDate && !Number.isNaN(Date.parse((d as any).compDate))
            ? new Date((d as any).compDate)
            : today;

        const sb = await fetchScoreboard(when);
        if (cancelled) return;

        const ev =
          (sb.events ?? []).find((e) => String(e.id) === String(eventId)) ??
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

  // derive scorers
  const { homeScorers, awayScorers } = useMemo(() => {
    if (!data) return { homeScorers: [], awayScorers: [] };
    const allScorers: Scorer[] = (data as any)?.scorers?.length
      ? (data as any).scorers
      : sbScorers ?? [];
    const fixed = buildDisplayScorers(allScorers, sbEvent);
    return { homeScorers: fixed.home, awayScorers: fixed.away };
  }, [data, sbScorers, sbEvent]);

  // trigger animation on goal change
  useEffect(() => {
    const totalGoals = homeScorers.length + awayScorers.length;
    if (totalGoals > lastGoalCount) {
      setGoalAnim(true);
      const t = setTimeout(() => setGoalAnim(false), 2500);
      return () => clearTimeout(t);
    }
    setLastGoalCount(totalGoals);
  }, [homeScorers, awayScorers, lastGoalCount]);

  /* early returns */
  if (!eventId) {
    return (
      <ComicCard>
        <div className="p-4">
          Missing <code>?id</code> in URL
        </div>
      </ComicCard>
    );
  }
  if (loading) {
    return (
      <ComicCard>
        <div className="p-4">Loading…</div>
      </ComicCard>
    );
  }
  if (err || !data) {
    return (
      <ComicCard>
        <div className="p-4">Failed to load: {err}</div>
      </ComicCard>
    );
  }

  // safe destructuring
  const { home: H, away: A } = data;
  const homeScore = (data as any)?.score?.home ?? null;
  const awayScore = (data as any)?.score?.away ?? null;
  const statusText = (data as any)?.statusText ?? null;

  const fmt = (n?: number | null, suffix = "") =>
    n == null ? "—" : `${n}${suffix}`;

  const comp = (sbEvent as any)?.competitions?.[0];
  const homeC = comp?.competitors?.find((c: any) => c.homeAway === "home");
  const awayC = comp?.competitors?.find((c: any) => c.homeAway === "away");

  const homeLogoUrl =
    homeC?.team?.logo ??
    homeC?.team?.logos?.[0]?.href ??
    (H as any)?.crest ??
    null;
  const awayLogoUrl =
    awayC?.team?.logo ??
    awayC?.team?.logos?.[0]?.href ??
    (A as any)?.crest ??
    null;

  /* render */
  const sections: MatchViewerSection[] = [
    {
      title: "Possession & Passing",
      rows: [
        {
          label: "Possession",
          left: <b>{fmt(H.possessionPassing?.possessionPct, "%")}</b>,
          right: <b>{fmt(A.possessionPassing?.possessionPct, "%")}</b>,
        },
        {
          label: "Passes attempted",
          left: fmt(H.possessionPassing?.passesAttempted),
          right: fmt(A.possessionPassing?.passesAttempted),
        },
        {
          label: "Accurate passes",
          left: fmt(H.possessionPassing?.accuratePasses),
          right: fmt(A.possessionPassing?.accuratePasses),
        },
        {
          label: "Pass completion %",
          left: fmt(H.possessionPassing?.passCompletionPct, "%"),
          right: fmt(A.possessionPassing?.passCompletionPct, "%"),
        },
      ],
    },
    {
      title: "Discipline & Fouls",
      rows: [
        {
          label: "Fouls committed",
          left: fmt(H.disciplineFouls?.foulsCommitted),
          right: fmt(A.disciplineFouls?.foulsCommitted),
        },
        {
          label: "Yellow cards",
          left: fmt(H.disciplineFouls?.yellowCards),
          right: fmt(A.disciplineFouls?.yellowCards),
        },
        {
          label: "Red cards",
          left: fmt(H.disciplineFouls?.redCards),
          right: fmt(A.disciplineFouls?.redCards),
        },
        {
          label: "Offsides",
          left: fmt(H.disciplineFouls?.offsides),
          right: fmt(A.disciplineFouls?.offsides),
        },
      ],
    },
    {
      title: "Shooting",
      rows: [
        {
          label: "Total shots",
          left: fmt(H.shooting?.totalShots),
          right: fmt(A.shooting?.totalShots),
        },
        {
          label: "Shots on target",
          left: fmt(H.shooting?.shotsOnTarget),
          right: fmt(A.shooting?.shotsOnTarget),
        },
        {
          label: "Blocked shots",
          left: fmt(H.shooting?.blockedShots),
          right: fmt(A.shooting?.blockedShots),
        },
        {
          label: "Penalty kicks taken",
          left: fmt(H.shooting?.penaltyKicksTaken),
          right: fmt(A.shooting?.penaltyKicksTaken),
        },
        {
          label: "Penalty goals",
          left: fmt(H.shooting?.penaltyGoals),
          right: fmt(A.shooting?.penaltyGoals),
        },
      ],
    },
    {
      title: "Set Pieces & Saves",
      rows: [
        {
          label: "Corner kicks won",
          left: fmt(H.setPiecesSaves?.cornerKicksWon),
          right: fmt(A.setPiecesSaves?.cornerKicksWon),
        },
        {
          label: "Saves (GK)",
          left: fmt(H.setPiecesSaves?.savesByGK),
          right: fmt(A.setPiecesSaves?.savesByGK),
        },
      ],
    },
    {
      title: "Crossing & Long Balls",
      rows: [
        {
          label: "Crosses attempted",
          left: fmt(H.crossingLongBalls?.crossesAttempted),
          right: fmt(A.crossingLongBalls?.crossesAttempted),
        },
        {
          label: "Accurate crosses",
          left: fmt(H.crossingLongBalls?.accurateCrosses),
          right: fmt(A.crossingLongBalls?.accurateCrosses),
        },
        {
          label: "Long balls attempted",
          left: fmt(H.crossingLongBalls?.longBallsAttempted),
          right: fmt(A.crossingLongBalls?.longBallsAttempted),
        },
        {
          label: "Accurate long balls",
          left: fmt(H.crossingLongBalls?.accurateLongBalls),
          right: fmt(A.crossingLongBalls?.accurateLongBalls),
        },
        {
          label: "Long ball accuracy",
          left: fmt(H.crossingLongBalls?.longBallAccuracyPct, "%"),
          right: fmt(A.crossingLongBalls?.longBallAccuracyPct, "%"),
        },
      ],
    },
    {
      title: "Player Stats",
      content: <PlayerStatsCard />,
    },
  ];

  return (
    <>
      <MatchNavBar />

      <MatchViewerContent
        title={`${H.teamName} vs ${A.teamName}`}
        subtitle="Match Statistics"
        homeName={H.teamName}
        awayName={A.teamName}
        homeScore={homeScore}
        awayScore={awayScore}
        statusText={statusText}
        homeLogoUrl={homeLogoUrl}
        awayLogoUrl={awayLogoUrl}
        homeScorers={homeScorers}
        awayScorers={awayScorers}
        sections={sections}
        goalHighlight={goalAnim}
        overlay={
          goalAnim ? (
            <div className="fixed inset-0 pointer-events-none flex justify-center items-start z-50">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-confetti absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    backgroundColor: [
                      "#f87171",
                      "#34d399",
                      "#60a5fa",
                      "#fbbf24",
                      "#ec4899",
                    ][Math.floor(Math.random() * 5)],
                    animationDelay: `${Math.random() * 0.5}s`,
                  }}
                />
              ))}
            </div>
          ) : undefined
        }
      />
    </>
  );
}
