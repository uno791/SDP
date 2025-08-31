import React from "react";
import ComicCard from "./ComicCard";

const CrossingLongBallsCard: React.FC = () => {
  return (
    <ComicCard title="Crossing & Long Balls">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <p>11 Crosses attempted</p>
          <p>6 Accurate crosses</p>
          <p>
            <span style={{ color: "red" }}>55%</span> Cross accuracy
          </p>
          <p>39 Long balls attempted</p>
          <p>21 Accurate long balls</p>
          <p>54% Long ball accuracy</p>
        </div>
        <div>
          <p>7 Crosses attempted</p>
          <p>3 Accurate crosses</p>
          <p>
            <span style={{ color: "red" }}>43%</span> Cross accuracy
          </p>
          <p>28 Long balls attempted</p>
          <p>18 Accurate long balls</p>
          <p>64% Long ball accuracy</p>
        </div>
      </div>
    </ComicCard>
  );
};

export default CrossingLongBallsCard;
