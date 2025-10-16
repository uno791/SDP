import { useEffect, useState } from "react";
import styles from "./FPLDashboard.module.css";
import { getEntryHistory, getUserPicks, getBootstrap } from "../../../api/fpl";
import FPLSummaryCard from "./FPLSummaryCard";
import FPLTeamLineup from "./FPLTeamLineup";
import FPLTransferAnalysis from "./FPLTransferAnalysis";
import FPLLeagueInsights from "./FPLLeagueInsights";
import FPLBestPlayers from "./FPLBestPlayers";
import FPLRecommendedTransfers from "./FPLRecommendedTransfers";

// --------------------
// Type Definitions
// --------------------

// Player as returned by FPL API
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

        // 1️⃣ Load bootstrap (all player metadata)
        const bootstrap = (await getBootstrap()) as FPLBootstrap | null;
        const playerDict: Record<number, FPLPlayer> = Object.fromEntries(
          (bootstrap?.elements || [])
            .filter((p) => p && p.id)
            .map((p) => [p.id, p])
        );
        setPlayers(playerDict);

        // 2️⃣ Load team’s entry history
        const history = (await getEntryHistory(teamId)) as FPLHistory | null;
        setSummary(history);

        // Get latest Gameweek
        const currentGw = history?.current?.slice(-1)[0]?.event || null;
        setCurrentGW(currentGw);

        // 3️⃣ Load user picks for the latest GW
        if (!currentGw) {
          setPicks([]);
          return;
        }

        const picksData = (await getUserPicks(
          teamId,
          currentGw
        )) as FPLPicks | null;
        setPicks(picksData?.picks || []);
      } catch (error) {
        console.error("Error loading FPL dashboard:", error);
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

      {/* Team Summary */}
      {summary && <FPLSummaryCard data={summary} />}

      {/* Lineup */}
      {picks.length > 0 && <FPLTeamLineup picks={picks} players={players} />}

      {/* Transfer Analysis */}
      <FPLTransferAnalysis teamId={teamId} players={players} />

      {/* Recommended Transfers */}
      {currentGW && (
        <FPLRecommendedTransfers teamId={teamId} currentGW={currentGW} />
      )}

      {/* League Insights */}
      {currentGW && <FPLLeagueInsights teamId={teamId} currentGW={currentGW} />}

      {/* Best Performing Players */}
      <FPLBestPlayers />
    </div>
  );
}
