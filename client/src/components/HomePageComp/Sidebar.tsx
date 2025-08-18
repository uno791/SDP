import React from "react";
import styles from "../../pages/FootballHomePage.module.css";
import LeagueTable from "./LeagueTable";
import LatestNews from "./LatestNews";

export default function Sidebar() {
  return (
    <aside className={styles.sidebar} aria-label="Sidebar">
      <LeagueTable />
      <LatestNews />
    </aside>
  );
}
