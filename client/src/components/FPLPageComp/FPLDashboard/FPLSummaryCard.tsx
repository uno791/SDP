import styles from "./FPLSummaryCard.module.css";

export default function FPLSummaryCard({ data }: { data: any }) {
  const latest = data.current[data.current.length - 1];
  const totalPoints = data.current.reduce(
    (acc: number, gw: any) => acc + gw.points,
    0
  );

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Gameweek {latest.event}</h2>
      <div className={styles.summaryRow}>
        <div className={styles.statBox}>
          <h3>{latest.points}</h3>
          <p>GW Points</p>
        </div>
        <div className={styles.statBox}>
          <h3>{latest.overall_rank.toLocaleString()}</h3>
          <p>Overall Rank</p>
        </div>
        <div className={styles.statBox}>
          <h3>{totalPoints}</h3>
          <p>Total Points</p>
        </div>
      </div>

      <div className={styles.extraRow}>
        <div className={styles.statSmall}>
          <span>Transfers:</span> {latest.event_transfers}
        </div>
        <div className={styles.statSmall}>
          <span>Hits:</span> {latest.event_transfers_cost}
        </div>
      </div>
    </div>
  );
}
