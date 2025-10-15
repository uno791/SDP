import { useEffect, useState, useMemo } from "react";
import styles from "./FPLBestPlayers.module.css";
import { getBootstrap, getFixtures } from "../../../api/fpl";

interface FPLPlayer {
  id: number;
  web_name: string;
  team: number;
  element_type: number;
  total_points: number;
  form: string;
  value_form: string;
  now_cost: number;
  points_per_game: string;
  minutes: number;
  selected_by_percent?: string;
  status?: string;
}

interface FPLFixture {
  team_h: number;
  team_a: number;
  event: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
}

interface FPLBootstrap {
  elements: FPLPlayer[];
}

export default function FPLBestPlayers() {
  const [players, setPlayers] = useState<FPLPlayer[]>([]);
  const [fixtures, setFixtures] = useState<FPLFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState<number | "all">("all");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [bootstrapData, fixturesData] = await Promise.all([
          getBootstrap(),
          getFixtures(),
        ]);

        const bootstrap = bootstrapData as FPLBootstrap | null;
        const fixtureList = Array.isArray(fixturesData)
          ? (fixturesData as FPLFixture[])
          : [];

        setPlayers(bootstrap?.elements || []);
        setFixtures(fixtureList);
      } catch (err) {
        console.error("Error loading best players:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // ✅ Compute average fixture difficulty (next 3 fixtures)
  function avgFixtureDifficulty(teamId: number) {
    const upcoming = fixtures
      .filter((f) => f.team_h === teamId || f.team_a === teamId)
      .slice(0, 3);

    if (upcoming.length === 0) return 3;

    const total = upcoming.reduce((sum, f) => {
      const diff =
        f.team_h === teamId ? f.team_h_difficulty : f.team_a_difficulty;
      return sum + diff;
    }, 0);

    return total / upcoming.length;
  }

  // ✅ Compute smarter player ranking
  const rankedPlayers = useMemo(() => {
    if (!players.length) return [];

    const scored = players
      .filter(
        (p) =>
          p.minutes > 300 && // played enough
          p.status !== "i" && // not injured
          p.status !== "s" && // not suspended
          p.total_points > 0
      )
      .map((p) => {
        const difficulty = avgFixtureDifficulty(p.team);
        const formVal = parseFloat(p.form || "0");
        const ppg = parseFloat(p.points_per_game || "0");
        const price = p.now_cost / 10;
        const selected = parseFloat(p.selected_by_percent || "0") || 0;

        // ✅ Improved scoring formula
        // Rewards high form, consistent returns, and total points
        // Penalizes difficulty & cost slightly, boosts low-ownership picks
        const score =
          formVal * 4 +
          ppg * 5 +
          p.total_points * 0.1 -
          difficulty * 1.2 -
          price * 0.5 +
          (selected < 10 ? 3 : 0);

        return { ...p, score, difficulty, price };
      });

    const filtered =
      positionFilter === "all"
        ? scored
        : scored.filter((p) => p.element_type === positionFilter);

    return filtered.sort((a, b) => b.score - a.score).slice(0, 10);
  }, [players, fixtures, positionFilter]);

  if (loading)
    return <div className={styles.loading}>Loading best players...</div>;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.heading}>Best Players to Have</h3>
        <select
          className={styles.dropdown}
          value={positionFilter}
          onChange={(e) =>
            setPositionFilter(
              e.target.value === "all" ? "all" : parseInt(e.target.value, 10)
            )
          }
        >
          <option value="all">All</option>
          <option value={1}>Goalkeepers</option>
          <option value={2}>Defenders</option>
          <option value={3}>Midfielders</option>
          <option value={4}>Forwards</option>
        </select>
      </div>

      {rankedPlayers.length === 0 ? (
        <p>No player data available.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Player</th>
              <th>Form</th>
              <th>Total</th>
              <th>PPG</th>
              <th>Cost</th>
              <th>Diff</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rankedPlayers.map((p) => (
              <tr key={p.id}>
                <td>{p.web_name}</td>
                <td>{parseFloat(p.form).toFixed(1)}</td>
                <td>{p.total_points}</td>
                <td>{p.points_per_game}</td>
                <td>{p.price.toFixed(1)}m</td>
                <td>{p.difficulty.toFixed(1)}</td>
                <td>{p.score.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
