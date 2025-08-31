import React from "react";
import styles from "./TriStatRow.module.css";

type Props = {
  label: string;
  left?: React.ReactNode;   // home value
  right?: React.ReactNode;  // away value
  className?: string;
};

export default function TriStatRow({ label, left, right, className }: Props) {
  return (
    <div className={`${styles.row} ${className || ""}`}>
      <div className={styles.left}>{left ?? "—"}</div>
      <div className={styles.label}>{label}</div>
      <div className={styles.right}>{right ?? "—"}</div>
    </div>
  );
}
