import React from "react";
import styles from "../../pages/FootballHomePage.module.css";
import LiveLeagueGames from "./LiveLeagueGames";
import PastLeagueGames from "./PastLeagueGames";
import LiveStreams from "./LiveStreams";

export default function MainColumn() {
  return (
    <section className={styles.mainContent} aria-label="Main content">
      <LiveLeagueGames />
      <PastLeagueGames />
      <LiveStreams />
    </section>
  );
}
