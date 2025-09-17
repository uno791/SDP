import React from "react";
import styles from "./MarqueeWide.module.css";

export default function MarqueeWide({ words }: { words: string[] }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.marquee}>
        {words.concat(words).map((w, i) => (
          <span key={i} className={styles.item}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
