import { useEffect, useState } from "react";
import { fetchScoreboard } from "../../api/espn";
import type { ScoreboardResponse } from "../../api/espn";
import styles from "./LatestNews.module.css";

type Item = { title: string; time: string; body?: string };

export default function LatestNews() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetchScoreboard(new Date())
      .then((sb: ScoreboardResponse) => {
        const list: Item[] = [];
        (sb.events ?? []).forEach((e) => {
          (e.headlines ?? []).forEach((h) => {
            list.push({
              title: h.shortLinkText || (e.shortName ?? "Update"),
              time: new Date(h.lastModified).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              body: h.description,
            });
          });
        });
        setItems(list.slice(0, 6));
      })
      .catch(console.error);
  }, []);

  return (
    <aside className={styles.card}>
      <h3>Latest News</h3>
      <div className={styles.list}>
        {items.map((it, i) => (
          <article className={styles.item} key={i}>
            <div className={styles.tag}>Update</div>
            <div className={styles.time}>{it.time}</div>
            <h4>{it.title}</h4>
            {it.body && <p>{it.body}</p>}
          </article>
        ))}
        {items.length === 0 && (
          <div className={styles.empty}>No headlines yet.</div>
        )}
      </div>
    </aside>
  );
}
