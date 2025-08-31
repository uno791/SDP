import React from "react";
import styles from "./TeamCard.module.css";

interface TeamCardProps {
  team: string;
  onRemove: (team: string) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, onRemove }) => {
  return (
    <div className={styles.card}>
      <span>{team}</span>
      <button className={styles.removeButton} onClick={() => onRemove(team)}>
        ✕
      </button>
    </div>
  );
};

export default TeamCard;
