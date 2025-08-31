import React from "react";
import ComicCard from "./ComicCard";

const GameSummaryCard: React.FC = () => {
  return (
    <ComicCard>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Liverpool</h2>
        <div>
          <h1>0 - 1</h1>
          <span
            style={{
              background: "orange",
              padding: "2px 6px",
              fontSize: "0.8rem",
              marginRight: "5px",
            }}
          >
            FULL TIME
          </span>
          <span style={{ fontSize: "0.8rem" }}>90+3'</span>
        </div>
        <h2>Man United</h2>
      </div>
    </ComicCard>
  );
};

export default GameSummaryCard;
