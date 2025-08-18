import styles from "./StatDualCount.module.css";

type Props = {
  label: string;
  leftTag?: string; // e.g., home team abbr
  leftValue?: number;
  rightTag?: string; // away team abbr
  rightValue?: number;
};

export default function StatDualCount({
  label,
  leftTag,
  leftValue,
  rightTag,
  rightValue,
}: Props) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>
      <div className={styles.counts}>
        <span className={styles.badge}>
          {leftTag && <b className={styles.tag}>{leftTag}</b>}{" "}
          {leftValue ?? "–"}
        </span>
        <span className={styles.sep}>•</span>
        <span className={styles.badge}>
          {rightTag && <b className={styles.tag}>{rightTag}</b>}{" "}
          {rightValue ?? "–"}
        </span>
      </div>
    </div>
  );
}
