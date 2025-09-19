import React from "react";
import PlayerTable, { type PlayerRow } from "./PlayerTable";

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
    <section style={{ marginBottom: compact ? 20 : 28 }}>
      <h2 style={{ margin: "0 0 8px" }}>{teamName}</h2>

      <PlayerTable title="Starting XI" rows={starters} />
      <PlayerTable title="Substitutes" rows={subs} />
    </section>
  );
}
