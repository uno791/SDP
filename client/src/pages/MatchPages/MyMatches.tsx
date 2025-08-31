import { useNavigate } from "react-router-dom";
import styles from "./MyMatches.module.css";
import MatchList from "../../components/MatchPageComp/MatchList";

// Define the Match type
type Match = {
  id: number;
  team1: string;
  team2: string;
  score: string;
  status: "live" | "upcoming" | "finished";
  minute?: number;
  date?: string;
};

// Dummy matches typed as Match[]
const dummyMatches: Match[] = [
  {
    id: 1,
    team1: "Liverpool",
    team2: "Man United",
    score: "0 - 1",
    status: "live",
    minute: 67,
  },
  {
    id: 2,
    team1: "Arsenal",
    team2: "Chelsea",
    score: "0 - 10",
    status: "live",
    minute: 23,
  },
  {
    id: 3,
    team1: "Tenko",
    team2: "Houdini",
    score: "",
    status: "upcoming",
    date: "05/10/2025 16:00",
  },
  {
    id: 4,
    team1: "Liverpool",
    team2: "Man United",
    score: "0 - 1",
    status: "finished",
    date: "07/08/2025",
  },
  {
    id: 5,
    team1: "Arsenal",
    team2: "Chelsea",
    score: "0 - 10",
    status: "finished",
    date: "07/08/2025",
  },
  {
    id: 6,
    team1: "Man City",
    team2: "Wolves",
    score: "0 - 10",
    status: "finished",
    date: "07/08/2025",
  },
];

const MyMatches = () => {
  const navigate = useNavigate();

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
        matches={dummyMatches.filter((m) => m.status === "live")}
        onSeeMore={(id) => navigate(`/live/${id}`)}
      />

      <MatchList
        title="UPCOMING GAMES"
        matches={dummyMatches.filter((m) => m.status === "upcoming")}
      />

      <MatchList
        title="PAST GAMES"
        matches={dummyMatches.filter((m) => m.status === "finished")}
      />
    </div>
  );
};

export default MyMatches;
