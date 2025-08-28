"use client";
import * as React from "react";
import styles from "../components/HomePageComp/SignUpPageComp/SignUpPage.module.css";
import { GoogleSignUpButton } from "../components/HomePageComp/SignUpPageComp/GoogleSignUpButton";
import { LoginPrompt } from "../components/HomePageComp/SignUpPageComp/LoginPrompt";

export default function SignUpPage() {
  return (
    <section className={styles.page}>
      <div className={styles.frame}>
        {/* collage background */}
        <div className={styles.comicGrid} aria-hidden={false}>
          {/* top row (3) */}
          <i className={`${styles.panel} ${styles.topLeft}`} />
          <i className={`${styles.panel} ${styles.topCenter}`} />
          <i className={`${styles.panel} ${styles.topRight}`} />

          {/* middle row (1 big dotted) — contains the actions */}
          <div className={`${styles.panel} ${styles.middleDotted}`}>
            <div className={styles.middleInner}>
              <GoogleSignUpButton />
              <LoginPrompt />
            </div>
          </div>

          {/* bottom row (3) */}
          <i className={`${styles.panel} ${styles.botLeft}`} />
          <i className={`${styles.panel} ${styles.botCenter}`} />
          <i className={`${styles.panel} ${styles.botRight}`} />
        </div>
      </div>
    </section>
  );
}
