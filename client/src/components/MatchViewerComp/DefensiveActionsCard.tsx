import React from "react";
import ComicCard from "./ComicCard";

const DefensiveActionsCard: React.FC = () => {
  return (
    <ComicCard title="Defensive Actions">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <p>15 Total tackles</p>
          <p>9 Effective tackles (won)</p>
          <p>
            <span style={{ color: "red" }}>60%</span> Tackle success rate
          </p>
          <p>8 Interceptions</p>
          <p>17 Clearances</p>
        </div>
        <div>
          <p>22 Total tackles</p>
          <p>16 Effective tackles (won)</p>
          <p>
            <span style={{ color: "red" }}>73%</span> Tackle success rate
          </p>
          <p>12 Interceptions</p>
          <p>24 Clearances</p>
        </div>
      </div>
    </ComicCard>
  );
};

export default DefensiveActionsCard;
