import { useEffect, useState } from "react";
import styles from "./FPLDashboard.module.css";
import { getEntryHistory, getUserPicks, getBootstrap } from "../../../api/fpl";
import FPLSummaryCard from "./FPLSummaryCard";
import FPLTeamLineup from "./FPLTeamLineup";

// --------------------
// Type Definitions
// --------------------

// The full player structure as returned by the FPL API
export interface FPLPlayer {
  id: number;
  web_name: string;
  photo: string; // make required
  element_type: number; // make required
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. Load bootstrap for player names and metadata
        const bootstrap = (await getBootstrap()) as FPLBootstrap | null;

        // Map player IDs to player objects for quick lookup
        const playerDict: Record<number, FPLPlayer> = Object.fromEntries(
          (bootstrap?.elements || [])
            .filter((p) => p && p.id)
            .map((p) => [p.id, p])
        );
        setPlayers(playerDict);

        // 2. Load team history
        const history = (await getEntryHistory(teamId)) as FPLHistory | null;
        setSummary(history);

        // 3. Load picks for the most recent gameweek
        const currentGw = history?.current?.slice(-1)[0]?.event;
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
      {summary && <FPLSummaryCard data={summary} />}
      {picks.length > 0 && <FPLTeamLineup picks={picks} players={players} />}
    </div>
  );
}
