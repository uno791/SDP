import React from "react";
import ComicCard from "./ComicCard";
import TriStatRow from "./TriStatRow";

const PossessionPassingCard: React.FC = () => {
  return (
    <ComicCard title="Possession & Passing">
      <TriStatRow label="Possession"            left={<b>68%</b>} right={<b>32%</b>} />
      <TriStatRow label="Passes attempted"      left={<b>636</b>}  right={<b>298</b>} />
      <TriStatRow label="Accurate passes"       left={<b>544</b>}  right={<b>251</b>} />
      <TriStatRow label="Pass completion %"     left={<b>85%</b>}  right={<b>84%</b>} />
    </ComicCard>
  );
};

export default PossessionPassingCard;
