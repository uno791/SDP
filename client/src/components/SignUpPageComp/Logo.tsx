import React from "react";
import styles from "./Logo.module.css";

export function Logo() {
  return (
    <div className={styles.logoWrapper}>
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/1a11f6d3a8d98507c785e04a753d4fdc239842c7"
        alt="Localish logo"
        className={styles.logoImage}
      />
    </div>
  );
}
