import React from "react";
import ComicCard from "./ComicCard";
import TriStatRow from "./TriStatRow";

const SetPiecesSavesCard: React.FC = () => {
  return (
    <ComicCard title="Set Pieces & Saves">
      <TriStatRow label="Corner kicks won"  left={<b>4</b>} right={<b>6</b>} />
      <TriStatRow label="Saves (GK)"        left={<b>4</b>} right={<b>1</b>} />
    </ComicCard>
  );
};

export default SetPiecesSavesCard;
