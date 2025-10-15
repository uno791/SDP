import { useEffect, useState, useMemo } from "react";
import styles from "./FPLRecommendedTransfers.module.css";
import { getBootstrap, getUserPicks, getFixtures } from "../../../api/fpl";

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

interface UserPick {
  element: number;
  is_captain: boolean;
}

interface UserPicksResponse {
  picks: UserPick[];
}

interface FPLBootstrap {
  elements: FPLPlayer[];
}

interface Props {
  teamId: number;
  currentGW: number;
}

export default function FPLRecommendedTransfers({ teamId, currentGW }: Props) {
  const [players, setPlayers] = useState<FPLPlayer[]>([]);
  const [fixtures, setFixtures] = useState<FPLFixture[]>([]);
  const [userPicks, setUserPicks] = useState<UserPick[]>([]);
  const [loading, setLoading] = useState(true);

  // Load FPL data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [bootstrapData, picksData, fixtureData] = await Promise.all([
          getBootstrap(),
          getUserPicks(teamId, currentGW),
          getFixtures(),
        ]);

        const bootstrap = bootstrapData as FPLBootstrap | null;
        const fixtureList = Array.isArray(fixtureData)
          ? (fixtureData as FPLFixture[])
          : [];

        setPlayers(bootstrap?.elements || []);
        setUserPicks((picksData as UserPicksResponse)?.picks || []);
        setFixtures(fixtureList);
      } catch (err) {
        console.error("Error loading recommended transfers:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [teamId, currentGW]);

  // ✅ Compute average fixture difficulty for next 3 games
  function avgFixtureDifficulty(teamId: number) {
    const upcoming = fixtures
      .filter((f) => f.team_h === teamId || f.team_a === teamId)
      .slice(0, 3);
    if (upcoming.length === 0) return 3;
    const sum = upcoming.reduce((s, f) => {
      const diff =
        f.team_h === teamId ? f.team_h_difficulty : f.team_a_difficulty;
      return s + diff;
    }, 0);
    return sum / upcoming.length;
  }

  // Build player dictionary for fast lookup
  const playerById = useMemo(() => {
    const map: Record<number, FPLPlayer> = {};
    for (const p of players) map[p.id] = p;
    return map;
  }, [players]);

  // Build the user's actual team
  const myPlayers = useMemo(() => {
    return userPicks
      .map((p) => playerById[p.element])
      .filter(Boolean) as FPLPlayer[];
  }, [userPicks, playerById]);

  // ✅ Global ranking logic (same as best players)
  const ranked = useMemo(() => {
    if (!players.length) return [];

    return players
      .filter(
        (p) =>
          p.minutes > 300 &&
          p.status !== "i" &&
          p.status !== "s" &&
          p.total_points > 0
      )
      .map((p) => {
        const difficulty = avgFixtureDifficulty(p.team);
        const formVal = parseFloat(p.form || "0");
        const ppg = parseFloat(p.points_per_game || "0");
        const price = p.now_cost / 10;
        const selected = parseFloat(p.selected_by_percent || "0") || 0;

        // Smarter scoring
        const score =
          formVal * 4 +
          ppg * 5 +
          p.total_points * 0.1 -
          difficulty * 1.2 -
          price * 0.5 +
          (selected < 10 ? 3 : 0);

        return { ...p, score, difficulty, price };
      });
  }, [players, fixtures]);

  // ✅ Identify weak links (lowest-scoring players relative to position)
  const weakLinks = useMemo(() => {
    if (!myPlayers.length || !ranked.length) return [];

    const myWithScores = myPlayers.map((p) => {
      const global = ranked.find((r) => r.id === p.id);
      return global ? { ...p, score: global.score } : { ...p, score: 0 };
    });

    return myWithScores.sort((a, b) => a.score - b.score).slice(0, 3);
  }, [myPlayers, ranked]);

  // ✅ Recommend better players (same position, better score, within budget, not already owned)
  const recommendations = useMemo(() => {
    if (!ranked.length || !weakLinks.length || !myPlayers.length) return [];

    const myPlayerIds = new Set(myPlayers.map((p) => p.id));

    return weakLinks.map((weak) => {
      const betterOptions = ranked
        .filter(
          (p) =>
            p.element_type === weak.element_type &&
            p.id !== weak.id &&
            !myPlayerIds.has(p.id) && // 🚫 exclude players already owned
            p.score > weak.score &&
            p.now_cost <= weak.now_cost + 10 // within £1.0m tolerance
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      return { weak, betterOptions };
    });
  }, [weakLinks, ranked, myPlayers]);

  if (loading)
    return <div className={styles.loading}>Analyzing transfers...</div>;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.heading}>Recommended Transfers</h3>
      </div>

      {recommendations.length === 0 ? (
        <p>No recommendations available yet.</p>
      ) : (
        recommendations.map((rec, idx) => (
          <div key={idx} className={styles.transferBlock}>
            <div className={styles.outSection}>
              <div className={styles.label}>Consider selling:</div>
              <div className={styles.playerOut}>
                {rec.weak.web_name}{" "}
                <span className={styles.stat}>
                  ({parseFloat(rec.weak.points_per_game).toFixed(1)} PPG, £
                  {(rec.weak.now_cost / 10).toFixed(1)}m)
                </span>
              </div>
            </div>

            <div className={styles.inSection}>
              <div className={styles.label}>Suggested replacements:</div>
              {rec.betterOptions.length === 0 ? (
                <p>No clear upgrade available.</p>
              ) : (
                <ul className={styles.playerList}>
                  {rec.betterOptions.map((p) => (
                    <li key={p.id} className={styles.playerIn}>
                      {p.web_name}{" "}
                      <span className={styles.stat}>
                        ({parseFloat(p.points_per_game).toFixed(1)} PPG, £
                        {(p.now_cost / 10).toFixed(1)}m, Diff{" "}
                        {p.difficulty.toFixed(1)}, +
                        {(p.score - rec.weak.score).toFixed(1)} score)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
