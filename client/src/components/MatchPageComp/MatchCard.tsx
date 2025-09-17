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
      {/* Team 1 */}
      <div className={styles.team}>{match.team1}</div>

      {/* Center info (status + date) */}
      <div className={styles.center}>
        {match.status === "live" && <span className={styles.live}>LIVE</span>}

        {match.status === "finished" && (
          <span className={styles.finished}>
            FINISHED {match.date ? `– ${match.date}` : ""}
          </span>
        )}

        {match.status === "upcoming" && (
          <span className={styles.upcoming}>
            {match.date ? `KICKOFF: ${match.date}` : "UPCOMING"}
          </span>
        )}
      </div>

      {/* Score & minute */}
      <div className={styles.score}>
        {match.score || "-"}
        {match.status === "live" && match.minute != null && (
          <span className={styles.minute}>{match.minute}'</span>
        )}
      </div>

      {/* Team 2 */}
      <div className={styles.team}>{match.team2}</div>

      {/* Action */}
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
