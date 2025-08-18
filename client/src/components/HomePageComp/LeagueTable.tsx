import React from "react";
import styles from "../../pages/FootballHomePage.module.css";

export default function LeagueTable() {
  return (
    <section className={styles.leagueTableSection} aria-labelledby="league-table-title">
      <h3 id="league-table-title" className={styles.tableTitle}>PREMIER LEAGUE TABLE</h3>

      <div className={styles.tableHeader} role="row">
        <div className={styles.headerLeft} role="columnheader" aria-label="Position and Team">
          <span>POS</span>
          <span>TEAM</span>
        </div>
        <div className={styles.headerRight} role="columnheader" aria-label="Played, Wins, Points">
          <span>P</span>
          <span>W</span>
          <span>PTS</span>
        </div>
      </div>

      <div className={`${styles.tableRow} ${styles.topTeam}`} role="row">
        <span>1</span>
        <div className={styles.teamInfo}>
          <span>Man United</span>
          <span>20</span>
        </div>
        <div className={styles.stats}>
          <span>20</span>
          <span>72</span>
        </div>
      </div>

      <div className={`${styles.tableRow} ${styles.topTeam}`} role="row">
        <span>2</span>
        <span>Arsenal</span>
        <span>20</span>
        <span>13</span>
        <span>43</span>
      </div>

      <div className={styles.tableRow} role="row">
        <span>3</span>
        <div className={styles.teamStats}>
          <span>Man City</span>
          <span>19</span>
          <span>12</span>
          <span>40</span>
        </div>
      </div>

      <div className={styles.tableRow} role="row">
        <span>4</span>
        <span className={styles.teamNameCell}>Aston Villa</span>
        <div className={styles.teamStatsGroup}>
          <span>20</span>
          <span>12</span>
          <span>39</span>
        </div>
      </div>

      <div className={styles.tableRow} role="row">
        <span>5</span>
        <span>Tottenham</span>
        <span>20</span>
        <span>11</span>
        <span>36</span>
      </div>

      <div className={styles.tableRow} role="row">
        <span>6</span>
        <span>Liverpool</span>
        <span>20</span>
        <span>10</span>
        <span>33</span>
      </div>
    </section>
  );
}
