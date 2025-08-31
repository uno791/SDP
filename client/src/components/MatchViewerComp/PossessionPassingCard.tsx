import React from "react";
import ComicCard from "./ComicCard";

const PossessionPassingCard: React.FC = () => {
  return (
    <ComicCard title="Possession & Passing">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <p>
            <span style={{ color: "red" }}>68%</span> Possession
          </p>
          <p>636 Passes attempted</p>
          <p>544 Accurate passes</p>
          <p>85% Pass completion %</p>
        </div>
        <div>
          <p>
            <span style={{ color: "red" }}>32%</span> Possession
          </p>
          <p>298 Passes attempted</p>
          <p>251 Accurate passes</p>
          <p>84% Pass completion %</p>
        </div>
      </div>
    </ComicCard>
  );
};

export default PossessionPassingCard;
