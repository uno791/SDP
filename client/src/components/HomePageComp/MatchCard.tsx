import React from "react";
import styles from "../../pages/FootballHomePage.module.css";

type Props = {
  homeTeam: string;
  awayTeam: string;
  scoreText: string; // e.g. "0 - 1"
  minuteText?: string; // e.g. "67'"
  isLive?: boolean;
  compact?: boolean;   // switches to the horizontal layout
  starredRight?: boolean;
};

export default function MatchCard({
  homeTeam,
  awayTeam,
  scoreText,
  minuteText,
  isLive = false,
  compact = false,
  starredRight = false,
}: Props) {
  if (compact) {
    return (
      <article className={styles.matchCard} aria-live={isLive ? "polite" : "off"}>
        <div className={styles.matchInfoHorizontal}>
          <span className={styles.teamName}>{homeTeam}</span>
          {isLive && <div className={styles.liveTag}>LIVE</div>}
          <div className={styles.scoreGroup}>
            <span className={styles.score}>{scoreText}</span>
            {minuteText && <span className={styles.matchTime}>{minuteText}</span>}
          </div>
          <div className={styles.teamEndGroup}>
            <span className={styles.teamName}>{awayTeam}</span>
            {starredRight && <div className={styles.starTag} title="Starred">★</div>}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={styles.matchCard} aria-live={isLive ? "polite" : "off"}>
      <div className={styles.matchInfo}>
        <div className={styles.teamLeft}>
          <span className={styles.teamName}>{homeTeam}</span>
          {isLive && <div className={styles.liveTag}>LIVE</div>}
        </div>
        <div className={styles.scoreSection}>
          <span className={styles.score}>{scoreText}</span>
          {minuteText && <span className={styles.matchTime}>{minuteText}</span>}
        </div>
        <div className={styles.teamRight}>
          <span className={styles.teamName}>{awayTeam}</span>
          {starredRight && <div className={styles.starTag} title="Starred">★</div>}
        </div>
      </div>
    </article>
  );
}
