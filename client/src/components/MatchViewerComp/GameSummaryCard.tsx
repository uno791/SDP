import React from "react";

type ScorerLike =
  | string
  | {
      player?: string;
      minute?: string;
      homeAway?: "home" | "away";
      // optional extra fields we may see from your API plumbing
      isPenalty?: boolean;
      isOG?: boolean;
      text?: string;
      rawText?: string;
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

  /** Scorers (strings or {player, minute, ...}) */
  homeScorers?: ScorerLike[];
  awayScorers?: ScorerLike[];
};

function showScore(v?: number | string | null) {
  if (v === null || v === undefined) return "–";
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : String(v);
}

function hasTick(s: string) {
  return /['’]$/.test(s.trim());
}
function normalizeMinute(min?: string) {
  if (!min) return "";
  const m = min.match(/\d+(?:\+\d+)?/);
  if (!m) return ` ${min.trim()}`;
  const core = m[0];
  return ` ${hasTick(min) ? core + min.trim().slice(min.trim().indexOf(core) + core.length) : core + "'"}`;
}

function detectPenalty(hay: string) {
  return /\bpen(?:alty|alties)?\b|\(PEN\)|\((?:P)\)/i.test(hay);
}
function detectOG(hay: string) {
  return /\bown[- ]goal\b|\(OG\)/i.test(hay);
}

/** Try pull a name from arbitrary scorer text if `player` missing */
function parseName(hay: string): string | undefined {
  const patterns = [
    /\bby\s+([\p{L}][\p{L}'\.\-\s]+)/iu, // "by John Smith"
    /^([\p{L}][\p{L}'\.\-\s]+?)\s*(?:\(|\s+)(?:converts|scores|nets|finishes|heads|strikes|fires)/iu,
    /\.\s*([\p{L}][\p{L}'\.\-\s]+?)\s+(?:converts|scores|nets|finishes|heads|strikes|fires)/iu,
    /-\s*([\p{L}][\p{L}'\.\-\s]+)/iu,
    /^([\p{L}][\p{L}'\.\-\s]+?)\s*\(/iu,
  ];
  for (const re of patterns) {
    const m = hay.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

/** Ensure we only add tags once and keep them tidy */
function applyTags(name: string, pen: boolean, og: boolean) {
  let out = name.replace(/\s*\((?:P|p)\)\s*/g, "").replace(/\s*\(OG\)\s*/g, "");
  if (pen) out += " (p)";
  if (og) out += " (OG)";
  return out;
}

function fmtScorer(s: ScorerLike): string {
  if (typeof s === "string") {
    // Strings are assumed already formatted upstream (may include (p)/(OG) and minute)
    return s;
  }
  const hay = `${s?.player ?? ""} ${s?.minute ?? ""} ${(s as any)?.text ?? ""} ${(s as any)?.rawText ?? ""}`.trim();

  // detect flags from explicit fields or text
  const pen = Boolean((s as any).isPenalty) || detectPenalty(hay);
  const og = Boolean((s as any).isOG) || detectOG(hay);

  // choose a name
  let name = s.player?.trim();
  if (!name) {
    name = parseName(hay) || "Goal";
  }

  name = applyTags(name, pen, og);
  const minPart = normalizeMinute(s.minute);
  return `${name}${minPart}`;
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
  }) => {
    const url = logo && String(logo).trim() !== "" ? String(logo) : undefined;
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          justifyContent: align === "left" ? "flex-start" : "flex-end",
          minWidth: 0,
        }}
      >
        {align === "left" && url ? (
          <img
            src={url}
            alt={`${name} logo`}
            width={64}
            height={64}
            style={{ borderRadius: 8, objectFit: "contain", display: "block" }}
          />
        ) : null}
        <span style={{ fontWeight: 700, fontSize: 16, whiteSpace: "nowrap" }}>{name}</span>
        {align === "right" && url ? (
          <img
            src={url}
            alt={`${name} logo`}
            width={64}
            height={64}
            style={{ borderRadius: 8, objectFit: "contain", display: "block" }}
          />
        ) : null}
      </div>
    );
  };

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

        <div style={{ textAlign: "center", minWidth: 0 }}>
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
