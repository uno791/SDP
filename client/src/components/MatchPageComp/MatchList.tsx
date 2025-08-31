import styles from "./MatchList.module.css";
import MatchCard from "./MatchCard";

type Match = {
  id: number;
  team1: string;
  team2: string;
  score: string;
  status: "live" | "upcoming" | "finished";
  minute?: number;
  date?: string;
};

interface Props {
  title: string;
  matches: Match[];
  onSeeMore?: (id: number) => void;
}

const MatchList = ({ title, matches, onSeeMore }: Props) => {
  return (
    <div className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} onSeeMore={onSeeMore} />
      ))}
    </div>
  );
};

export default MatchList;
