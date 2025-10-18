import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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

type OverlayKind = "goal" | "penalty" | "red-card" | "yellow-card" | "winner";
type OverlayState = { kind: OverlayKind; key: number } | null;

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
  const [summaryHighlight, setSummaryHighlight] = useState<string | null>(null);
  const [overlayState, setOverlayState] = useState<OverlayState>(null);
  const [overrideWinner, setOverrideWinner] = useState<"home" | "away" | null>(
    null
  );

  const goalCountsRef = useRef<{ home: number; away: number }>({
    home: 0,
    away: 0,
  });
  const goalAnimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redCardTrackerRef = useRef<{ home: number; away: number } | null>(null);
  const penaltyTrackerRef = useRef<{ home: number; away: number } | null>(null);
  const yellowCardTrackerRef = useRef<{ home: number; away: number } | null>(
    null
  );
  const winnerHighlightRef = useRef<"home" | "away" | null>(null);
  const winnerOverrideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const triggerHighlight = useCallback((className: string, duration = 2500) => {
    setSummaryHighlight(className);
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      setSummaryHighlight(null);
      highlightTimerRef.current = null;
    }, duration);
  }, []);

  const activateOverlay = useCallback((kind: OverlayKind, duration = 2500) => {
    const key = Date.now();
    setOverlayState({ kind, key });
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
    }
    overlayTimerRef.current = setTimeout(() => {
      setOverlayState(null);
      overlayTimerRef.current = null;
    }, duration);
  }, []);

  const startGoalAnimation = useCallback(
    (
      highlightClass: string,
      overlayKind: OverlayKind = "goal",
      duration = 2500
    ) => {
      triggerHighlight(highlightClass, duration);
      activateOverlay(overlayKind, duration);
      setGoalAnim(true);
      if (goalAnimTimerRef.current) {
        clearTimeout(goalAnimTimerRef.current);
      }
      goalAnimTimerRef.current = setTimeout(() => {
        setGoalAnim(false);
        goalAnimTimerRef.current = null;
      }, duration);
    },
    [activateOverlay, triggerHighlight]
  );

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    return () => {
      if (goalAnimTimerRef.current) {
        clearTimeout(goalAnimTimerRef.current);
      }
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
      if (winnerOverrideTimerRef.current) {
        clearTimeout(winnerOverrideTimerRef.current);
      }
    };
  }, []);

  // fetch data
  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let intervalId: number | null = null;
    let firstLoad = true;
    let inFlight = false;

    const load = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        if (firstLoad) setLoading(true);

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

        if (!cancelled) setErr(null);

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
        if (!cancelled && firstLoad) {
          setLoading(false);
          firstLoad = false;
        }
        inFlight = false;
      }
    };

    load();
    intervalId = window.setInterval(load, 5000);

    return () => {
      cancelled = true;
      if (intervalId != null) window.clearInterval(intervalId);
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
    const prev = goalCountsRef.current;
    const homeCount = homeScorers.length;
    const awayCount = awayScorers.length;
    const deltaHome = homeCount - prev.home;
    const deltaAway = awayCount - prev.away;

    if (deltaHome > 0 || deltaAway > 0) {
      const newLabels: string[] = [];
      if (deltaHome > 0) {
        newLabels.push(...homeScorers.slice(-deltaHome));
      }
      if (deltaAway > 0) {
        newLabels.push(...awayScorers.slice(-deltaAway));
      }
      const hasPenalty =
        newLabels.some((label) => /\((?:p|pen)\)/i.test(label)) ||
        newLabels.some((label) => /penalty/i.test(label));

      startGoalAnimation(
        hasPenalty ? "animate-penalty" : "animate-goal",
        hasPenalty ? "penalty" : "goal"
      );

      goalCountsRef.current = { home: homeCount, away: awayCount };
      return;
    }

    if (prev.home !== homeCount || prev.away !== awayCount) {
      goalCountsRef.current = { home: homeCount, away: awayCount };
    }
  }, [homeScorers, awayScorers, startGoalAnimation]);

  const homeScore = (data as any)?.score?.home ?? null;
  const awayScore = (data as any)?.score?.away ?? null;
  const statusText = (data as any)?.statusText ?? null;

  const homeRedCards = data?.home?.disciplineFouls?.redCards ?? 0;
  const awayRedCards = data?.away?.disciplineFouls?.redCards ?? 0;
  const homeYellowCards = data?.home?.disciplineFouls?.yellowCards ?? 0;
  const awayYellowCards = data?.away?.disciplineFouls?.yellowCards ?? 0;
  const homePenaltiesTaken =
    data?.home?.shooting?.penaltyKicksTaken ??
    data?.home?.shooting?.penaltyGoals ??
    0;
  const awayPenaltiesTaken =
    data?.away?.shooting?.penaltyKicksTaken ??
    data?.away?.shooting?.penaltyGoals ??
    0;

  const scoreboardWinner = useMemo<"home" | "away" | null>(() => {
    if (homeScore == null || awayScore == null) return null;
    if (homeScore === awayScore) return null;
    const status = String(statusText ?? "").toLowerCase();
    const finalKeywords = ["ft", "final", "full", "ended", "complete"];
    const isFinal = finalKeywords.some((kw) => status.includes(kw));
    if (!isFinal) return null;
    return homeScore > awayScore ? "home" : "away";
  }, [homeScore, awayScore, statusText]);

  useEffect(() => {
    if (redCardTrackerRef.current == null) {
      redCardTrackerRef.current = { home: homeRedCards, away: awayRedCards };
      return;
    }
    const prev = redCardTrackerRef.current;
    if (homeRedCards > prev.home || awayRedCards > prev.away) {
      triggerHighlight("animate-red-card", 2600);
      activateOverlay("red-card", 2600);
    }
    if (homeRedCards !== prev.home || awayRedCards !== prev.away) {
      redCardTrackerRef.current = { home: homeRedCards, away: awayRedCards };
    }
  }, [homeRedCards, awayRedCards, activateOverlay, triggerHighlight]);

  useEffect(() => {
    if (yellowCardTrackerRef.current == null) {
      yellowCardTrackerRef.current = {
        home: homeYellowCards,
        away: awayYellowCards,
      };
      return;
    }
    const prev = yellowCardTrackerRef.current;
    if (homeYellowCards > prev.home || awayYellowCards > prev.away) {
      triggerHighlight("animate-penalty", 2200);
      activateOverlay("yellow-card", 2600);
    }
    if (homeYellowCards !== prev.home || awayYellowCards !== prev.away) {
      yellowCardTrackerRef.current = {
        home: homeYellowCards,
        away: awayYellowCards,
      };
    }
  }, [homeYellowCards, awayYellowCards, activateOverlay, triggerHighlight]);

  useEffect(() => {
    if (penaltyTrackerRef.current == null) {
      penaltyTrackerRef.current = {
        home: homePenaltiesTaken,
        away: awayPenaltiesTaken,
      };
      return;
    }
    const prev = penaltyTrackerRef.current;
    if (homePenaltiesTaken > prev.home || awayPenaltiesTaken > prev.away) {
      triggerHighlight("animate-penalty", 2600);
    }
    if (homePenaltiesTaken !== prev.home || awayPenaltiesTaken !== prev.away) {
      penaltyTrackerRef.current = {
        home: homePenaltiesTaken,
        away: awayPenaltiesTaken,
      };
    }
  }, [homePenaltiesTaken, awayPenaltiesTaken, triggerHighlight]);

  useEffect(() => {
    if (!scoreboardWinner) {
      winnerHighlightRef.current = null;
      return;
    }
    if (winnerHighlightRef.current === scoreboardWinner) return;
    winnerHighlightRef.current = scoreboardWinner;
    triggerHighlight("animate-winner", 3200);
    activateOverlay("winner", 3200);
  }, [activateOverlay, scoreboardWinner, triggerHighlight]);

  useEffect(() => {
    if (!scoreboardWinner) return;
    if (winnerOverrideTimerRef.current) {
      clearTimeout(winnerOverrideTimerRef.current);
      winnerOverrideTimerRef.current = null;
    }
    setOverrideWinner(null);
  }, [scoreboardWinner]);

  const effectiveWinnerSide = overrideWinner ?? scoreboardWinner ?? null;

  const overlayElement = useMemo(() => {
    if (!overlayState) return undefined;
    const { kind, key } = overlayState;
    const baseClass = "fixed inset-0 pointer-events-none overflow-hidden z-50";

    if (kind === "goal" || kind === "penalty") {
      const isPenalty = kind === "penalty";
      const palette = isPenalty
        ? ["#fde68a", "#facc15", "#f97316", "#fbbf24"]
        : ["#f87171", "#34d399", "#60a5fa", "#fbbf24", "#ec4899"];
      const bannerStyle: CSSProperties = {
        position: "absolute",
        top: "12%",
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: "clamp(2.5rem, 9vw, 5.5rem)",
        fontWeight: 900,
        letterSpacing: "0.12em",
        color: isPenalty ? "#facc15" : "#0cad27ff",
        textShadow: isPenalty
          ? "0 0 24px rgba(250, 204, 21, 0.85), 0 0 12px rgba(255, 255, 255, 0.75)"
          : "0 0 28px rgba(30, 255, 0, 1), 0 0 16px rgba(255, 255, 255, 0.85)",
        animation: "overlayShoutPulse 1.4s ease-in-out infinite alternate",
        textTransform: "uppercase",
        pointerEvents: "none",
      };
      return (
        <div
          key={`overlay-${key}`}
          className={`${baseClass} flex items-start justify-center`}
        >
          <div style={bannerStyle}>{isPenalty ? "Penalty!" : "Goal!"}</div>
          {Array.from({ length: 30 }).map((_, i) => {
            const style: CSSProperties = {
              left: `${Math.random() * 100}%`,
              backgroundColor:
                palette[Math.floor(Math.random() * palette.length)],
              animationDelay: `${Math.random() * 0.5}s`,
            };
            return (
              <div
                key={`goal-${key}-${i}`}
                className="animate-confetti absolute h-2 w-2 rounded-full"
                style={style}
              />
            );
          })}
        </div>
      );
    }

    if (kind === "red-card" || kind === "yellow-card") {
      const color = kind === "red-card" ? "#dc2626" : "#facc15";
      const count = kind === "red-card" ? 42 : 36;
      return (
        <div key={`overlay-${key}`} className={baseClass}>
          {Array.from({ length: count }).map((_, i) => {
            const style: CSSProperties = {
              left: `${Math.random() * 100}%`,
              width: `${12 + Math.random() * 14}px`,
              height: `${18 + Math.random() * 22}px`,
              backgroundColor: color,
              opacity: kind === "yellow-card" ? 0.92 : 0.9,
              animationDelay: `${Math.random() * 0.4}s`,
              animationDuration: `${1.6 + Math.random() * 0.9}s`,
              transform: `rotate(${Math.random() * 60 - 30}deg)`,
            };
            return (
              <div
                key={`card-${key}-${i}`}
                className="falling-card"
                style={style}
              />
            );
          })}
        </div>
      );
    }

    if (kind === "winner") {
      const colors = ["#facc15", "#38bdf8", "#f97316", "#a855f7", "#f472b6"];
      return (
        <div key={`overlay-${key}`} className={baseClass}>
          {Array.from({ length: 12 }).map((_, i) => {
            const style: CSSProperties = {
              left: `${10 + Math.random() * 80}%`,
              top: `${15 + Math.random() * 55}%`,
              color: colors[i % colors.length],
              animationDelay: `${Math.random() * 0.6}s`,
              animationDuration: `${1.6 + Math.random() * 0.7}s`,
            };
            return (
              <div
                key={`firework-${key}-${i}`}
                className="firework"
                style={style}
              />
            );
          })}
        </div>
      );
    }

    return undefined;
  }, [overlayState]);

  const handleTestAnimation = useCallback(
    (
      kind:
        | "goal"
        | "penalty"
        | "red"
        | "yellow"
        | "winner-home"
        | "winner-away"
        | "reset"
    ) => {
      switch (kind) {
        case "goal":
          startGoalAnimation("animate-goal", "goal");
          break;
        case "penalty":
          startGoalAnimation("animate-penalty", "penalty");
          break;
        case "red":
          triggerHighlight("animate-red-card", 2600);
          activateOverlay("red-card", 2600);
          break;
        case "yellow":
          triggerHighlight("animate-penalty", 2200);
          activateOverlay("yellow-card", 2600);
          break;
        case "winner-home":
        case "winner-away": {
          const side = kind === "winner-home" ? "home" : "away";
          if (winnerOverrideTimerRef.current) {
            clearTimeout(winnerOverrideTimerRef.current);
          }
          setOverrideWinner(side);
          triggerHighlight("animate-winner", 3200);
          activateOverlay("winner", 3200);
          winnerOverrideTimerRef.current = setTimeout(() => {
            setOverrideWinner(null);
            winnerOverrideTimerRef.current = null;
          }, 3200);
          break;
        }
        case "reset":
          if (goalAnimTimerRef.current) {
            clearTimeout(goalAnimTimerRef.current);
            goalAnimTimerRef.current = null;
          }
          setGoalAnim(false);
          if (highlightTimerRef.current) {
            clearTimeout(highlightTimerRef.current);
            highlightTimerRef.current = null;
          }
          setSummaryHighlight(null);
          if (overlayTimerRef.current) {
            clearTimeout(overlayTimerRef.current);
            overlayTimerRef.current = null;
          }
          setOverlayState(null);
          if (winnerOverrideTimerRef.current) {
            clearTimeout(winnerOverrideTimerRef.current);
            winnerOverrideTimerRef.current = null;
          }
          setOverrideWinner(null);
          break;
        default:
          break;
      }
    },
    [activateOverlay, startGoalAnimation, triggerHighlight]
  );

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
    // {
    //   title: "Player Stats",
    //   content: <PlayerStatsCard />,
    // },
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
        summaryHighlightClassName={summaryHighlight ?? undefined}
        winnerSide={effectiveWinnerSide}
        overlay={overlayElement}
      />

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 px-4">
        <button
          type="button"
          className="rounded-md border border-emerald-600 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          onClick={() => handleTestAnimation("goal")}
        >
          Test Goal
        </button>
        <button
          type="button"
          className="rounded-md border border-amber-500 px-3 py-1 text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
          onClick={() => handleTestAnimation("penalty")}
        >
          Test Penalty
        </button>
        <button
          type="button"
          className="rounded-md border border-red-500 px-3 py-1 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          onClick={() => handleTestAnimation("red")}
        >
          Test Red Card
        </button>
        <button
          type="button"
          className="rounded-md border border-yellow-500 px-3 py-1 text-sm font-semibold text-yellow-600 transition hover:bg-yellow-50"
          onClick={() => handleTestAnimation("yellow")}
        >
          Test Yellow Card
        </button>
        <button
          type="button"
          className="rounded-md border border-yellow-500 px-3 py-1 text-sm font-semibold text-yellow-600 transition hover:bg-yellow-50"
          onClick={() => handleTestAnimation("winner-home")}
        >
          Test Winner (Home)
        </button>
        <button
          type="button"
          className="rounded-md border border-blue-500 px-3 py-1 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
          onClick={() => handleTestAnimation("winner-away")}
        >
          Test Winner (Away)
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-400 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          onClick={() => handleTestAnimation("reset")}
        >
          Reset Animations
        </button>
      </div>
    </>
  );
}
