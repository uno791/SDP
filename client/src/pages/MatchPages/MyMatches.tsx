import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./MyMatches.module.css";
import MatchList from "../../components/MatchPageComp/MatchList";
import { baseURL } from "../../config";
import { useUser } from "../../Users/UserContext";

// Match type aligned with backend structure
type Match = {
  id: number;
  home_team?: { id: number; name: string } | null;
  away_team?: { id: number; name: string } | null;
  home_score?: number | null;
  away_score?: number | null;
  status: string;
  utc_kickoff: string;
  minute?: number | null;
  notes_json?: {
    duration?: string | number;
    privacy?: string;
    invitedUsers?: string[];
    lineupTeam1?: string[];
    lineupTeam2?: string[];
  };
};

const MyMatches = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [matches, setMatches] = useState<Match[]>([]);
  const [now, setNow] = useState(new Date());

  // Fetch matches from backend
  useEffect(() => {
    if (!user?.id) return;

    axios
      .get(`${baseURL}/matches?created_by=${user.id}`)
      .then((res) => {
        setMatches(res.data.matches || []);
      })
      .catch((err) => {
        console.error("Failed to fetch matches:", err);
      });
  }, [user?.id]);

  // Update "now" every 30s → keeps timers live
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- Categorize Matches ---
  const liveMatches = matches.filter((m) => {
    const kickoff = new Date(m.utc_kickoff).getTime();
    const duration = Number(m.notes_json?.duration ?? 90);
    const end = kickoff + duration * 60000;
    return now.getTime() >= kickoff && now.getTime() < end;
  });

  const upcomingMatches = matches.filter((m) => {
    const kickoff = new Date(m.utc_kickoff).getTime();
    return now.getTime() < kickoff;
  });

  const pastMatches = matches.filter((m) => {
    const kickoff = new Date(m.utc_kickoff).getTime();
    const duration = Number(m.notes_json?.duration ?? 90);
    const end = kickoff + duration * 60000;
    return now.getTime() >= end;
  });

  // --- Transform for MatchList ---
  const transform = (m: Match) => {
    const kickoff = new Date(m.utc_kickoff).getTime();
    const duration = Number(m.notes_json?.duration ?? 90);
    const end = kickoff + duration * 60000;

    let status: "live" | "upcoming" | "finished";
    if (now.getTime() < kickoff) {
      status = "upcoming";
    } else if (now.getTime() >= kickoff && now.getTime() < end) {
      status = "live";
    } else {
      status = "finished";
    }

    const minute =
      status === "live"
        ? Math.min(Math.floor((now.getTime() - kickoff) / 60000), duration)
        : undefined;

    return {
      id: m.id,
      team1: m.home_team?.name || "TBD",
      team2: m.away_team?.name || "TBD",
      score:
        m.home_score != null && m.away_score != null
          ? `${m.home_score} - ${m.away_score}`
          : "",
      status,
      minute,
      date: new Date(m.utc_kickoff).toLocaleString(),
    };
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.createButton}
        onClick={() => navigate("/create-match")}
      >
        CREATE NEW MATCH
      </button>

      <MatchList
        title="CURRENT GAMES"
        matches={liveMatches.map(transform)}
        onSeeMore={(id) => navigate(`/live/${id}`)}
      />

      <MatchList
        title="UPCOMING GAMES"
        matches={upcomingMatches.map(transform)}
      />

      <MatchList title="PAST GAMES" matches={pastMatches.map(transform)} />
    </div>
  );
};

export default MyMatches;
