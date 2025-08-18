import styles from "./MatchCard.module.css";

type Team = { name: string; score?: string; logo?: string };
type Props = {
  id: string;
  home: Team;
  away: Team;
  state: "pre" | "in" | "post";
  statusText: string; // e.g. "67’", "FT", or kickoff time
  isFavourite?: boolean;
};

export default function MatchCard({ home, away, state, statusText }: Props) {
  return (
    <div className={styles.card} data-state={state}>
      <div className={styles.row}>
        <div className={styles.team}>
          {home.logo && <img src={home.logo} alt="" className={styles.logo} />}
          <span>{home.name}</span>
        </div>

        <div className={styles.center}>
          <span className={styles.score}>
            {(away.score ?? "") !== "" || (home.score ?? "") !== "" ? (
              <>
                <b>{home.score ?? "-"}</b>{" "}
                <span className={styles.hyphen}>-</span>{" "}
                <b>{away.score ?? "-"}</b>
              </>
            ) : (
              <span className={styles.vs}>vs</span>
            )}
          </span>
          <span className={styles.status}>{statusText}</span>
        </div>

        <div className={styles.team + " " + styles.right}>
          {away.logo && <img src={away.logo} alt="" className={styles.logo} />}
          <span>{away.name}</span>
        </div>
      </div>
    </div>
  );
}
