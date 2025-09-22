import React from "react";
import styles from "./PlayerTable.module.css";

export type Side = "home" | "away";

export type PlayerRow = {
  id: string;
  name: string;
  side: Side;
  starter: boolean;

  teamLogoUrl?: string;
  position?: string;
  shirt?: string | number;

  subIn?: boolean;
  subOut?: boolean;
  subInMinute?: number;
  subOutMinute?: number;

  FC?: number;
  FA?: number;
  YC?: number;
  RC?: number;
  OG?: number;
  GA?: number;
  SV?: number;
  SHF?: number;
  G?: number;
  A?: number;
  SH?: number;
  ST?: number;
  OF?: number;
};

type Props = {
  rows: PlayerRow[];
  title?: string;
};

function SubIndicator({ row }: { row: PlayerRow }) {
  if (!row.subIn && !row.subOut) return null;

  return (
    <div className={styles.subIndicatorWrapper}>
      {row.subOut && (
        <span className={`${styles.badge} ${styles.subOut}`} title="Subbed off">
          {typeof row.subOutMinute === "number" ? `${row.subOutMinute}’` : "—"}
          <span className={`${styles.miniCircle} ${styles.subOutCircle}`}>
            ←
          </span>
        </span>
      )}

      {row.subIn && (
        <span className={`${styles.badge} ${styles.subIn}`} title="Subbed on">
          {typeof row.subInMinute === "number" ? `${row.subInMinute}’` : "—"}
          <span className={`${styles.miniCircle} ${styles.subInCircle}`}>
            →
          </span>
        </span>
      )}
    </div>
  );
}
function AvatarNameCell({
  row,
  eager = false,
}: {
  row: PlayerRow;
  eager?: boolean;
}) {
  const SIZE = 64;

  return (
    <div className={styles.avatarNameCell}>
      <div className={styles.avatarWrapper}>
        <img
          src={row.teamLogoUrl || ""}
          alt={`${row.side} team logo`}
          width={SIZE}
          height={SIZE}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchpriority={eager ? "high" : "auto"}
          className={styles.avatarImg}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
          }}
          referrerPolicy="no-referrer"
        />
        {row.shirt && <span className={styles.shirtBadge}>#{row.shirt}</span>}
      </div>

      <div className={styles.infoWrapper}>
        <div className={styles.playerName}>{row.name}</div>
        {row.position && (
          <div className={styles.playerPosition}>{row.position}</div>
        )}
        <div className={styles.subIndicatorContainer}>
          <SubIndicator row={row} />
        </div>
      </div>
    </div>
  );
}

export default function PlayerTable({ rows, title }: Props) {
  const val = (n?: number) => (n == null ? "—" : n);

  return (
    <div className={styles.tableContainer}>
      {title && <div className={styles.tableTitle}>{title}</div>}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Player</th>
            <th className={styles.th} title="Goals">
              G
            </th>
            <th className={styles.th} title="Assists">
              A
            </th>
            <th className={styles.th} title="Shots">
              SH
            </th>
            <th className={styles.th} title="Shots on Target">
              ST
            </th>
            <th className={styles.th} title="Fouls Committed">
              FC
            </th>
            <th className={styles.th} title="Yellow Cards">
              YC
            </th>
            <th className={styles.th} title="Red Cards">
              RC
            </th>
            <th className={styles.th} title="Saves">
              SV
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className={styles.noPlayers}>
                No players.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id} className={styles.tr}>
                <td className={`${styles.td} ${styles.playerCell}`}>
                  <AvatarNameCell row={row} eager={index < 4} />
                </td>
                <td className={styles.td}>{val(row.G)}</td>
                <td className={styles.td}>{val(row.A)}</td>
                <td className={styles.td}>{val(row.SH)}</td>
                <td className={styles.td}>{val(row.ST)}</td>
                <td className={styles.td}>{val(row.FC)}</td>
                <td className={styles.td}>{val(row.YC)}</td>
                <td className={styles.td}>{val(row.RC)}</td>
                <td className={styles.td}>{val(row.SV)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
