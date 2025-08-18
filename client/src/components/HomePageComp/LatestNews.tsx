import React from "react";
import styles from "../../pages/FootballHomePage.module.css";
import NewsCard from "./NewsCard";

export default function LatestNews() {
  return (
    <section className={styles.newsSection} aria-labelledby="latest-news-title">
      <h3 id="latest-news-title" className={styles.newsTitle}>LATEST NEWS</h3>

      <NewsCard
        tag="MATCH REPORT"
        timeAgo="2 hours ago"
        title="Liverpool Extend Lead at Top After Victory Over United"
        text="The Reds secured a crucial 2-1 win at Anfield to maintain their position at the summit of the Premier League table."
      />

      <NewsCard
        tag="TRANSFERS"
        timeAgo="4 hours ago"
        text="The Gunners have completed the signing of a promising young forward to bolster their attacking options."
      />

      <NewsCard
        tag="ANALYSIS"
        timeAgo="6 hours ago"
        title="VAR Controversy Rocks Premier League Weekend"
        text="Several contentious decisions have sparked debate among fans and pundits across multiple fixtures."
      />
    </section>
  );
}
