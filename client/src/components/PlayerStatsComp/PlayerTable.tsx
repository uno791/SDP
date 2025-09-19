import React from "react";

export type Side = "home" | "away";

export type PlayerRow = {
  id: string;
  name: string;
  side: Side;
  starter: boolean;

  // Replaces headshot
  teamLogoUrl?: string;

  // Display bits
  position?: string;
  shirt?: string | number;

  // Substitution flags + (optional) minutes
  subIn?: boolean;          // came on
  subOut?: boolean;         // went off
  subInMinute?: number;     // optional minute for coming on
  subOutMinute?: number;    // optional minute for going off

  // Discipline
  FC?: number; FA?: number; YC?: number; RC?: number; OG?: number;

  // GK
  GA?: number; SV?: number; SHF?: number;

  // Attacking
  G?: number; A?: number; SH?: number; ST?: number; OF?: number;
};

type Props = {
  rows: PlayerRow[];
  title?: string;
};

function SubIndicator({
  row,
}: {
  row: PlayerRow;
}) {
  const badgeBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "2px 6px",
    borderRadius: 14,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.06)",
  };

  const miniCircle: React.CSSProperties = {
    width: 20,
    height: 20,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(0,0,0,0.2)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
    fontSize: 12,
    lineHeight: "20px",
    userSelect: "none",
  };

  // Nothing to show?
  if (!row.subIn && !row.subOut) return null;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {row.subOut ? (
        <span style={{ ...badgeBase, color: "#d24c4c", background: "rgba(210,76,76,0.12)" }} title="Subbed off">
          {typeof row.subOutMinute === "number" ? `${row.subOutMinute}’` : "—"}
          <span style={{ ...miniCircle, color: "#fff", background: "#d24c4c" }}>←</span>
        </span>
      ) : null}

      {row.subIn ? (
        <span style={{ ...badgeBase, color: "#0a923d", background: "rgba(10,146,61,0.12)" }} title="Subbed on">
          {typeof row.subInMinute === "number" ? `${row.subInMinute}’` : "—"}
          <span style={{ ...miniCircle, color: "#0a923d", background: "rgba(255,255,255,0.95)" }}>→</span>
        </span>
      ) : null}
    </div>
  );
}

function AvatarNameCell({ row, eager = false }: { row: PlayerRow; eager?: boolean }) {
  const SIZE = 80;
  const BADGE_H = 20;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative", width: SIZE, height: SIZE, flex: "0 0 auto" }}>
        <img
          src={row.teamLogoUrl || ""}
          alt={`${row.side} team logo`}
          width={SIZE}
          height={SIZE}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchpriority={eager ? "high" : "auto"}
          sizes={`${SIZE}px`}
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: "50%",
            objectFit: "cover",
            border: "1px solid rgba(0,0,0,0.08)",
            background: "linear-gradient(180deg,#f4f4f4,#eee)",
            imageRendering: "auto",
            display: "block",
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
          }}
          referrerPolicy="no-referrer"
        />
        {row.shirt != null && String(row.shirt).trim() !== "" && (
          <span
            style={{
              position: "absolute",
              left: "50%",
              bottom: -Math.round(BADGE_H / 2),
              transform: "translateX(-50%)",
              padding: "0 10px",
              height: BADGE_H,
              lineHeight: `${BADGE_H}px`,
              fontSize: 12,
              fontWeight: 800,
              color: "#fff",
              background: "#111",
              borderRadius: 10,
              boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
              whiteSpace: "nowrap",
            }}
            title={`#${row.shirt}`}
          >
            {row.shirt}
          </span>
        )}
      </div>

      <div>
        <div style={{ fontWeight: 600 }}>{row.name}</div>
        {row.position && <div style={{ fontSize: 12, opacity: 0.7 }}>{row.position}</div>}
        <div style={{ marginTop: 6 }}>
          <SubIndicator row={row} />
        </div>
      </div>
    </div>
  );
}

export default function PlayerTable({ rows, title }: Props) {
  const th: React.CSSProperties = {
    textAlign: "left",
    fontWeight: 700,
    fontSize: 12,
    padding: "8px 10px",
    borderBottom: "1px solid #eee",
    whiteSpace: "nowrap",
  };

  const td: React.CSSProperties = {
    padding: "10px",
    fontSize: 13,
    verticalAlign: "middle",
  };

  const val = (n?: number) => (n == null ? "—" : n);

  return (
    <div
      style={{
        marginBottom: 12,
        border: "1px solid #eee",
        borderRadius: 10,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {title && (
        <div style={{ padding: "8px 12px", fontWeight: 700, background: "#fafafa", borderBottom: "1px solid #eee" }}>
          {title}
        </div>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#fafafa" }}>
            <th style={th}>Player</th>
            {/* Removed APP column */}
            <th style={th} title="Goals">G</th>
            <th style={th} title="Assists">A</th>
            <th style={th} title="Shots">SH</th>
            <th style={th} title="Shots on Target">ST</th>
            <th style={th} title="Fouls Committed">FC</th>
            <th style={th} title="Yellow Cards">YC</th>
            <th style={th} title="Red Cards">RC</th>
            <th style={th} title="Saves">SV</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ padding: 12, textAlign: "center", color: "#777" }}>
                No players.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                <td style={{ ...td, minWidth: 260 }}>
                  <AvatarNameCell row={row} eager={index < 4} />
                </td>
                <td style={td}>{val(row.G)}</td>
                <td style={td}>{val(row.A)}</td>
                <td style={td}>{val(row.SH)}</td>
                <td style={td}>{val(row.ST)}</td>
                <td style={td}>{val(row.FC)}</td>
                <td style={td}>{val(row.YC)}</td>
                <td style={td}>{val(row.RC)}</td>
                <td style={td}>{val(row.SV)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
