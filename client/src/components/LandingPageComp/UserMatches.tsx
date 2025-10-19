import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../config";
import LiveMatchTimeline from "./LiveMatchTimeline";
import MatchViewerModal from "./MatchViewerModal";
import styles from "./UserMatches.module.css";

type Match = {
  id: number;
  home_team?: { id: number; name: string } | null;
  away_team?: { id: number; name: string } | null;
  home_score?: number | null;
  away_score?: number | null;
  status: string;
  utc_kickoff: string;
  minute?: number | null;
  notes_json?: { duration?: string | number };
  league_code?: string | null; // ✅ Added so TS knows this exists
};

export default function UserMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [modalMatchId, setModalMatchId] = useState<number | null>(null);

  useEffect(() => {
    if (!date) return;
    const from = `${date}T00:00:00`;
    const to = `${date}T23:59:59`;

    axios
      .get(`${baseURL}/matches?from=${from}&to=${to}`)
      .then((res) => {
        console.log(`[Frontend] UserMatches for ${date}:`, res.data);

        // 🧹 Filter out major leagues only (Premier League, La Liga, Serie A, Ligue 1, Bundesliga)
        const filtered = (res.data.matches || []).filter(
          (m: any) =>
            ![
              "eng.1", // Premier League
              "esp.1", // La Liga
              "ita.1", // Serie A
              "fra.1", // Ligue 1
              "ger.1", // Bundesliga
            ].includes(m.league_code ?? "")
        );

        setMatches(filtered);
      })
      .catch((err) =>
        console.error("[Frontend] Failed to fetch matches for date:", err)
      );
  }, [date]);

  const toggleCard = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={styles.container}>
      <div className={styles.headingRow}>
        <h3 className={styles.heading}>User Matches</h3>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={styles.datePicker}
        />
      </div>

      {matches.length === 0 ? (
        <div className={styles.state}>No matches for this date.</div>
      ) : (
        <div className={styles.list}>
          {matches.map((m) => {
            const kickoff = new Date(m.utc_kickoff);
            const now = new Date();
            const duration = Number(m.notes_json?.duration ?? 90);
            const end = new Date(kickoff.getTime() + duration * 60000);
            const kickoffTime = kickoff.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            let statusLabel = "Scheduled";
            if (m.status === "final" || now > end) {
              statusLabel = "FT";
            } else if (now >= kickoff && now <= end) {
              const minute = Math.min(
                Math.floor((now.getTime() - kickoff.getTime()) / 60000),
                duration
              );
              statusLabel = `${minute}'`;
            } else if (now < kickoff) {
              statusLabel = `KO: ${kickoffTime}`;
            }

            const isOpen = expandedId === m.id;

            return (
              <div
                key={m.id}
                className={`${styles.card} ${isOpen ? styles.open : ""}`}
              >
                <div
                  className={styles.row}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleCard(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleCard(m.id);
                    }
                  }}
                >
                  <div className={styles.left}>
                    <div className={styles.matchup}>
                      <span className={styles.teamName}>
                        {m.home_team?.name ?? "TBD"}
                      </span>
                      <span className={styles.vs}>vs</span>
                      <span className={styles.teamName}>
                        {m.away_team?.name ?? "TBD"}
                      </span>
                    </div>
                    <div className={styles.score}>
                      {m.home_score ?? 0} - {m.away_score ?? 0}
                    </div>
                    <div className={styles.subline}>{statusLabel}</div>
                  </div>
                  <div className={styles.chevron} aria-hidden="true">
                    {isOpen ? "▲" : "▼"}
                  </div>
                </div>

                {isOpen && (
                  <div className={styles.body}>
                    <LiveMatchTimeline matchId={m.id} />
                    <button
                      className={styles.viewerBtn}
                      onClick={() => setModalMatchId(m.id)}
                    >
                      Open Match Viewer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalMatchId && (
        <MatchViewerModal
          matchId={modalMatchId}
          onClose={() => setModalMatchId(null)}
        />
      )}
    </div>
  );
}




/*import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../config";
import LiveMatchTimeline from "./LiveMatchTimeline";
import MatchViewerModal from "./MatchViewerModal";
import styles from "./UserMatches.module.css";

type Match = {
  id: number;
  home_team?: { id: number; name: string } | null;
  away_team?: { id: number; name: string } | null;
  home_score?: number | null;
  away_score?: number | null;
  status: string;
  utc_kickoff: string;
  minute?: number | null;
  notes_json?: { duration?: string | number };
};

export default function UserMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [modalMatchId, setModalMatchId] = useState<number | null>(null);

  useEffect(() => {
    if (!date) return;
    const from = `${date}T00:00:00`;
    const to = `${date}T23:59:59`;

    axios
      .get(`${baseURL}/matches?from=${from}&to=${to}`)
      .then((res) => {
        console.log(`[Frontend] UserMatches for ${date}:`, res.data);
        setMatches(res.data.matches || []);
      })
      .catch((err) =>
        console.error("[Frontend] Failed to fetch matches for date:", err)
      );
  }, [date]);

  return (
    <div className={styles.container}>
      <div className={styles.headingRow}>
        <h3 className={styles.heading}>User Matches</h3>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={styles.datePicker}
        />
      </div>

      {matches.length === 0 ? (
        <p>No matches for this date.</p>
      ) : (
        matches.map((m) => {
          const kickoff = new Date(m.utc_kickoff);
          const now = new Date();
          const duration = Number(m.notes_json?.duration ?? 90);
          const end = new Date(kickoff.getTime() + duration * 60000);

          let statusLabel = "Scheduled";
          if (m.status === "final" || now > end) {
            statusLabel = "FT";
          } else if (now >= kickoff && now <= end) {
            const minute = Math.min(
              Math.floor((now.getTime() - kickoff.getTime()) / 60000),
              duration
            );
            statusLabel = `${minute}'`;
          } else if (now < kickoff) {
            statusLabel = `KO: ${kickoff.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}`;
          }

          return (
            <div key={m.id} className={styles.card}>
              <div
                className={styles.summary}
                onClick={() =>
                  setExpandedId((prev) => (prev === m.id ? null : m.id))
                }
              >
                <span className={styles.team}>{m.home_team?.name ?? "TBD"}</span>

                <span className={styles.score}>
                  {m.home_score ?? 0} - {m.away_score ?? 0}
                </span>

                <span className={styles.team}>{m.away_team?.name ?? "TBD"}</span>

                <span className={styles.status}>{statusLabel}</span>

                <span className={styles.arrow}>
                  {expandedId === m.id ? "▲" : "▼"}
                </span>
              </div>

              {expandedId === m.id && (
                <div className={styles.timelineBox}>
                  <LiveMatchTimeline matchId={m.id} />
                  <button
                    className={styles.viewerBtn}
                    onClick={() => setModalMatchId(m.id)}
                  >
                    Open Match Viewer
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}

      {modalMatchId && (
        <MatchViewerModal
          matchId={modalMatchId}
          onClose={() => setModalMatchId(null)}
        />
      )}
    </div>
  );
}*/
