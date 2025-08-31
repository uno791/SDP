import React from "react";
import ComicCard from "./ComicCard";
import TriStatRow from "./TriStatRow";

const CrossingLongBallsCard: React.FC = () => {
  return (
    <ComicCard title="Crossing & Long Balls">
      <TriStatRow label="Crosses attempted"    left={<b>11</b>} right={<b>7</b>} />
      <TriStatRow label="Accurate crosses"     left={<b>6</b>}  right={<b>3</b>} />
      {/* Removed Cross accuracy */}
      <TriStatRow label="Long balls attempted" left={<b>39</b>} right={<b>28</b>} />
      <TriStatRow label="Accurate long balls"  left={<b>21</b>} right={<b>18</b>} />
      <TriStatRow label="Long ball accuracy"   left={<b>54%</b>} right={<b>64%</b>} />
    </ComicCard>
  );
};

export default CrossingLongBallsCard;
