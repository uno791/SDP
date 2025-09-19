import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../config";
import LiveMatchTimeline from "./LiveMatchTimeline";
import MatchViewerModal from "./MatchViewerModal"; // ✅ new modal
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
};

export default function LiveUserMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [now, setNow] = useState(new Date());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [modalMatchId, setModalMatchId] = useState<number | null>(null); // ✅ NEW STATE

  useEffect(() => {
    axios
      .get(`${baseURL}/matches`)
      .then((res) => {
        console.log("[Frontend] /matches response:", res.data); // ✅ log response
        setMatches(res.data.matches || []);
      })
      .catch((err) => console.error("[Frontend] Failed to fetch matches:", err));
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

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Live User Matches</h3>
      {liveMatches.map((m) => {
        const kickoff = new Date(m.utc_kickoff).getTime();
        const duration = Number(m.notes_json?.duration ?? 90);
        const end = kickoff + duration * 60000;
        const isLive = now.getTime() >= kickoff && now.getTime() < end;
        const minute = isLive
          ? Math.min(Math.floor((now.getTime() - kickoff) / 60000), duration)
          : undefined;

        return (
          <div key={m.id} className={styles.card}>
            {/* Summary row (expand/collapse timeline) */}
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

              <span className={styles.status}>
                {isLive ? `${minute ?? 0}'` : "FT"}
              </span>

              <span className={styles.arrow}>
                {expandedId === m.id ? "▲" : "▼"}
              </span>
            </div>

            {/* Expanded inline timeline */}
            {expandedId === m.id && (
              <div className={styles.timelineBox}>
                <LiveMatchTimeline matchId={m.id} />
                {/* ✅ Button to open full modal */}
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

      {/* ✅ Global modal render */}
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
};

export default function LiveUserMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [now, setNow] = useState(new Date());
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    axios
      .get(`${baseURL}/matches`)
      .then((res) => setMatches(res.data.matches || []))
      .catch((err) => console.error("Failed to fetch matches:", err));
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

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Live User Matches</h3>
      {liveMatches.map((m) => {
        const kickoff = new Date(m.utc_kickoff).getTime();
        const duration = Number(m.notes_json?.duration ?? 90);
        const end = kickoff + duration * 60000;
        const isLive = now.getTime() >= kickoff && now.getTime() < end;
        const minute = isLive
          ? Math.min(Math.floor((now.getTime() - kickoff) / 60000), duration)
          : undefined;

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

              <span className={styles.status}>
                {isLive ? `${minute ?? 0}'` : "FT"}
              </span>

              <span className={styles.arrow}>
                {expandedId === m.id ? "▲" : "▼"}
              </span>
            </div>

            {expandedId === m.id && (
              <div className={styles.timelineBox}>
                <LiveMatchTimeline matchId={m.id} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}*/
