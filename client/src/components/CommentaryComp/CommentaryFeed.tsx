import React, { useMemo, useRef, useEffect, useState } from "react";
import styles from "./CommentaryFeed.module.css";
import CommentaryItem from "./CommentaryItem";
import type { CommentaryEvent } from "./types";

export default function CommentaryFeed({
  loading,
  error,
  events,
  matchId,
  latestFirst = true,
}: {
  loading: boolean;
  error: string | null;
  events: CommentaryEvent[];
  matchId: string;
  latestFirst?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoStick, setAutoStick] = useState(true);

  const sorted = useMemo(() => {
    const arr = [...events];
    arr.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
    return latestFirst ? arr.reverse() : arr;
  }, [events, latestFirst]);

  useEffect(() => {
    if (!autoStick) return;
    const el = containerRef.current;
    if (!el) return;
    // Jump to top (latest) if latestFirst; otherwise, to bottom
    el.scrollTo({
      top: latestFirst ? 0 : el.scrollHeight,
      behavior: "instant" as ScrollBehavior,
    });
  }, [sorted.length, autoStick, latestFirst]);

  return (
    <section className={styles.wrap} aria-label="Live commentary">
      <header className={styles.header}>
        <h2 className={styles.title}>Play-by-Play</h2>
        <div className={styles.controls}>
          <label className={styles.chk}>
            <input
              type="checkbox"
              checked={autoStick}
              onChange={(e) => setAutoStick(e.target.checked)}
            />
            Auto-jump to {latestFirst ? "latest" : "newest"}
          </label>
        </div>
      </header>

      {loading && <p className={styles.state}>Loading commentary…</p>}
      {error && <p className={`${styles.state} ${styles.error}`}>{error}</p>}
      {!loading && !error && sorted.length === 0 && (
        <p className={styles.state}>No commentary available.</p>
      )}

      <section
        ref={containerRef}
        className={styles.feed}
        aria-live="polite"
        aria-relevant="additions text"
      >
        <ul className={styles.list}>
          {sorted.map((ev, idx) => (
            <CommentaryItem key={`${matchId}-${idx}`} ev={ev} />
          ))}
        </ul>
      </section>
    </section>
  );
}
