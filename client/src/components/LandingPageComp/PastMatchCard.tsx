import React from "react";
import styles from "./PastMatchCard.module.css";

type Props = {
  date: string;
  home: string;
  away: string;
  scoreA: number;
  scoreB: number;
};

export default function PastMatchCard({
  date,
  home,
  away,
  scoreA,
  scoreB,
}: Props) {
  return (
    <div className={styles.card}>
      <div>
        <div className={styles.matchup}>
          {home} vs {away}
        </div>
        <div className={styles.date}>{date}</div>
      </div>
      <div className={styles.score}>
        {scoreA} - {scoreB}
      </div>
    </div>
  );
}
