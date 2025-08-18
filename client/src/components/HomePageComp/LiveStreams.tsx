import React from "react";
import styles from "../../pages/FootballHomePage.module.css";

export default function LiveStreams() {
  return (
    <section className={styles.liveStreamsSection} aria-labelledby="live-streams-title">
      <div className={styles.streamIcon} aria-hidden="true">📺</div>
      <h2 id="live-streams-title" className={styles.streamTitle}>LIVE STREAMS</h2>
    </section>
  );
}
