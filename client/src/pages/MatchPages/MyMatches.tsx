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
};

const MyMatches = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [matches, setMatches] = useState<Match[]>([]);

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

  const now = new Date();

  // Categorize matches
  const liveMatches = matches.filter((m) => m.status === "in_progress");
  const upcomingMatches = matches.filter(
    (m) =>
      m.status === "scheduled" &&
      new Date(m.utc_kickoff).getTime() > now.getTime()
  );
  const pastMatches = matches.filter(
    (m) =>
      m.status === "final" ||
      (m.status === "scheduled" &&
        new Date(m.utc_kickoff).getTime() <= now.getTime())
  );

  // Transform for MatchList (MatchList expects team1/team2/score/etc.)
  // Transform for MatchList (MatchList expects team1/team2/score/etc.)
  const transform = (m: Match) => {
    let status: "live" | "upcoming" | "finished";

    if (m.status === "in_progress") {
      status = "live";
    } else if (m.status === "scheduled" && new Date(m.utc_kickoff) > now) {
      status = "upcoming";
    } else {
      status = "finished";
    }

    return {
      id: m.id,
      team1: m.home_team?.name || "TBD",
      team2: m.away_team?.name || "TBD",
      score:
        m.home_score != null && m.away_score != null
          ? `${m.home_score} - ${m.away_score}`
          : "",
      status, // ✅ now correctly typed
      minute: m.minute ?? undefined,
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
