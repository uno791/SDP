import React from "react";
import styles from "../../pages/FootballHomePage.module.css";

export default function Footer() {
  return (
    <footer className={styles.footerSection}>
      <div className={styles.footerMain}>
        <div className={styles.footerContent}>
          <div className={styles.ctaBox}>NEVER MISS A MOMENT!</div>
          <p className={styles.ctaText}>
            Join millions of Premier League fans getting live updates, scores, and highlights
          </p>
          <div className={styles.ctaButtons}>
            <button type="button" className={styles.signUpButton}>SIGN UP FREE</button>
            <button type="button" className={styles.loginButton}>LOG IN</button>
          </div>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <small className={styles.copyright}>
          © 2024 Premier League Live Feed. All rights reserved. POW! BAM! FOOTBALL!
        </small>
      </div>
    </footer>
  );
}
