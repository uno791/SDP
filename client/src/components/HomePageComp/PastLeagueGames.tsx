import React from "react";
import styles from "../../pages/FootballHomePage.module.css";

export default function PastLeagueGames() {
  return (
    <section className={styles.pastGamesSection} aria-labelledby="past-games-title">
      <h2 id="past-games-title" className={styles.sectionTitle}>PAST LEAGUE GAMES</h2>
      <time className={styles.sectionDate} dateTime="2025-08-18">Monday 18 August</time>

      {/* Placeholders from your layout */}
      <div className={styles.emptyMatchCard} />
      <div className={styles.emptyMatchCard} />
      <div className={styles.emptyMatchCard} />
      <div className={styles.emptyMatchCard} />
    </section>
  );
}
