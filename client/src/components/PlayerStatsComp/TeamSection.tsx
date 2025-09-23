import React from "react";
import PlayerTable, { type PlayerRow } from "./PlayerTable";
import styles from "./TeamSection.module.css";

export default function TeamSection({
  teamName,
  starters,
  subs,
  compact = false,
}: {
  teamName: string;
  starters: PlayerRow[];
  subs: PlayerRow[];
  compact?: boolean;
}) {
  return (
    <section className={compact ? styles.sectionCompact : styles.section}>
      <h2 className={styles.teamName}>{teamName}</h2>

      <PlayerTable title="Starting XI" rows={starters} />
      <PlayerTable title="Substitutes" rows={subs} />
    </section>
  );
}
