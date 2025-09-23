import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./MyMatches.module.css";
import MatchList from "../../components/MatchPageComp/MatchList";
import { baseURL } from "../../config";
import { useUser } from "../../Users/UserContext";

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

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const liveMatches = matches.filter((m) => {
    if (m.status === "final") return false;
    const kickoff = new Date(m.utc_kickoff).getTime();
    const duration = Number(m.notes_json?.duration ?? 90);
    const end = kickoff + duration * 60000;
    return now.getTime() >= kickoff && now.getTime() < end;
  });

  const upcomingMatches = matches.filter((m) => {
    if (m.status === "final") return false;
    const kickoff = new Date(m.utc_kickoff).getTime();
    return now.getTime() < kickoff;
  });

  const pastMatches = matches.filter((m) => {
    if (m.status === "final") return true;
    const kickoff = new Date(m.utc_kickoff).getTime();
    const duration = Number(m.notes_json?.duration ?? 90);
    const end = kickoff + duration * 60000;
    return now.getTime() >= end;
  });

  const transform = (m: Match) => {
    const kickoff = new Date(m.utc_kickoff).getTime();
    const duration = Number(m.notes_json?.duration ?? 90);
    const end = kickoff + duration * 60000;

    let status: "live" | "upcoming" | "finished";
    if (m.status === "final" || now.getTime() >= end) {
      status = "finished";
    } else if (now.getTime() < kickoff) {
      status = "upcoming";
    } else {
      status = "live";
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
    <div className={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>Create Matches</h1>
          <p className={styles.heroSubtitle}>
            Spin up new fixtures instantly and manage everything you’ve scheduled.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            className={styles.createButton}
            onClick={() => navigate("/create-match")}
          >
            Create New Match
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.mainInner}>
          <MatchList
            title="Current Games"
            subtitle="Matches you have in play right now."
            matches={liveMatches.map(transform)}
            accent="live"
            onSeeMore={(id) => navigate(`/live/${id}`)}
          />

          <MatchList
            title="Upcoming Games"
            subtitle="Get everything lined up before kickoff."
            matches={upcomingMatches.map(transform)}
            accent="upcoming"
          />

          <MatchList
            title="Past Games"
            subtitle="Review final results from the matches you have hosted."
            matches={pastMatches.map(transform)}
            accent="past"
          />
        </div>
      </main>
    </div>
  );
};

export default MyMatches;
