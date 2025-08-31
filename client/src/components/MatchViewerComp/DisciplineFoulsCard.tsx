import React from "react";
import ComicCard from "./ComicCard";

const DisciplineFoulsCard: React.FC = () => {
  return (
    <ComicCard title="Discipline & Fouls">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <p>
            <strong>11</strong> Fouls committed
          </p>
          <p>
            <strong>0</strong> Yellow cards
          </p>
          <p>
            <strong>0</strong> Red cards
          </p>
          <p>
            <strong>5</strong> Offsides
          </p>
        </div>
        <div>
          <p>
            <strong>8</strong> Fouls committed
          </p>
          <p>
            <strong>2</strong> Yellow cards
          </p>
          <p>
            <strong>0</strong> Red cards
          </p>
          <p>
            <strong>2</strong> Offsides
          </p>
        </div>
      </div>
    </ComicCard>
  );
};

export default DisciplineFoulsCard;
