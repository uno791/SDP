// src/components/LatestNews/LatestNews.tsx
import { useEffect, useState } from "react";
import { fetchEplNews } from "../../api/espn";
import type { EspnNewsResponse } from "../../api/espn";
import styles from "./LatestNews.module.css";

type UiNews = {
  title: string;
  summary?: string;
  time: string;
  link?: string;
  image?: string;
  byline?: string;
  tag?: string; // e.g. Analysis, Report
};

export default function LatestNews() {
  const [items, setItems] = useState<UiNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data: EspnNewsResponse = await fetchEplNews();

        const mapped: UiNews[] = (data.articles ?? []).map((a) => {
          const when = a.published || a.lastModified || "";
          const image = a.images?.[0]?.url;
          const tag =
            a.categories?.find((c) => c.type?.toLowerCase() !== "league")
              ?.description ?? a.type;
          return {
            title: a.headline,
            summary: a.description,
            time: when
              ? new Date(when).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "",
            link: a.links?.web?.href,
            image,
            byline: a.byline,
            tag: tag || "News",
          };
        });

        if (!cancelled) {
          setItems(mapped.slice(0, 8)); // keep it tight
          setErr(null);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load news");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className={styles.card}>
      <h3>Latest News</h3>

      {loading && <div className={styles.state}>Loading…</div>}
      {err && <div className={styles.error}>{err}</div>}

      {!loading && !err && items.length === 0 && (
        <div className={styles.state}>No headlines yet.</div>
      )}

      <div className={styles.list}>
        {items.map((n, i) => (
          <article className={styles.item} key={i}>
            {n.image && (
              <a
                href={n.link}
                target="_blank"
                rel="noreferrer"
                className={styles.thumbWrap}
              >
                <img src={n.image} alt="" className={styles.thumb} />
              </a>
            )}

            <div className={styles.content}>
              <div className={styles.metaRow}>
                <span className={styles.tag}>{n.tag ?? "News"}</span>
                <span className={styles.time}>{n.time}</span>
              </div>

              <h4 className={styles.title}>
                {n.link ? (
                  <a href={n.link} target="_blank" rel="noreferrer">
                    {n.title}
                  </a>
                ) : (
                  n.title
                )}
              </h4>

              {n.byline && <div className={styles.byline}>{n.byline}</div>}
              {n.summary && <p className={styles.summary}>{n.summary}</p>}
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
