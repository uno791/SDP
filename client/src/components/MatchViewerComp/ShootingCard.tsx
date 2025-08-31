import React from "react";
import ComicCard from "./ComicCard";

const ShootingCard: React.FC = () => {
  return (
    <ComicCard title="Shooting">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <p>13 Total shots</p>
          <p>6 Shots on target</p>
          <p>
            <span style={{ color: "red" }}>46%</span> On-target %
          </p>
          <p>5 Blocked shots</p>
          <p>1 Penalty kicks taken</p>
          <p>1 Penalty goals</p>
        </div>
        <div>
          <p>8 Total shots</p>
          <p>3 Shots on target</p>
          <p>
            <span style={{ color: "red" }}>38%</span> On-target %
          </p>
          <p>2 Blocked shots</p>
          <p>0 Penalty kicks taken</p>
          <p>0 Penalty goals</p>
        </div>
      </div>
    </ComicCard>
  );
};

export default ShootingCard;
