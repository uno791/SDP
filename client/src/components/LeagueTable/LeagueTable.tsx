import styles from "./LeagueTable.module.css";

type Row = { pos: number; team: string; p: number; w: number; pts: number };
export default function LeagueTable({ rows = [] as Row[] }) {
  return (
    <aside className={styles.card}>
      <h3>Premier League Table</h3>
      <div className={styles.head}>
        <span>Pos</span>
        <span>Team</span>
        <span>P</span>
        <span>W</span>
        <span>Pts</span>
      </div>
      <div className={styles.body}>
        {rows.map((r) => (
          <div className={styles.row} key={r.pos}>
            <span>{r.pos}</span>
            <span className={styles.team}>{r.team}</span>
            <span>{r.p}</span>
            <span>{r.w}</span>
            <span>{r.pts}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div className={styles.empty}>Standings not loaded</div>
        )}
      </div>
    </aside>
  );
}
