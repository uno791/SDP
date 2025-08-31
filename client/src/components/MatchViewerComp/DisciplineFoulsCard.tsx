import React from "react";
import ComicCard from "./ComicCard";
import TriStatRow from "./TriStatRow";

const DisciplineFoulsCard: React.FC = () => {
  return (
    <ComicCard title="Discipline & Fouls">
      <TriStatRow label="Fouls committed" left={<b>11</b>} right={<b>8</b>} />
      <TriStatRow label="Yellow cards"     left={<b>0</b>}  right={<b>2</b>} />
      <TriStatRow label="Red cards"        left={<b>0</b>}  right={<b>0</b>} />
      <TriStatRow label="Offsides"         left={<b>5</b>}  right={<b>2</b>} />
    </ComicCard>
  );
};

export default DisciplineFoulsCard;
