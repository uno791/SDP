import React from "react";
import styles from "./LeagueTable.module.css";

type LeagueRow = {
  pos: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: string;
  pts: number;
};

export default function LeagueTable({ data }: { data: LeagueRow[] }) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.pos}>
              <td>{row.pos}</td>
              <td>{row.team}</td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.drawn}</td>
              <td>{row.lost}</td>
              <td>{row.gd}</td>
              <td>{row.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
