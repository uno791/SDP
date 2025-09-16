import React from "react";
import styles from "./LiveMatchCard.module.css";

type Props = {
  date: string;
  time: string;
  home: string;
  away: string;
  scoreA?: number;
  scoreB?: number;
  minute?: number;
};

export default function LiveMatchCard({
  date,
  time,
  home,
  away,
  scoreA = 0,
  scoreB = 0,
  minute = 0,
}: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span>{date}</span>
        <span>{time}</span>
      </div>
      <div className={styles.matchup}>
        {home} vs {away}
      </div>
      <div className={styles.scoreline}>
        <span>{home.slice(0, 3).toUpperCase()}</span>
        <span className={styles.score}>
          {scoreA} - {scoreB}
        </span>
        <span>{away.slice(0, 3).toUpperCase()}</span>
      </div>
      <div className={styles.footer}>{minute}' • Example highlights</div>
    </div>
  );
}
