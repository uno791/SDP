import { useMemo, useState } from "react";

import ComicCard from "../MatchViewerComp/ComicCard";
import GameSummaryCard from "../MatchViewerComp/GameSummaryCard";
import TriStatRow from "../MatchViewerComp/TriStatRow";
import matchViewStyles from "../MatchViewerComp/MatchView.module.css";

import styles from "./UserMatchViewer.module.css";

type Event = {
  id: number;
  minute?: number | null;
  event_type: string;
  team_id?: number | null;
  player_name?: string | null;
  detail?: string | null;
};

type Team = {
  id?: number | null;
  name?: string | null;
  logo_url?: string | null;
};

type Match = {
  id: number;
  status: string;
  minute?: number | null;
  home_team: Team;
  away_team: Team;
  home_score?: number | null;
  away_score?: number | null;
};

type Props = {
  match: Match;
  events: Event[];
  homeSquad: string[];
  awaySquad: string[];
  onClose: () => void;
};

type StatLine = {
  goals: number;
  shotsOn: number;
  shotsOff: number;
  fouls: number;
  yellow: number;
  red: number;
  saves: number;
  subs: number;
  totalShots: number;
  shotAccuracy: number | null;
};

const GOAL_TYPES = new Set(["goal", "penalty_goal", "own_goal"]);

function calculateStats(
  events: Event[],
  homeTeamId?: number | null,
  awayTeamId?: number | null
) {
  const base: StatLine = {
    goals: 0,
    shotsOn: 0,
    shotsOff: 0,
    fouls: 0,
    yellow: 0,
    red: 0,
    saves: 0,
    subs: 0,
    totalShots: 0,
    shotAccuracy: null,
  };

  if (!homeTeamId || !awayTeamId) {
    return { home: base, away: base };
  }

  const home: StatLine = { ...base };
  const away: StatLine = { ...base };

  const bucketFor = (teamId?: number | null) => {
    if (teamId === homeTeamId) return home;
    if (teamId === awayTeamId) return away;
    return null;
  };

  for (const event of events) {
    const bucket = bucketFor(event.team_id ?? undefined);
    if (!bucket) continue;

    const type = event.event_type.toLowerCase();

    if (GOAL_TYPES.has(type)) {
      bucket.goals += 1;
      bucket.shotsOn += 1;
      continue;
    }

    switch (type) {
      case "shot_on_target":
        bucket.shotsOn += 1;
        break;
      case "shot_off_target":
        bucket.shotsOff += 1;
        break;
      case "shot_saved":
      case "save":
        bucket.saves += 1;
        break;
      case "foul":
        bucket.fouls += 1;
        break;
      case "yellow_card":
        bucket.yellow += 1;
        break;
      case "red_card":
        bucket.red += 1;
        break;
      case "substitution":
        bucket.subs += 1;
        break;
      default:
        break;
    }
  }

  const finish = (line: StatLine): StatLine => {
    const totalShots = line.shotsOn + line.shotsOff;
    return {
      ...line,
      totalShots,
      shotAccuracy:
        totalShots > 0 ? Math.round((line.shotsOn / totalShots) * 100) : null,
    };
  };

  return { home: finish(home), away: finish(away) };
}

function buildScorers(
  events: Event[],
  homeTeamId?: number | null,
  awayTeamId?: number | null
) {
  const home: string[] = [];
  const away: string[] = [];

  const sorted = [...events].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

  for (const ev of sorted) {
    const type = ev.event_type.toLowerCase();
    if (!GOAL_TYPES.has(type)) continue;

    const parts: string[] = [];
    const player = ev.player_name?.trim();
    parts.push(player && player.length ? player : "Goal");

    if (type.includes("penalty")) {
      parts[parts.length - 1] += " (p)";
    }
    if (type.includes("own")) {
      parts[parts.length - 1] += " (OG)";
    }

    if (ev.minute != null) {
      parts.push(`${ev.minute}'`);
    }

    const label = parts.join(" ").trim();

    if (ev.team_id === homeTeamId) home.push(label);
    else if (ev.team_id === awayTeamId) away.push(label);
  }

  return { home, away };
}

function formatStatus(match: Match) {
  if (match.status === "in_progress") {
    const minute = match.minute ?? 0;
    return `${minute}' LIVE`;
  }
  if (match.status === "final") return "FT";
  return match.status.replace(/_/g, " ").toUpperCase();
}

const formatNumber = (value?: number | null) => (value == null ? "—" : value);

const formatPercent = (value?: number | null) =>
  value == null ? "—" : `${value}%`;

const formatEventType = (type: string) =>
  type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDetail = (detail?: string | null) =>
  detail && detail.trim().length > 0 ? detail : undefined;

export default function UserMatchViewer({
  match,
  events,
  homeSquad,
  awaySquad,
  onClose,
}: Props) {
  const [tab, setTab] = useState<"events" | "stats" | "squad">("events");

  const homeName = match.home_team?.name || "Home";
  const awayName = match.away_team?.name || "Away";

  const stats = useMemo(
    () =>
      calculateStats(
        events,
        match.home_team?.id ?? undefined,
        match.away_team?.id ?? undefined
      ),
    [events, match.away_team?.id, match.home_team?.id]
  );

  const scorers = useMemo(
    () =>
      buildScorers(
        events,
        match.home_team?.id ?? undefined,
        match.away_team?.id ?? undefined
      ),
    [events, match.away_team?.id, match.home_team?.id]
  );

  const timelineEvents = useMemo(
    () => [...events].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0)),
    [events]
  );

  const statusText = formatStatus(match);

  return (
    <div className={styles.viewer}>
      <button
        type="button"
        aria-label="Close match viewer"
        onClick={onClose}
        className={styles.closeButton}
      >
        X
      </button>

      <ComicCard>
        <div className={matchViewStyles.container}>
          <h1 className={matchViewStyles.heading}>
            {homeName} vs {awayName}
          </h1>
          <div className={matchViewStyles.subheading}>User Match Viewer</div>

          <GameSummaryCard
            homeName={homeName}
            awayName={awayName}
            homeScore={match.home_score ?? 0}
            awayScore={match.away_score ?? 0}
            statusText={statusText}
            homeLogoUrl={match.home_team?.logo_url ?? undefined}
            awayLogoUrl={match.away_team?.logo_url ?? undefined}
            homeScorers={scorers.home}
            awayScorers={scorers.away}
          />

          <div className={styles.tabBar}>
            <button
              type="button"
              className={`${styles.tabButton} ${
                tab === "events" ? styles.activeTab : ""
              }`}
              onClick={() => setTab("events")}
            >
              Events
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${
                tab === "stats" ? styles.activeTab : ""
              }`}
              onClick={() => setTab("stats")}
            >
              Stats
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${
                tab === "squad" ? styles.activeTab : ""
              }`}
              onClick={() => setTab("squad")}
            >
              Squad
            </button>
          </div>

          <div className={styles.tabPanel}>
            {tab === "events" && (
              <div className={styles.timelineCard}>
                {timelineEvents.length === 0 ? (
                  <p className={styles.timelineEmpty}>No events yet.</p>
                ) : (
                  <ul className={styles.timelineList}>
                    {timelineEvents.map((ev) => (
                      <li key={ev.id} className={styles.timelineItem}>
                        <span className={styles.timelineMinute}>
                          {ev.minute != null ? `${ev.minute}'` : "—"}
                        </span>
                        <div className={styles.timelineBody}>
                          <span className={styles.timelineType}>
                            {formatEventType(ev.event_type)}
                          </span>
                          <span className={styles.timelineMeta}>
                            {ev.player_name ?? ""}
                            {ev.team_id && ev.team_id === match.home_team?.id
                              ? ` • ${homeName}`
                              : ev.team_id && ev.team_id === match.away_team?.id
                              ? ` • ${awayName}`
                              : ""}
                            {formatDetail(ev.detail)
                              ? ` • ${formatDetail(ev.detail)}`
                              : ""}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === "stats" && (
              <div className={styles.statsSection}>
                <section className={matchViewStyles.section}>
                  <h2 className={matchViewStyles.sectionTitle}>Shooting</h2>
                  <TriStatRow
                    label="Shots on Target"
                    left={formatNumber(stats.home.shotsOn)}
                    right={formatNumber(stats.away.shotsOn)}
                  />
                  <TriStatRow
                    label="Shots off Target"
                    left={formatNumber(stats.home.shotsOff)}
                    right={formatNumber(stats.away.shotsOff)}
                  />
                  <TriStatRow
                    label="Total Shots"
                    left={formatNumber(stats.home.totalShots)}
                    right={formatNumber(stats.away.totalShots)}
                  />
                  <TriStatRow
                    label="Shot Accuracy"
                    left={formatPercent(stats.home.shotAccuracy)}
                    right={formatPercent(stats.away.shotAccuracy)}
                  />
                </section>

                <section className={matchViewStyles.section}>
                  <h2 className={matchViewStyles.sectionTitle}>Discipline</h2>
                  <TriStatRow
                    label="Fouls committed"
                    left={formatNumber(stats.home.fouls)}
                    right={formatNumber(stats.away.fouls)}
                  />
                  <TriStatRow
                    label="Yellow cards"
                    left={formatNumber(stats.home.yellow)}
                    right={formatNumber(stats.away.yellow)}
                  />
                  <TriStatRow
                    label="Red cards"
                    left={formatNumber(stats.home.red)}
                    right={formatNumber(stats.away.red)}
                  />
                </section>

                <section className={matchViewStyles.section}>
                  <h2 className={matchViewStyles.sectionTitle}>
                    Goalkeeping &amp; Subs
                  </h2>
                  <TriStatRow
                    label="Saves"
                    left={formatNumber(stats.home.saves)}
                    right={formatNumber(stats.away.saves)}
                  />
                  <TriStatRow
                    label="Substitutions"
                    left={formatNumber(stats.home.subs)}
                    right={formatNumber(stats.away.subs)}
                  />
                </section>
              </div>
            )}

            {tab === "squad" && (
              <div className={`${styles.squadCard} ${styles.squadGrid}`}>
                <div className={styles.squadColumn}>
                  <h3>{homeName} Squad</h3>
                  <div className={styles.playerList}>
                    {homeSquad.length === 0 ? (
                      <span className={styles.chipEmpty}>No squad data</span>
                    ) : (
                      homeSquad.map((player, idx) => (
                        <span
                          key={`${player}-${idx}`}
                          className={styles.playerChip}
                        >
                          {player}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className={styles.squadColumn}>
                  <h3>{awayName} Squad</h3>
                  <div className={styles.playerList}>
                    {awaySquad.length === 0 ? (
                      <span className={styles.chipEmpty}>No squad data</span>
                    ) : (
                      awaySquad.map((player, idx) => (
                        <span
                          key={`${player}-${idx}`}
                          className={styles.playerChip}
                        >
                          {player}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ComicCard>
    </div>
  );
}
