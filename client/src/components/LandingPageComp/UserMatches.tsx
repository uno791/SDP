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
        <div className={styles.grid}>
          {matches.map((m) => {
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
                  className={styles.header}
                  onClick={() =>
                    setExpandedId((prev) => (prev === m.id ? null : m.id))
                  }
                >
                  <div className={styles.team}>
                    {m.home_team?.name ?? "TBD"}
                  </div>

                  <div className={styles.center}>
                    <div className={styles.score}>
                      {m.home_score ?? 0} - {m.away_score ?? 0}
                    </div>
                    <div className={styles.status}>{statusLabel}</div>
                    <span className={styles.arrow}>
                      {expandedId === m.id ? "▲" : "▼"}
                    </span>
                  </div>

                  <div className={styles.team}>
                    {m.away_team?.name ?? "TBD"}
                  </div>
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
