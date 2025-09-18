// components/LandingPageComp/NewsCard.tsx
import { useEffect, useState } from "react";
import styles from "./NewsCard.module.css";
import { fetchEplNews } from "../../api/espn";
// If your espn.ts exports a type, you can import it too:
// import type { EspnNewsResponse } from "../../api/espn";

type UiNews = {
  title: string;
  summary?: string;
  time: string;
  link?: string;
  image?: string;
  byline?: string;
  tag?: string; // e.g. Analysis, Report
};

export default function NewsCard() {
  const [items, setItems] = useState<UiNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        // Expecting fetchEplNews() in api/espn.ts to return ESPN-like news payload
        const data: any = await fetchEplNews();

        const mapped: UiNews[] = (data?.articles ?? []).map((a: any) => {
          const when = a.published || a.lastModified || a.updated || "";
          const image =
            a.images?.[0]?.url ||
            a.images?.[0]?.href ||
            a.images?.[0]?.src ||
            undefined;

          // Prefer a non-league category as a tag if present, else fallback to type
          const tag =
            a.categories?.find(
              (c: any) => (c?.type || "").toLowerCase() !== "league"
            )?.description ||
            a.type ||
            "News";

          return {
            title: a.headline || a.title || "",
            summary: a.description || a.summary,
            time: when
              ? new Date(when).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "",
            link: a.links?.web?.href || a.links?.self?.href,
            image,
            byline: a.byline,
            tag,
          };
        });

        if (!cancelled) {
          // keep it tight but useful
          setItems(mapped.slice(0, 9));
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
      <div className={styles.header}>
        <h3></h3>
      </div>

      {loading && <div className={styles.state}>Loading…</div>}
      {err && <div className={styles.error}>{err}</div>}
      {!loading && !err && items.length === 0 && (
        <div className={styles.state}>No headlines yet.</div>
      )}

      <div className={styles.list}>
        {items.map((n, i) => (
          <article className={styles.item} key={i}>
            {n.image ? (
              <a
                href={n.link}
                target="_blank"
                rel="noreferrer"
                className={styles.thumbWrap}
                aria-label={n.title}
              >
                <img src={n.image} alt="" className={styles.thumb} />
              </a>
            ) : (
              <div className={styles.thumbWrap} />
            )}

            <div className={styles.content}>
              <div className={styles.metaRow}>
                <span className={styles.tag}>{n.tag ?? "News"}</span>
                {n.time && <span className={styles.time}>{n.time}</span>}
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
