import styles from "./MatchCard.module.css";

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
  match: Match;
  onSeeMore?: (id: number) => void;
}

const MatchCard = ({ match, onSeeMore }: Props) => {
  return (
    <div className={styles.card}>
      <div className={styles.team}>{match.team1}</div>

      <div className={styles.center}>
        {match.status === "live" && <span className={styles.live}>LIVE</span>}
        {match.status === "finished" && (
          <span className={styles.finished}>FINISHED {match.date}</span>
        )}
        {match.status === "upcoming" && (
          <span className={styles.upcoming}>{match.date}</span>
        )}
      </div>

      <div className={styles.score}>
        {match.score}
        {match.status === "live" && (
          <span className={styles.minute}>{match.minute}'</span>
        )}
      </div>

      <div className={styles.team}>{match.team2}</div>

      <button
        className={styles.moreButton}
        onClick={() => onSeeMore && onSeeMore(match.id)}
      >
        See More
      </button>
    </div>
  );
};

export default MatchCard;
