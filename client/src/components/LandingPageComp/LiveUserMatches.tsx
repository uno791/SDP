import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../config";
import LiveMatchTimeline from "./LiveMatchTimeline";
import MatchViewerModal from "./MatchViewerModal";
import ReportModal from "./ReportModal"; // ✅ added
import styles from "./LiveUserMatches.module.css";

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
  home_possession?: number | null; // ✅ added
  away_possession?: number | null; // ✅ added
};

export default function LiveUserMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [now, setNow] = useState(new Date());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [modalMatchId, setModalMatchId] = useState<number | null>(null);
  const [reportMatchId, setReportMatchId] = useState<number | null>(null); // ✅ added

  useEffect(() => {
    axios
      .get(`${baseURL}/matches`)
      .then((res) => {
        console.log("[Frontend] /matches response:", res.data);
        setMatches(res.data.matches || []);
      })
      .catch((err) =>
        console.error("[Frontend] Failed to fetch matches:", err)
      );
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const liveMatches = matches.filter((m) => {
    if (m.status === "final") return false;
    const kickoff = new Date(m.utc_kickoff).getTime();
    const duration = Number(m.notes_json?.duration ?? 90);
    const end = kickoff + duration * 60000;
    return now.getTime() >= kickoff && now.getTime() < end;
  });

  const toggleCard = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Live User Matches</h3>

      {liveMatches.length === 0 ? (
        <div className={styles.state}>No user matches are live right now.</div>
      ) : (
        <div className={styles.grid}>
          {liveMatches.map((m) => {
            const kickoff = new Date(m.utc_kickoff).getTime();
            const duration = Number(m.notes_json?.duration ?? 90);
            const end = kickoff + duration * 60000;
            const isLive = now.getTime() >= kickoff && now.getTime() < end;
            const minute = isLive
              ? Math.min(
                  Math.floor((now.getTime() - kickoff) / 60000),
                  duration
                )
              : undefined;
            const isOpen = expandedId === m.id;

            return (
              <div
                key={m.id}
                className={`${styles.card} ${isOpen ? styles.open : ""}`}
              >
                <div
                  className={styles.header}
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
                  <div className={`${styles.team} ${styles.teamLeft}`}>
                    <span className={styles.teamName}>
                      {m.home_team?.name ?? "TBD"}
                    </span>
                  </div>

                  <div className={styles.center}>
                    <div className={styles.score}>
                      {m.home_score ?? 0} - {m.away_score ?? 0}
                    </div>
                    <div
                      className={`${styles.status} ${
                        isLive ? styles.statusLive : styles.statusFinal
                      }`}
                    >
                      {isLive ? `${minute ?? 0}'` : "FT"}
                    </div>
                  </div>

                  <div className={`${styles.team} ${styles.teamRight}`}>
                    <span className={styles.teamName}>
                      {m.away_team?.name ?? "TBD"}
                    </span>
                  </div>

                  <div className={styles.chevron} aria-hidden="true">
                    {isOpen ? "▲" : "▼"}
                  </div>
                </div>

                <div
                  className={`${styles.body} ${isOpen ? styles.bodyOpen : ""}`}
                >
                  <div className={styles.bodyInner}>
                    {/* ✅ Possession display */}
                    <div className={styles.possessionDisplay}>
                      <strong>Possession:</strong>
                      <div className={styles.possessionBar}>
                        <span>
                          {m.home_team?.name ?? "Home"}:{" "}
                          {m.home_possession ?? 50}%
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={m.home_possession ?? 50}
                          readOnly
                        />
                        <span>
                          {m.away_team?.name ?? "Away"}:{" "}
                          {m.away_possession ?? 50}%
                        </span>
                      </div>
                    </div>

                    <LiveMatchTimeline matchId={m.id} />
                    <div className={styles.actionsRow}>
                      <button
                        className={styles.viewerBtn}
                        onClick={() => setModalMatchId(m.id)}
                      >
                        Open Match Viewer
                      </button>
                      {/* ✅ New Report button */}
                      <button
                        className={styles.reportBtn}
                        onClick={() => setReportMatchId(m.id)}
                      >
                        Report
                      </button>
                    </div>
                  </div>
                </div>
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

      {/* ✅ Report Modal */}
      {reportMatchId && (
        <ReportModal
          matchId={reportMatchId}
          isOpen={true}
          onClose={() => setReportMatchId(null)}
        />
      )}
    </div>
  );
}
