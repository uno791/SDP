import { useEffect, useMemo, useState } from "react";
import styles from "./LeagueTable.module.css";
import { fetchEplStandings } from "../../api/espn";

type Row = {
  pos: number;
  team: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gd: number;
  pts: number;
};

const CURRENT_YEAR = new Date().getFullYear();
const FIRST_EPL_SEASON = 1993; // adjust if you want a different lower bound

function seasonLabel(year: number) {
  const shortNext = String(year + 1).slice(-2);
  return `${year}/${shortNext}`;
}

export default function LeagueTable() {
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const nav = useMemo(
    () => ({
      canPrev: year > FIRST_EPL_SEASON,
      canNext: year < CURRENT_YEAR,
    }),
    [year]
  );

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Don’t force seasontype; the API picker will try [undefined,2,1,3] internally.
        const data = await fetchEplStandings({ season: year, level: 3 });

        if (!cancel) setRows(data);
      } catch (e: any) {
        if (!cancel) setErr(e?.message ?? "Failed to load standings");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [year]);

  return (
    <aside className={styles.card}>
      <div className={styles.headerRow}>
        <h3>Premier League Table</h3>

        <div className={styles.seasonNav}>
          <button
            className={styles.navBtn}
            onClick={() => setYear((y) => Math.max(FIRST_EPL_SEASON, y - 1))}
            disabled={!nav.canPrev}
            aria-label="Previous season"
            title="Previous season"
          >
            ◀
          </button>

          <span className={styles.seasonLabel}>{seasonLabel(year)}</span>

          <button
            className={styles.navBtn}
            onClick={() => setYear((y) => Math.min(CURRENT_YEAR, y + 1))}
            disabled={!nav.canNext}
            aria-label="Next season"
            title="Next season"
          >
            ▶
          </button>
        </div>
      </div>

      <div className={styles.head}>
        <span>Pos</span>
        <span>Team</span>
        <span>P</span>
        <span>W</span>
        <span>D</span>
        <span>L</span>
        <span>GD</span>
        <span>Pts</span>
      </div>

      <div className={styles.body}>
        {loading && <div className={styles.empty}>Loading…</div>}
        {err && <div className={styles.empty}>{err}</div>}

        {!loading &&
          !err &&
          rows.map((r) => (
            <div className={styles.row} key={r.pos + r.team}>
              <span>{r.pos}</span>
              <span className={styles.team}>{r.team}</span>
              <span>{r.p}</span>
              <span>{r.w}</span>
              <span>{r.d}</span>
              <span>{r.l}</span>
              <span>{r.gd}</span>
              <span className={styles.pts}>{r.pts}</span>
            </div>
          ))}

        {!loading && !err && rows.length === 0 && (
          <div className={styles.empty}>
            Standings not available for {seasonLabel(year)}.
          </div>
        )}
      </div>
    </aside>
  );
}
