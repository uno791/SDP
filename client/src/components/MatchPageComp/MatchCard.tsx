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
  onDelete?: (id: number) => void;
}

const MatchCard = ({ match, onSeeMore, onDelete }: Props) => {
  const scoreDisplay =
    match.score && match.score.trim() !== "" ? match.score : "–";

  let badgeClass = styles.badgeUpcoming;
  let badgeLabel = "Upcoming";
  let timelineCopy = match.date
    ? `Kickoff - ${match.date}`
    : "Awaiting kickoff";

  if (match.status === "live") {
    badgeClass = styles.badgeLive;
    badgeLabel = "Live";
    timelineCopy = match.date ? `Started - ${match.date}` : "In progress";
  } else if (match.status === "finished") {
    badgeClass = styles.badgeFinished;
    badgeLabel = "Final";
    timelineCopy = match.date ? `Full time - ${match.date}` : "Full time";
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.matchup}>
          <span className={styles.teamName}>{match.team1}</span>
          <span className={styles.vs}>vs</span>
          <span className={styles.teamName}>{match.team2}</span>
        </div>

        <div className={styles.scoreBlock}>
          <span className={styles.score}>{scoreDisplay}</span>
          {match.status === "live" && match.minute != null && (
            <span className={styles.scoreMeta}>{`${match.minute}'`}</span>
          )}
        </div>
      </div>

      <div className={styles.meta}>
        <span className={`${styles.badge} ${badgeClass}`}>{badgeLabel}</span>
        <span className={styles.timeline}>{timelineCopy}</span>

        <div className={styles.actions}>
          {/* Only show See More for live & upcoming matches */}
          {(match.status === "live" || match.status === "upcoming") &&
            onSeeMore && (
              <button
                className={styles.moreButton}
                onClick={() => onSeeMore(match.id)}
                type="button"
              >
                See More
              </button>
            )}

          {/* Only show Delete for upcoming matches */}
          {match.status === "upcoming" && onDelete && (
            <button
              className={styles.deleteButton}
              onClick={() => onDelete(match.id)}
              type="button"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
