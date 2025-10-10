import type { ReactNode } from "react";

import styles from "./FPLCard.module.css";

interface FPLCardProps {
  title?: string;
  children: ReactNode;
  highlight?: boolean;
  compact?: boolean;
}

export default function FPLCard({
  title,
  children,
  highlight = false,
  compact = false,
}: FPLCardProps) {
  return (
    <div
      className={`${styles.card} ${highlight ? styles.highlight : ""} ${
        compact ? styles.compact : ""
      }`}
    >
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
