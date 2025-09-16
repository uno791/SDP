import React from "react";
import styles from "./NewsCard.module.css";

type Props = {
  title: string;
  summary: string;
};

export default function NewsCard({ title, summary }: Props) {
  return (
    <div className={styles.card}>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.summary}>{summary}</p>
    </div>
  );
}
