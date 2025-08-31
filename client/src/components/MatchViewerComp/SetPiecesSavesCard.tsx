import React from "react";
import ComicCard from "./ComicCard";

const SetPiecesSavesCard: React.FC = () => {
  return (
    <ComicCard title="Set Pieces & Saves">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <p>
            <strong>4</strong> Corner kicks won
          </p>
          <p>
            <strong>4</strong> Saves made (by GK)
          </p>
        </div>
        <div>
          <p>
            <strong>6</strong> Corner kicks won
          </p>
          <p>
            <strong>1</strong> Saves made (by GK)
          </p>
        </div>
      </div>
    </ComicCard>
  );
};

export default SetPiecesSavesCard;
