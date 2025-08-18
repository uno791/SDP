import React from "react";
import styles from "../../pages/FootballHomePage.module.css";
import NavItem from "./NavItem";

export default function Header() {
  return (
    <header className={styles.headerSection}>
      <div className={styles.headerContent}>
        <div className={styles.leftColumn}>
          <div className={styles.logoContainer}>
            <div className={styles.footBookLogo} aria-label="Foot Book logo">
              Foot Book
            </div>
            <div className={styles.liveButton} role="status" aria-live="polite">
              LIVE
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <nav className={styles.navigationMenu} aria-label="Primary">
            <NavItem label="HOME" active />
            <NavItem label="NEWS" />
            <NavItem label="FAVOURITE TEAMS" />
            <NavItem label="PROFILE" />
          </nav>
        </div>
      </div>
    </header>
  );
}
