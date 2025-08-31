import React from "react";
import GameSummaryCard from "./GameSummaryCard";
import DisciplineFoulsCard from "./DisciplineFoulsCard";
import SetPiecesSavesCard from "./SetPiecesSavesCard";
import PossessionPassingCard from "./PossessionPassingCard";
import ShootingCard from "./ShootingCard";
import CrossingLongBallsCard from "./CrossingLongBallsCard";
import DefensiveActionsCard from "./DefensiveActionsCard";
import PlayerStatsCard from "./PlayerStatsCard";
import ComicCard from "./ComicCard";

const MatchViewer: React.FC = () => {
  return (
    <ComicCard>
      <div style={{ padding: "1rem" }}>
        <h1
          style={{
            fontWeight: "bold",
            fontSize: "1.5rem",
            marginBottom: "1rem",
          }}
        >
          Match Statistics
        </h1>

        <GameSummaryCard />

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <button
            style={{
              border: "2px solid black",
              background: "orange",
              padding: "4px 8px",
            }}
          >
            Team Stats
          </button>
          <button
            style={{
              border: "2px solid black",
              background: "white",
              padding: "4px 8px",
            }}
          >
            Player Stats
          </button>
        </div>

        <DisciplineFoulsCard />
        <SetPiecesSavesCard />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <PossessionPassingCard />
          <ShootingCard />
          <CrossingLongBallsCard />
          <DefensiveActionsCard />
        </div>

        <PlayerStatsCard />
      </div>
    </ComicCard>
  );
};

export default MatchViewer;
