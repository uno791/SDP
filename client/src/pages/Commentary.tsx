import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

import ComicCard from "../components/MatchViewerComp/ComicCard";
import styles from "../components/MatchViewerComp/MatchView.module.css";
import feedStyles from "../components/CommentaryComp/Commentary.module.css";

import {
  fetchCommentaryNormalized,
  type CommentaryEvent,
} from "../api/espn";

function minuteBadge(min?: number, text?: string, kind?: CommentaryEvent["kind"]) {
  // ⬅️ Hide minute badge for full-time
  if (kind === "ft") return "";
  if (text) return text;
  if (typeof min === "number") return min > 90 ? `90+${min - 90}’` : `${min}’`;
  return "—";
}

function kindLabel(k: CommentaryEvent["kind"]) {
  switch (k) {
    case "goal":
    case "penGoal":
    case "ownGoal": return "Goal";
    case "save": return "Save";
    case "blocked": return "Blocked"; // ⬅️ NEW
    case "card": return "Card";
    case "subst": return "Substitution";
    case "var": return "VAR";
    case "chance": return "Chance";
    case "corner": return "Corner";
    case "offside": return "Offside";
    case "foul": return "Foul";
    case "handball": return "Handball";
    case "kickoff": return "Kick-off";
    case "ht": return "Half-time";
    case "ft": return "Full-time";
    case "period": return "Period";
    default: return "Update";
  }
}

export default function Commentary() {
  const [sp] = useSearchParams();
  const eventId = sp.get("id") ?? "";

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [events, setEvents] = useState<CommentaryEvent[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!eventId) throw new Error("Missing ?id in URL");
        setLoading(true);
        setErr(null);
        const raw = await fetchCommentaryNormalized(eventId);
        if (!alive) return;
        setEvents(raw);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? String(e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [eventId]);

  // UI wants latest first
  const latestFirst = useMemo(
    () => [...events].sort((a, b) => (b.sequence ?? 0) - (a.sequence ?? 0)),
    [events]
  );

  return (
    <ComicCard>
      <div className={styles.container}>
        <div className={styles.buttonRow}>
          <Link
            to={`/matchviewer?id=${encodeURIComponent(eventId)}`}
            className={styles.playerButton}
          >
            ← Back to Match
          </Link>
        </div>

        <h1 className={styles.heading}>Commentary</h1>
        <div className={styles.subheading}>Live play-by-play</div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Play-by-Play</h2>

          {loading && <div className={feedStyles.state}>Loading commentary…</div>}
          {err && <div className={`${feedStyles.state} ${feedStyles.error}`}>Failed to load: {err}</div>}
          {!loading && !err && latestFirst.length === 0 && (
            <div className={feedStyles.state}>No commentary available.</div>
          )}

          <ul className={feedStyles.list}>
            {latestFirst.map((ev, i) => (
              <li
                key={`${ev.sequence ?? i}`}
                className={`${feedStyles.item} ${
                  ev.side === "home"
                    ? feedStyles.home
                    : ev.side === "away"
                    ? feedStyles.away
                    : feedStyles.neutral
                }`}
              >
                <div className={feedStyles.minute}>
                  {minuteBadge(ev.minute, ev.minuteText, ev.kind)}
                </div>
                <div className={feedStyles.body}>
                  <div className={feedStyles.line1}>
                    <span className={`${feedStyles.tag} ${feedStyles[ev.kind]}`}>
                      {kindLabel(ev.kind)}
                    </span>
                    <span className={feedStyles.text}>{ev.text}</span>
                  </div>
                  {ev.detail && <div className={feedStyles.detail}>{ev.detail}</div>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ComicCard>
  );
}
