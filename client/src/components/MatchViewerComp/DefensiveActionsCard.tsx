import React from "react";
import ComicCard from "./ComicCard";
import TriStatRow from "./TriStatRow";

const DefensiveActionsCard: React.FC = () => {
  return (
    <ComicCard title="Defensive Actions">
      <TriStatRow label="Total tackles"        left={<b>15</b>} right={<b>22</b>} />
      <TriStatRow label="Effective tackles"    left={<b>9</b>}  right={<b>16</b>} />
      <TriStatRow label="Tackle success rate"  left={<b>60%</b>} right={<b>73%</b>} />
      <TriStatRow label="Interceptions"        left={<b>8</b>}  right={<b>12</b>} />
      {/* Removed Clearances */}
    </ComicCard>
  );
};

export default DefensiveActionsCard;
