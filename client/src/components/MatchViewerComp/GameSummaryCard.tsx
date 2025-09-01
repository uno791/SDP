import React from "react";

type ScorerLike =
  | string
  | {
      player?: string;
      minute?: string;
      homeAway?: "home" | "away";
    };

type Props = {
  /** Team display names */
  homeName: string;
  awayName: string;

  /** Scores (numbers or strings from API) */
  homeScore?: number | string | null;
  awayScore?: number | string | null;

  /** Optional status string like "FT", "HT 45+1’", "86’" */
  statusText?: string | null;

  /** Optional logo URLs (from your API payloads) */
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;

  /** Scorers (strings or {player, minute}) */
  homeScorers?: ScorerLike[];
  awayScorers?: ScorerLike[];
};

function showScore(v?: number | string | null) {
  if (v === null || v === undefined) return "–";
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : String(v);
}

function fmtScorer(s: ScorerLike): string {
  if (typeof s === "string") return s; // already formatted upstream
  const name = s.player || "Goal";
  const min = s.minute ? ` ${s.minute}` : "";
  return `${name}${min}`;
}

export default function GameSummaryCard({
  homeName,
  awayName,
  homeScore,
  awayScore,
  statusText,
  homeLogoUrl,
  awayLogoUrl,
  homeScorers,
  awayScorers,
}: Props) {
  const leftItems = (homeScorers ?? []).map(fmtScorer);
  const rightItems = (awayScorers ?? []).map(fmtScorer);

  const NameWithLogo = ({
  name,
  logo,
  align = "left",
}: {
  name: string;
  logo?: string | null;
  align?: "left" | "right";
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10, // add a bit more spacing
      justifyContent: align === "left" ? "flex-start" : "flex-end",
    }}
  >
    {align === "left" && logo ? (
      <img
        src={logo}
        alt=""
        width={50}   // bigger than 22
        height={50}
        style={{ borderRadius: 6 }}
      />
    ) : null}
    <span style={{ fontWeight: 700, fontSize: 16 }}>{name}</span>
    {align === "right" && logo ? (
      <img
        src={logo}
        alt=""
        width={50}
        height={50}
        style={{ borderRadius: 6 }}
      />
    ) : null}
  </div>
);


  return (
    <div
      style={{
        border: "2px solid black",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        background: "linear-gradient(0deg, #fff, #fff)",
        boxShadow: "4px 4px 0 black",
      }}
    >
      {/* teams + big score */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ justifySelf: "start" }}>
          <NameWithLogo name={homeName} logo={homeLogoUrl ?? undefined} align="left" />
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontWeight: 900,
              fontSize: "2.125rem",
              lineHeight: 1,
              letterSpacing: 0.5,
            }}
          >
            {showScore(homeScore)}–{showScore(awayScore)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            {statusText || "Match"}
          </div>
        </div>

        <div style={{ justifySelf: "end" }}>
          <NameWithLogo name={awayName} logo={awayLogoUrl ?? undefined} align="right" />
        </div>
      </div>

      {/* per-side scorers */}
      {(leftItems.length || rightItems.length) ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 12,
          }}
        >
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              justifySelf: "start",
              fontSize: 14,
            }}
          >
            {leftItems.map((txt, i) => (
              <li key={`home-s-${i}`} style={{ opacity: 0.9 }}>
                {txt}
              </li>
            ))}
          </ul>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              justifySelf: "end",
              textAlign: "right",
              fontSize: 14,
            }}
          >
            {rightItems.map((txt, i) => (
              <li key={`away-s-${i}`} style={{ opacity: 0.9 }}>
                {txt}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
