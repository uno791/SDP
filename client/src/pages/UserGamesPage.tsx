import React from "react";
import LiveUserMatches from "../components/LandingPageComp/LiveUserMatches";
import UserMatches from "../components/LandingPageComp/UserMatches";
import styles from "./UserGamesPage.module.css";

export default function UserGamesPage() {
  return (
    <div className={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');
      `}</style>

      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>User Games</h1>
          <p className={styles.heroSubtitle}>
            Keep track of every community fixture, from live action to the games
            you have scheduled next.
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <LiveUserMatches />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <UserMatches />
          </div>
        </section>
      </main>
    </div>
  );
}
