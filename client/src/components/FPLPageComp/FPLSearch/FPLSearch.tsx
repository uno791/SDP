import { useState } from "react";
import styles from "./FPLSearch.module.css";
import { getEntry } from "../../../api/fpl";

// --------------------
// Type Definitions
// --------------------
interface FPLEntry {
  id: number;
  name: string;
  player_first_name: string;
  player_last_name: string;
}

interface Props {
  onSelectTeam: (teamId: number) => void;
}

// --------------------
// Component
// --------------------
export default function FPLSearch({ onSelectTeam }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FPLEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setError("");

    try {
      // There’s no FPL API endpoint to search by name,
      // so this simulates it using known IDs or cached data.
      const knownIds = [1201310, 10196659, 6418135, 9487289];
      const matches: FPLEntry[] = [];

      for (const id of knownIds) {
        const data = (await getEntry(id)) as FPLEntry | null;
        if (
          data &&
          `${data.player_first_name} ${data.player_last_name}`
            .toLowerCase()
            .includes(query.toLowerCase())
        ) {
          matches.push(data);
        }
      }

      if (matches.length === 0) {
        setError("No teams found for that name.");
      } else {
        setResults(matches);
      }
    } catch (e) {
      console.error(e);
      setError("Something went wrong while searching.");
    } finally {
      setLoading(false);
    }
  }

  const handleManualSubmit = () => {
    const idNum = Number(manualId);
    if (!isNaN(idNum) && idNum > 0) onSelectTeam(idNum);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Let's find your FPL team.</h2>

      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Search by manager name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
        />
        <button onClick={handleSearch} className={styles.searchButton}>
          🔍
        </button>
      </div>

      {loading && <p className={styles.loading}>Searching...</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.results}>
        {results.map((team) => (
          <div key={team.id} className={styles.teamCard}>
            <div className={styles.teamInfo}>
              <p>
                <strong>Team Name:</strong> {team.name}
              </p>
              <p>
                Manager Name: {team.player_first_name} {team.player_last_name}
              </p>
              <p className={styles.teamId}>Team Id: {team.id}</p>
            </div>
            <button
              className={styles.selectButton}
              onClick={() => onSelectTeam(team.id)}
            >
              Show more
            </button>
          </div>
        ))}
      </div>

      <div className={styles.manualSection}>
        {!showManual && (
          <p className={styles.noTeam}>
            Didn’t find your team?
            <button
              className={styles.enterButton}
              onClick={() => setShowManual(true)}
            >
              Enter team ID
            </button>
          </p>
        )}

        {showManual && (
          <div className={styles.manualBox}>
            <input
              type="number"
              placeholder="Enter your team ID"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className={styles.manualInput}
            />
            <button className={styles.enterButton} onClick={handleManualSubmit}>
              Go
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
