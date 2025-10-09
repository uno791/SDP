import React from "react";
import styles from "./Loader3D.module.css";

const SEGMENTS = 9;

export default function Loader3D() {
  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.loader} aria-hidden="true">
        {Array.from({ length: SEGMENTS }).map((_, idx) => (
          <div key={idx} className={styles.text}>
            <span>Loading</span>
          </div>
        ))}
        <div className={styles.line} />
      </div>
      <span className={styles.visuallyHidden}>Loading FootBook</span>
    </div>
  );
}
