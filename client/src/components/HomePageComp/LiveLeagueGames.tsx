import React from "react";
import styles from "../../pages/FootballHomePage.module.css";
import MatchCard from "./MatchCard";

export default function LiveLeagueGames() {
  return (
    <section className={styles.liveGamesSection} aria-labelledby="live-games-title">
      <header className={styles.sectionHeader}>
        <div className={styles.headerLeft}>
          <h2 id="live-games-title" className={styles.sectionTitle}>
            LIVE LEAGUE GAMES
          </h2>
          <time className={styles.sectionDate} dateTime="2025-08-18">
            Monday 18 August
          </time>
        </div>

        <div className={styles.dateControls} role="group" aria-label="Change date">
          <button type="button" className={styles.dateArrow} aria-label="Previous day">←</button>
          <div className={styles.dateSelector}>
            <label className={styles.dateLabel} htmlFor="date-input">Date</label>
            <div id="date-input" className={styles.dateInput} role="textbox" aria-readonly="true" />
          </div>
          <button type="button" className={styles.dateArrow} aria-label="Next day">→</button>
        </div>
      </header>

      {/* Cards mirror your originals */}
      <MatchCard
        homeTeam="Liverpool"
        awayTeam="Man United"
        scoreText="0 - 1"
        minuteText="67'"
        isLive
        starredRight
      />
      <MatchCard
        homeTeam="Arsenal"
        awayTeam="Chelsea"
        scoreText="0 - 10"
        minuteText="23'"
        isLive
        compact
        starredRight
      />
    </section>
  );
}
