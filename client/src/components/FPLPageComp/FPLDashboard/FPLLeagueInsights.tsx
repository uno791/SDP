import { useEffect, useState } from "react";
import styles from "./FPLLeagueInsights.module.css";
import {
  getUserLeagues,
  getLeagueStandings,
  getUserPicks,
  getBootstrap,
} from "../../../api/fpl";

interface Props {
  teamId: number;
  currentGW: number;
}

interface PlayerOwnership {
  name: string;
  percent: number;
}

interface LeagueStats {
  avgPoints: number;
  rankChange: number;
  topTeams: any[];
  mostOwned: PlayerOwnership[];
  mostCaptained: PlayerOwnership[];
  mostImproved: { name: string; gain: number }[];
}

export default function FPLLeagueInsights({ teamId, currentGW }: Props) {
  const [leagues, setLeagues] = useState<{ id: number; name: string }[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [bootstrap, setBootstrap] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [leagueStats, setLeagueStats] = useState<LeagueStats | null>(null);

  // Load user's leagues
  useEffect(() => {
    async function loadLeagues() {
      const leagueList = await getUserLeagues(teamId);
      setLeagues(leagueList);
      if (leagueList.length > 0) setSelectedLeague(leagueList[0].id);
    }
    loadLeagues();
  }, [teamId]);

  // Load bootstrap (players + teams)
  useEffect(() => {
    getBootstrap().then(setBootstrap);
  }, []);

  useEffect(() => {
    if (selectedLeague === null || !bootstrap) return;
    const leagueId: number = selectedLeague;

    async function loadLeagueData() {
      setLoading(true);

      const league = await getLeagueStandings(leagueId);
      const entries = league?.standings?.results || [];

      if (entries.length === 0) {
        setLeagueStats(null);
        setLoading(false);
        return;
      }

      const totalPoints = entries.reduce(
        (sum: number, e: any) => sum + e.total,
        0
      );
      const avgPoints = totalPoints / entries.length;

      const yourTeam = entries.find((e: any) => e.entry === teamId);
      const rankChange = yourTeam ? yourTeam.last_rank - yourTeam.rank : 0;

      const topTeams = entries.slice(0, 5);

      // Most improved teams
      const mostImproved = [...entries]
        .filter((e) => e.last_rank && e.last_rank > e.rank)
        .map((e) => ({
          name: e.entry_name,
          gain: e.last_rank - e.rank,
        }))
        .sort((a, b) => b.gain - a.gain)
        .slice(0, 5);

      const sampleEntries = entries.slice(0, 20);
      const ownershipCount: Record<number, number> = {};
      const captainCount: Record<number, number> = {};

      for (const e of sampleEntries) {
        const picks = await getUserPicks(e.entry, currentGW);
        picks?.picks?.forEach((p: any) => {
          ownershipCount[p.element] = (ownershipCount[p.element] || 0) + 1;
          if (p.is_captain)
            captainCount[p.element] = (captainCount[p.element] || 0) + 1;
        });
      }

      const mostOwned = Object.entries(ownershipCount)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5)
        .map(([id, count]) => {
          const player = bootstrap?.elements?.find(
            (p: any) => p.id === Number(id)
          );
          return {
            name: player?.web_name ?? `#${id}`,
            percent: ((count as number) / sampleEntries.length) * 100,
          };
        });

      const mostCaptained = Object.entries(captainCount)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3)
        .map(([id, count]) => {
          const player = bootstrap?.elements?.find(
            (p: any) => p.id === Number(id)
          );
          return {
            name: player?.web_name ?? `#${id}`,
            percent: ((count as number) / sampleEntries.length) * 100,
          };
        });

      setLeagueStats({
        avgPoints,
        rankChange,
        topTeams,
        mostOwned,
        mostCaptained,
        mostImproved,
      });
      setLoading(false);
    }

    loadLeagueData();
  }, [selectedLeague, bootstrap, currentGW, teamId]);

  if (loading)
    return <div className={styles.loading}>Loading league data...</div>;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.heading}>League Insights</h3>
        {leagues.length > 0 && (
          <select
            value={selectedLeague ?? ""}
            onChange={(e) => setSelectedLeague(Number(e.target.value))}
            className={styles.dropdown}
          >
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {!leagueStats ? (
        <p>No league data available.</p>
      ) : (
        <>
          <div className={styles.summary}>
            <div>
              <strong>Average Points:</strong>{" "}
              {leagueStats.avgPoints.toFixed(1)}
            </div>
            <div>
              <strong>Your Rank Change:</strong>{" "}
              {leagueStats.rankChange > 0
                ? `↑ ${leagueStats.rankChange}`
                : leagueStats.rankChange < 0
                ? `↓ ${Math.abs(leagueStats.rankChange)}`
                : "No change"}
            </div>
          </div>

          <div className={styles.section}>
            <h4>Top 5 Teams</h4>
            <ul>
              {leagueStats.topTeams.map((t: any) => (
                <li key={t.entry}>
                  {t.entry_name} — {t.total} pts
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h4>Most Improved Teams</h4>
            <ul>
              {leagueStats.mostImproved.map((t, i) => (
                <li key={i}>
                  {t.name} (+{t.gain} ranks)
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h4>Most Owned Players</h4>
            <ul>
              {leagueStats.mostOwned.map((p, i) => (
                <li key={i}>
                  {p.name} ({p.percent.toFixed(1)}%)
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h4>Most Captained Players</h4>
            <ul>
              {leagueStats.mostCaptained.map((p, i) => (
                <li key={i}>
                  {p.name} ({p.percent.toFixed(1)}%)
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
