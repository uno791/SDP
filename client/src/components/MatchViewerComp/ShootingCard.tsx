import React from "react";
import ComicCard from "./ComicCard";
import TriStatRow from "./TriStatRow";

const ShootingCard: React.FC = () => {
  return (
    <ComicCard title="Shooting">
      <TriStatRow label="Total shots"        left={<b>13</b>} right={<b>8</b>} />
      <TriStatRow label="Shots on target"    left={<b>6</b>}  right={<b>3</b>} />
      {/* Removed On-target % */}
      <TriStatRow label="Blocked shots"      left={<b>5</b>}  right={<b>2</b>} />
      <TriStatRow label="Penalty kicks taken" left={<b>1</b>} right={<b>0</b>} />
      <TriStatRow label="Penalty goals"      left={<b>1</b>}  right={<b>0</b>} />
    </ComicCard>
  );
};

export default ShootingCard;
