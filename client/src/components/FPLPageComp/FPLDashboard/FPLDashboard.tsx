import { useEffect, useState } from "react";
import styles from "./FPLDashboard.module.css";
import { getEntryHistory, getUserPicks, getBootstrap } from "../../../api/fpl";
import FPLSummaryCard from "./FPLSummaryCard";
import FPLTeamLineup from "./FPLTeamLineup";
import FPLTransferAnalysis from "./FPLTransferAnalysis";
import FPLLeagueInsights from "./FPLLeagueInsights"; // ✅ newly added

// --------------------
// Type Definitions
// --------------------

// Full player structure as returned by the FPL API
export interface FPLPlayer {
  id: number;
  web_name: string;
  photo: string;
  element_type: number;
}

interface FPLBootstrap {
  elements: FPLPlayer[];
}

interface FPLHistory {
  current: {
    event: number;
    points: number;
    overall_rank: number;
    event_transfers: number;
    event_transfers_cost: number;
  }[];
}

export interface FPLPick {
  element: number;
  position: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

interface FPLPicks {
  picks: FPLPick[];
}

interface Props {
  teamId: number;
  onBack: () => void;
}

// --------------------
// Component
// --------------------
export default function FPLDashboard({ teamId, onBack }: Props) {
  const [summary, setSummary] = useState<FPLHistory | null>(null);
  const [players, setPlayers] = useState<Record<number, FPLPlayer>>({});
  const [picks, setPicks] = useState<FPLPick[]>([]);
  const [currentGW, setCurrentGW] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1️⃣ Load bootstrap (player metadata)
        const bootstrap = (await getBootstrap()) as FPLBootstrap | null;
        const playerDict: Record<number, FPLPlayer> = Object.fromEntries(
          (bootstrap?.elements || [])
            .filter((p) => p && p.id)
            .map((p) => [p.id, p])
        );
        setPlayers(playerDict);

        // 2️⃣ Load entry history (points, ranks, etc.)
        const history = (await getEntryHistory(teamId)) as FPLHistory | null;
        setSummary(history);

        // Determine the latest gameweek played
        const currentGw = history?.current?.slice(-1)[0]?.event || null;
        setCurrentGW(currentGw);

        // 3️⃣ Load picks for latest gameweek
        if (!currentGw) {
          setPicks([]);
          return;
        }
        const picksData = (await getUserPicks(
          teamId,
          currentGw
        )) as FPLPicks | null;
        setPicks(picksData?.picks || []);
      } catch (err) {
        console.error("Error loading FPL dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [teamId]);

  if (loading) {
    return <div className={styles.loading}>Loading your FPL data...</div>;
  }

  return (
    <div className={styles.container}>
      <button onClick={onBack} className={styles.backButton}>
        ← Back
      </button>

      {/* Summary of team performance */}
      {summary && <FPLSummaryCard data={summary} />}

      {/* Current team lineup */}
      {picks.length > 0 && <FPLTeamLineup picks={picks} players={players} />}

      {/* Transfer analysis */}
      <FPLTransferAnalysis teamId={teamId} players={players} />

      {/* ✅ New: Mini-league insights and stats */}
      {currentGW && <FPLLeagueInsights teamId={teamId} currentGW={currentGW} />}
    </div>
  );
}
