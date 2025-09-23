// PlayerStatsCard.tsx
import React from "react";
import ComicCard from "./ComicCard";
import styles from "./PlayerStatsCard.module.css";

const PlayerStatsCard: React.FC = () => {
  const players = [
    { name: "Mohamed Salah", pos: "RW", goals: 2, assists: 1, shots: 4 },
    { name: "Sadio Mané", pos: "LW", goals: 1, assists: 0, shots: 3 },
    { name: "Virgil van Dijk", pos: "CB", goals: 0, assists: 0, shots: 0 },
    { name: "Jordan Henderson", pos: "CM", goals: 0, assists: 1, shots: 2 },
    { name: "Alisson Becker", pos: "GK", goals: 0, assists: 0, shots: 0 },
  ];

  return (
    <ComicCard>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Player</th>
            <th>Pos</th>
            <th>Goals</th>
            <th>Assists</th>
            <th>Shots</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, idx) => (
            <tr key={idx}>
              <td>{p.name}</td>
              <td>{p.pos}</td>
              <td>{p.goals}</td>
              <td>{p.assists}</td>
              <td>{p.shots}</td>
              <td>
                <button className={styles.detailsBtn}>View Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ComicCard>
  );
};

export default PlayerStatsCard;
