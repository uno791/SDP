import { useEffect, useState, useMemo } from "react";
import styles from "./FPLTransferAnalysis.module.css";
import { getTransfers, getLiveGWData, getUserPicks } from "../../../api/fpl";

interface Transfer {
  element_in: number;
  element_out: number;
  event: number;
}

interface FPLPlayer {
  id: number;
  web_name: string;
  photo: string;
  element_type: number;
}

interface LivePlayer {
  id: number;
  stats: {
    total_points: number;
  };
}

interface LiveGWData {
  elements: LivePlayer[];
}

interface Props {
  teamId: number;
  players: Record<number, FPLPlayer>;
}

export default function FPLTransferAnalysis({ teamId, players }: Props) {
  const [analysis, setAnalysis] = useState<
    {
      event: number;
      element_in: number;
      element_out: number;
      inPts: number;
      outPts: number;
      diff: number;
    }[]
  >([]);
  const [selectedGW, setSelectedGW] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);
  const [captainEfficiency, setCaptainEfficiency] = useState<number | null>(
    null
  );

  // Fetch transfer + live data
  useEffect(() => {
    async function loadTransfers() {
      try {
        setLoading(true);
        const transferData = (await getTransfers(teamId)) as Transfer[] | null;
        if (!transferData) return;

        const results: {
          event: number;
          element_in: number;
          element_out: number;
          inPts: number;
          outPts: number;
          diff: number;
        }[] = [];

        const capEffValues: number[] = [];

        for (const t of transferData) {
          // ✅ Fetch both live data and user picks in parallel
          const [liveRaw, picksData] = await Promise.all([
            getLiveGWData(t.event),
            getUserPicks(teamId, t.event),
          ]);

          const live = liveRaw as LiveGWData | null;
          if (!live || !Array.isArray(live.elements)) continue;

          const livePoints = Object.fromEntries(
            (live.elements as LivePlayer[]).map((p: LivePlayer) => [
              p.id,
              p.stats.total_points,
            ])
          );

          const inPts = livePoints[t.element_in] ?? 0;
          const outPts = livePoints[t.element_out] ?? 0;
          const diff = inPts - outPts;

          results.push({
            event: t.event,
            element_in: t.element_in,
            element_out: t.element_out,
            inPts,
            outPts,
            diff,
          });

          // ✅ Captaincy Efficiency Calculation
          const captainId = picksData?.picks?.find(
            (p: any) => p.is_captain
          )?.element;
          if (captainId) {
            const captainPts = livePoints[captainId] ?? 0;
            const bestPts = Math.max(
              ...picksData.picks.map((p: any) => livePoints[p.element] ?? 0)
            );
            if (bestPts > 0) {
              const efficiency = (captainPts / bestPts) * 100;
              capEffValues.push(efficiency);
            }
          }
        }

        // ✅ Compute average Captaincy Efficiency
        if (capEffValues.length > 0) {
          const avgCapEff =
            capEffValues.reduce((a, b) => a + b, 0) / capEffValues.length;
          setCaptainEfficiency(avgCapEff);
        }

        results.sort((a, b) => a.event - b.event);
        setAnalysis(results);
      } catch (err) {
        console.error("Error loading transfer analysis:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTransfers();
  }, [teamId]);

  // Derive GWs + filtered analysis
  const gameweeks = Array.from(new Set(analysis.map((a) => a.event)));

  const filteredAnalysis =
    selectedGW === "all"
      ? analysis
      : analysis.filter((a) => a.event === selectedGW);

  // ✅ Summary stats
  const summary = useMemo(() => {
    if (!filteredAnalysis.length) return null;

    const totalGain = filteredAnalysis.reduce((sum, t) => sum + t.diff, 0);
    const avgEfficiency = totalGain / filteredAnalysis.length;
    const best = filteredAnalysis.reduce((a, b) => (b.diff > a.diff ? b : a));
    const worst = filteredAnalysis.reduce((a, b) => (b.diff < a.diff ? b : a));

    return { totalGain, avgEfficiency, best, worst };
  }, [filteredAnalysis]);

  if (loading)
    return <div className={styles.loading}>Analyzing transfers...</div>;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.heading}>Transfer Analysis</h3>
        {gameweeks.length > 0 && (
          <div className={styles.dropdown}>
            <label htmlFor="gwSelect">Pick GW:</label>
            <select
              id="gwSelect"
              value={selectedGW}
              onChange={(e) =>
                setSelectedGW(
                  e.target.value === "all"
                    ? "all"
                    : parseInt(e.target.value, 10)
                )
              }
            >
              <option value="all">All</option>
              {gameweeks.map((gw) => (
                <option key={gw} value={gw}>
                  GW {gw}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ✅ Summary */}
      {summary && (
        <div className={styles.summaryBox}>
          <div>
            <span className={styles.summaryLabel}>Total Net Points:</span>{" "}
            <span
              className={summary.totalGain >= 0 ? styles.gain : styles.loss}
            >
              {summary.totalGain >= 0 ? "+" : ""}
              {summary.totalGain.toFixed(1)} pts
            </span>
          </div>
          <div>
            <span className={styles.summaryLabel}>Avg Efficiency:</span>{" "}
            {summary.avgEfficiency >= 0 ? "+" : ""}
            {summary.avgEfficiency.toFixed(2)} pts/transfer
          </div>
          {captainEfficiency !== null && (
            <div>
              <span className={styles.summaryLabel}>Captaincy Efficiency:</span>{" "}
              {captainEfficiency.toFixed(1)}%
            </div>
          )}
          <div>
            <span className={styles.summaryLabel}>Best Transfer:</span>{" "}
            <span className={styles.gain}>
              {players[summary.best.element_out]?.web_name ??
                `#${summary.best.element_out}`}{" "}
              →{" "}
              {players[summary.best.element_in]?.web_name ??
                `#${summary.best.element_in}`}{" "}
              ({summary.best.diff >= 0 ? "+" : ""}
              {summary.best.diff} pts)
            </span>
          </div>
          <div>
            <span className={styles.summaryLabel}>Worst Transfer:</span>{" "}
            <span className={styles.loss}>
              {players[summary.worst.element_out]?.web_name ??
                `#${summary.worst.element_out}`}{" "}
              →{" "}
              {players[summary.worst.element_in]?.web_name ??
                `#${summary.worst.element_in}`}{" "}
              ({summary.worst.diff >= 0 ? "+" : ""}
              {summary.worst.diff} pts)
            </span>
          </div>
        </div>
      )}

      {/* ✅ Table */}
      {filteredAnalysis.length === 0 ? (
        <p>No transfers made yet.</p>
      ) : (
        filteredAnalysis.map((t, idx) => {
          const playerIn =
            players[t.element_in]?.web_name || `#${t.element_in}`;
          const playerOut =
            players[t.element_out]?.web_name || `#${t.element_out}`;

          const statusClass =
            t.diff > 0
              ? styles.gain
              : t.diff < 0
              ? styles.loss
              : styles.neutral;

          const label =
            t.diff > 0
              ? `Gained ${t.diff} pts`
              : t.diff < 0
              ? `Lost ${Math.abs(t.diff)} pts`
              : "No change";

          return (
            <div key={idx} className={styles.transferRow}>
              <div className={styles.gw}>GW{t.event}</div>

              <div className={styles.transferPlayers}>
                <span className={styles.out}>{playerOut}</span>
                <span className={styles.arrow}>→</span>
                <span className={styles.in}>{playerIn}</span>
              </div>

              <div className={`${styles.result} ${statusClass}`}>{label}</div>
            </div>
          );
        })
      )}
    </div>
  );
}
