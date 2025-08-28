// src/components/StatsBar/StatsBar.tsx
import styles from "./StatsBar.module.css";

type Props = {
  label: string;
  /** left/home numeric value to display */
  leftValue?: number;
  /** right/away numeric value to display */
  rightValue?: number;
  /**
   * Percentage share of the left side (0–100). If omitted,
   * we compute it from left/right values when possible.
   */
  leftPercent?: number;
};

function safePct(n?: number) {
  if (typeof n !== "number" || !isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default function StatsBar({
  label,
  leftValue,
  rightValue,
  leftPercent,
}: Props) {
  let pct = leftPercent;
  if (
    pct === undefined &&
    typeof leftValue === "number" &&
    typeof rightValue === "number"
  ) {
    const tot = leftValue + rightValue;
    pct = tot > 0 ? (leftValue / tot) * 100 : 0;
  }
  const left = safePct(pct);
  const right = 100 - left;

  const showLeft = leftValue ?? "–";
  const showRight = rightValue ?? "–";

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <div className={styles.sideVal}>{showLeft}</div>
        <div className={styles.label}>{label}</div>
        <div className={styles.sideVal} data-right>
          {showRight}
        </div>
      </div>

      <div className={styles.track} aria-label={`${label} bar`}>
        <div className={styles.leftFill} style={{ width: `${left}%` }} />
        <div className={styles.rightFill} style={{ width: `${right}%` }} />
      </div>
    </div>
  );
}
