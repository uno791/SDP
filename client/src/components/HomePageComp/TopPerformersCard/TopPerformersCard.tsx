import React from "react";
import styles from "./TopPerformersCard.module.css";
import {
  buildTopPerformersSeason,
  type TopPerformersSeason,
} from "../../../api/topPerformersSeason";

function headshotUrl(athleteId?: string) {
  return athleteId
    ? `https://a.espncdn.com/i/headshots/soccer/players/full/${athleteId}.png`
    : "";
}

type Winner = {
  id: string;
  name: string;
  teamName?: string;
  teamLogo?: string;
  value: number;
};

export default function TopPerformersCard() {
  const today = new Date();
  const currentSeason =
    today.getUTCMonth() >= 6
      ? today.getUTCFullYear()
      : today.getUTCFullYear() - 1;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<TopPerformersSeason | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);

    buildTopPerformersSeason(currentSeason, ac.signal)
      .then(setData)
      .catch((e) => {
        if (e?.name !== "AbortError")
          setError("Could not load season leaders.");
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [currentSeason]);

  const one = (arr?: Winner[]) => (arr && arr.length ? arr[0] : null);

  const boot = one((data?.goals as unknown as Winner[]) || []);
  const yell = one((data?.yellows as unknown as Winner[]) || []);
  const red = one((data?.reds as unknown as Winner[]) || []);

  const emptyAll = !boot && !yell && !red;

  return (
    <section className={`card ${styles.card}`}>
      <div className={styles.headerRowTight}>
        <h3 className={styles.title}>Quick Stats</h3>
      </div>

      {loading && <div className={styles.state}>Crunching season data…</div>}
      {error && !loading && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <div className={styles.table}>
          <div className={styles.thead}>
            <div className={styles.colStat}>STAT</div>
            <div className={styles.colPlayer}>WINNER</div>
            <div className={styles.colTeam}>TEAM</div>
            <div className={styles.colValue}>VAL</div>
          </div>

          <Row stat="Golden Boot" winner={boot} type="player" pillTone="dark" />
          <Row
            stat="Most Yellow Cards"
            winner={yell}
            type="player"
            pillTone="amber"
          />
          <Row
            stat="Most Red Cards"
            winner={red}
            type="player"
            pillTone="red"
          />

          {emptyAll && (
            <div className={styles.emptyWrap}>
              <div className={styles.emptyBox}>
                No season data found from the scoreboard feed yet.
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Row({
  stat,
  winner,
  type,
  pillTone,
}: {
  stat: string;
  winner: Winner | null;
  type: "player" | "team";
  pillTone: "dark" | "amber" | "red";
}) {
  return (
    <div className={styles.row}>
      <div className={styles.colStatCell}>{stat}</div>
      <div className={styles.colPlayerCell}>
        {winner ? (
          <div className={styles.playerWrap}>
            <img
              className={styles.avatar}
              src={
                type === "team" ? winner.teamLogo || "" : headshotUrl(winner.id)
              }
              referrerPolicy="no-referrer"
              onError={(e) => {
                const img = e.currentTarget;
                if (type === "player" && winner.teamLogo)
                  img.src = winner.teamLogo;
                else img.classList.add(styles.avatarFallback);
              }}
              alt=""
            />
            <span className={styles.playerName}>{winner.name}</span>
          </div>
        ) : (
          <span className={styles.dim}>—</span>
        )}
      </div>
      <div className={styles.colTeamCell}>
        {winner?.teamName ? (
          winner.teamName
        ) : (
          <span className={styles.dim}>—</span>
        )}
      </div>
      <div className={styles.colValueCell}>
        {winner ? (
          <span className={`${styles.pill} ${styles[pillTone]}`}>
            {winner.value}
          </span>
        ) : (
          <span className={styles.dim}>—</span>
        )}
      </div>
    </div>
  );
}
