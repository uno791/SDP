import styles from "./StatsBar.module.css";

type Props = {
  label: string;
  percent?: number; // home team percent (0-100)
  rightLabel?: string; // optional override for the right-side number
  ariaLabel?: string;
};

export default function StatsBar({
  label,
  percent,
  rightLabel,
  ariaLabel,
}: Props) {
  const width = Math.max(0, Math.min(100, percent ?? 0));
  return (
    <div className={styles.wrap} aria-label={ariaLabel ?? label}>
      <div className={styles.row}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>
          {rightLabel ?? (percent !== undefined ? `${width}%` : "—")}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
