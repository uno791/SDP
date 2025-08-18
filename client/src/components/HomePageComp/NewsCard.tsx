import React from "react";
import styles from "../../pages/FootballHomePage.module.css";

type Props = {
  tag: string;
  timeAgo: string;
  title?: string;
  text: string;
};

export default function NewsCard({ tag, timeAgo, title, text }: Props) {
  return (
    <article className={styles.newsCard}>
      <header className={styles.newsHeader}>
        <div className={styles.newsTag}>{tag}</div>
        <span className={styles.newsTime}>{timeAgo}</span>
      </header>
      {title && <h4 className={styles.newsTitle2}>{title}</h4>}
      <p className={styles.newsText}>{text}</p>
    </article>
  );
}
