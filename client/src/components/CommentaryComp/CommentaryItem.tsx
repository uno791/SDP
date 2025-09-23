import React from "react";
import styles from "./CommentaryItem.module.css";
import type { CommentaryEvent } from "./types";

function minuteBadge(
  minute?: number,
  minuteText?: string,
  kind?: CommentaryEvent["kind"]
) {
  // ⬅️ Hide minute badge for full-time
  if (kind === "ft") return "";

  if (minuteText) return minuteText;
  if (typeof minute === "number") {
    if (minute > 90) return `90+${minute - 90}’`;
    return `${minute}’`;
  }
  return "—";
}

function kindLabel(kind: CommentaryEvent["kind"]) {
  switch (kind) {
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
    case "kickoff": return "Kick-off";
    case "ht": return "Half-time";
    case "ft": return "Full-time";
    case "period": return "Period";
    default: return "Update";
  }
}


export default function CommentaryItem({ ev }: { ev: CommentaryEvent }) {
  const minute = minuteBadge(ev.minute, ev.minuteText, ev.kind);
  const sideClass =
    ev.side === "home" ? styles.home : ev.side === "away" ? styles.away : styles.neutral;

  return (
    <li className={`${styles.item} ${sideClass}`}>
      <section className={styles.row} aria-label="Commentary entry">
        <aside className={styles.minute} aria-label="Match minute">
          {minute}
        </aside>
        <article className={styles.body}>
          <header className={styles.line1}>
            <span className={`${styles.tag} ${styles[ev.kind]}`}>
              {kindLabel(ev.kind)}
            </span>
            <span className={styles.text}>{ev.text}</span>
          </header>
          {ev.detail && <p className={styles.detail}>{ev.detail}</p>}
        </article>
      </section>
    </li>
  );
}
