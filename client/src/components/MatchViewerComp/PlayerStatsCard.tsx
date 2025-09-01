import React from "react";
import ComicCard from "./ComicCard";

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
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "#123456", color: "white" }}>
          <tr>
            <th style={{ padding: "8px", border: "1px solid black" }}>
              Player
            </th>
            <th style={{ padding: "8px", border: "1px solid black" }}>Pos</th>
            <th style={{ padding: "8px", border: "1px solid black" }}>Goals</th>
            <th style={{ padding: "8px", border: "1px solid black" }}>
              Assists
            </th>
            <th style={{ padding: "8px", border: "1px solid black" }}>Shots</th>
            <th style={{ padding: "8px", border: "1px solid black" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, idx) => (
            <tr key={idx}>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {p.name}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {p.pos}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {p.goals}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {p.assists}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {p.shots}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                <button
                  style={{
                    border: "2px solid black",
                    background: "orange",
                    padding: "4px 8px",
                  }}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ComicCard>
  );
};

export default PlayerStatsCard;
