import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../config";
import LiveMatchTimeline from "./LiveMatchTimeline";
import styles from "./MatchViewerModal.module.css";

type Event = {
  id: number;
  minute: number;
  event_type: string;
  team_id?: number;
  player_name?: string;
  detail?: string;
};

type Team = {
  id: number;
  name: string;
  logo_url?: string;
};

type Match = {
  id: number;
  status: string;
  minute?: number | null;
  home_team: Team;
  away_team: Team;
  home_score: number;
  away_score: number;
  venue?: { name: string; city?: string; country?: string } | null;
};

type Props = {
  matchId: number;
  onClose: () => void;
};

/* ---------------- STATS CALC ---------------- */
function calculateStats(events: Event[], homeTeamId: number, awayTeamId: number) {
  const base = { goals: 0, shotsOn: 0, shotsOff: 0, fouls: 0, yellow: 0, red: 0, saves: 0, subs: 0 };

  const home = { ...base };
  const away = { ...base };

  const inc = (team: typeof home, key: keyof typeof base) => (team[key] += 1);

  for (const ev of events) {
    const team =
      ev.team_id === homeTeamId
        ? home
        : ev.team_id === awayTeamId
        ? away
        : null;

    if (!team) continue;

    switch (ev.event_type) {
      case "goal":
        inc(team, "goals");
        inc(team, "shotsOn");
        break;
      case "shot_on_target":
        inc(team, "shotsOn");
        break;
      case "shot_off_target":
        inc(team, "shotsOff");
        break;
      case "foul":
        inc(team, "fouls");
        break;
      case "yellow_card":
        inc(team, "yellow");
        break;
      case "red_card":
        inc(team, "red");
        break;
      case "save":
        inc(team, "saves");
        break;
      case "substitution":
        inc(team, "subs");
        break;
    }
  }

  const finish = (t: typeof home) => ({
    ...t,
    totalShots: t.shotsOn + t.shotsOff,
    shotAccuracy:
      t.shotsOn + t.shotsOff > 0
        ? Math.round((t.shotsOn / (t.shotsOn + t.shotsOff)) * 100)
        : 0,
  });

  return { home: finish(home), away: finish(away) };
}

/* ---------------- COMPONENT ---------------- */
export default function MatchViewerModal({ matchId, onClose }: Props) {
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [homeSquad, setHomeSquad] = useState<string[]>([]);
  const [awaySquad, setAwaySquad] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"events" | "stats" | "squad">("events");

  useEffect(() => {
    axios
      .get(`${baseURL}/matches/${matchId}/details`)
      .then((res) => {
        setMatch(res.data.match);
        setEvents(res.data.events || []);
        setHomeSquad(res.data.lineupTeam1 || []);
        setAwaySquad(res.data.lineupTeam2 || []);
      })
      .catch((err) => console.error("[Frontend] Failed to fetch match details:", err))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) return <div className={styles.modal}>Loading…</div>;
  if (!match) return <div className={styles.modal}>Match not found</div>;

  const stats = calculateStats(events, match.home_team.id, match.away_team.id);

  const renderStatRow = (label: string, homeValue: number, awayValue: number) => {
    const total = homeValue + awayValue;
    const homePct = total > 0 ? (homeValue / total) * 100 : 0;
    const awayPct = total > 0 ? (awayValue / total) * 100 : 0;

    return (
      <div className={styles.statBlock}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statRow}>
          <span>{homeValue}</span>
          <div className={styles.barWrapper}>
            <div className={styles.bar} style={{ width: `${homePct}%` }} />
            <div className={styles.barAway} style={{ width: `${awayPct}%` }} />
          </div>
          <span>{awayValue}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.headerTop}>
          <div className={styles.teamBlock}>
            <span className={styles.teamName}>{match.home_team.name}</span>
          </div>

          <div className={styles.scoreBlock}>
            <span className={styles.score}>
              {match.home_score} - {match.away_score}
            </span>
          </div>

          <div className={styles.teamBlock}>
            <span className={styles.teamName}>{match.away_team.name}</span>
          </div>

          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.status}>
          {match.status === "in_progress"
            ? `${match.minute}' LIVE`
            : match.status.toUpperCase()}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button onClick={() => setTab("events")} className={tab === "events" ? styles.active : ""}>
            Events
          </button>
          <button onClick={() => setTab("stats")} className={tab === "stats" ? styles.active : ""}>
            Stats
          </button>
          <button onClick={() => setTab("squad")} className={tab === "squad" ? styles.active : ""}>
            Squad
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {tab === "events" && <LiveMatchTimeline matchId={matchId} />}

          {tab === "stats" && (
            <div className={styles.stats}>
              {renderStatRow("Shots on Target", stats.home.shotsOn, stats.away.shotsOn)}
              {renderStatRow("Shots off Target", stats.home.shotsOff, stats.away.shotsOff)}
              {renderStatRow("Total Shots", stats.home.totalShots, stats.away.totalShots)}
              {renderStatRow("Fouls", stats.home.fouls, stats.away.fouls)}
              {renderStatRow("Yellow Cards", stats.home.yellow, stats.away.yellow)}
              {renderStatRow("Red Cards", stats.home.red, stats.away.red)}
              {renderStatRow("Saves", stats.home.saves, stats.away.saves)}
              {renderStatRow("Substitutions", stats.home.subs, stats.away.subs)}
            </div>
          )}

          {tab === "squad" && (
            <div className={styles.squads}>
              <div className={styles.teamColumn}>
                <h4>{match.home_team.name} Squad</h4>
                <div className={styles.playerList}>
                  {homeSquad.length === 0 ? (
                    <p>No squad data</p>
                  ) : (
                    homeSquad.map((p, idx) => (
                      <div key={idx} className={styles.playerCard}>
                        <span>{p}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className={styles.teamColumn}>
                <h4>{match.away_team.name} Squad</h4>
                <div className={styles.playerList}>
                  {awaySquad.length === 0 ? (
                    <p>No squad data</p>
                  ) : (
                    awaySquad.map((p, idx) => (
                      <div key={idx} className={styles.playerCard}>
                        <span>{p}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




/*import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../config";
import LiveMatchTimeline from "./LiveMatchTimeline";
import styles from "./MatchViewerModal.module.css";

type Event = {
  id: number;
  minute: number;
  event_type: string;
  team_id?: number;
  player_name?: string;
  detail?: string;
};

type Team = {
  id: number;
  name: string;
  logo_url?: string;
};

type Match = {
  id: number;
  status: string;
  minute?: number | null;
  home_team: Team;
  away_team: Team;
  home_score: number;
  away_score: number;
  venue?: { name: string; city?: string; country?: string } | null;
};

type Props = {
  matchId: number;
  onClose: () => void;
};


function calculateStats(events: Event[], homeTeamId: number, awayTeamId: number) {
  const base = { goals: 0, shotsOn: 0, shotsOff: 0, fouls: 0, yellow: 0, red: 0, saves: 0, subs: 0 };

  const home = { ...base };
  const away = { ...base };

  const inc = (team: typeof home, key: keyof typeof base) => (team[key] += 1);

  for (const ev of events) {
    const team =
      ev.team_id === homeTeamId
        ? home
        : ev.team_id === awayTeamId
        ? away
        : null;

    if (!team) continue;

    switch (ev.event_type) {
      case "goal":
        inc(team, "goals");
        inc(team, "shotsOn");
        break;
      case "shot_on_target":
        inc(team, "shotsOn");
        break;
      case "shot_off_target":
        inc(team, "shotsOff");
        break;
      case "foul":
        inc(team, "fouls");
        break;
      case "yellow_card":
        inc(team, "yellow");
        break;
      case "red_card":
        inc(team, "red");
        break;
      case "save":
        inc(team, "saves");
        break;
      case "substitution":
        inc(team, "subs");
        break;
    }
  }

  const finish = (t: typeof home) => ({
    ...t,
    totalShots: t.shotsOn + t.shotsOff,
    shotAccuracy:
      t.shotsOn + t.shotsOff > 0
        ? Math.round((t.shotsOn / (t.shotsOn + t.shotsOff)) * 100)
        : 0,
  });

  return { home: finish(home), away: finish(away) };
}


export default function MatchViewerModal({ matchId, onClose }: Props) {
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [homeSquad, setHomeSquad] = useState<string[]>([]);
  const [awaySquad, setAwaySquad] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"events" | "stats" | "squad">("events");

  useEffect(() => {
    axios
      .get(`${baseURL}/matches/${matchId}/details`)
      .then((res) => {
        setMatch(res.data.match);
        setEvents(res.data.events || []);
        setHomeSquad(res.data.lineupTeam1 || []);
        setAwaySquad(res.data.lineupTeam2 || []);
      })
      .catch((err) => console.error("[Frontend] Failed to fetch match details:", err))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) return <div className={styles.modal}>Loading…</div>;
  if (!match) return <div className={styles.modal}>Match not found</div>;

  const stats = calculateStats(events, match.home_team.id, match.away_team.id);

  const renderStatRow = (label: string, homeValue: number, awayValue: number) => {
    const total = homeValue + awayValue;
    const homePct = total > 0 ? (homeValue / total) * 100 : 0;
    return (
      <div className={styles.statRow}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.barWrapper}>
          <span className={styles.statValue}>{homeValue}</span>
          <div className={styles.bar}>
            <div className={styles.barFill} style={{ width: `${homePct}%` }} />
          </div>
          <span className={styles.statValue}>{awayValue}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
  
        <div className={styles.header}>
          <span className={styles.teamName}>{match.home_team.name}</span>
          <div className={styles.scoreBlock}>
            <span>{match.home_score}</span>
            <span className={styles.dash}>-</span>
            <span>{match.away_score}</span>
          </div>
          <span className={styles.teamName}>{match.away_team.name}</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.tabs}>
          <button onClick={() => setTab("events")} className={tab === "events" ? styles.active : ""}>
            Events
          </button>
          <button onClick={() => setTab("stats")} className={tab === "stats" ? styles.active : ""}>
            Stats
          </button>
          <button onClick={() => setTab("squad")} className={tab === "squad" ? styles.active : ""}>
            Squad
          </button>
        </div>


        <div className={styles.content}>
          {tab === "events" && <LiveMatchTimeline matchId={matchId} />}

          {tab === "stats" && (
            <div className={styles.stats}>
              {renderStatRow("Shots on Target", stats.home.shotsOn, stats.away.shotsOn)}
              {renderStatRow("Shots off Target", stats.home.shotsOff, stats.away.shotsOff)}
              {renderStatRow("Total Shots", stats.home.totalShots, stats.away.totalShots)}
              {renderStatRow("Fouls", stats.home.fouls, stats.away.fouls)}
              {renderStatRow("Yellow Cards", stats.home.yellow, stats.away.yellow)}
              {renderStatRow("Red Cards", stats.home.red, stats.away.red)}
              {renderStatRow("Saves", stats.home.saves, stats.away.saves)}
              {renderStatRow("Substitutions", stats.home.subs, stats.away.subs)}
            </div>
          )}

          {tab === "squad" && (
            <div className={styles.squads}>
              <div className={styles.teamColumn}>
                <h4>{match.home_team.name}</h4>
                <div className={styles.playerList}>
                  {homeSquad.length === 0 ? (
                    <p>No squad data</p>
                  ) : (
                    homeSquad.map((p, idx) => (
                      <div key={idx} className={styles.playerCard}>
                        <span>{p}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className={styles.teamColumn}>
                <h4>{match.away_team.name}</h4>
                <div className={styles.playerList}>
                  {awaySquad.length === 0 ? (
                    <p>No squad data</p>
                  ) : (
                    awaySquad.map((p, idx) => (
                      <div key={idx} className={styles.playerCard}>
                        <span>{p}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}*/




/*import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../config";
import LiveMatchTimeline from "./LiveMatchTimeline";
import styles from "./MatchViewerModal.module.css";

type Event = {
  id: number;
  minute: number;
  event_type: string;
  team_id?: number;
  player_name?: string;
  detail?: string;
};

type Team = {
  id: number;
  name: string;
  logo_url?: string;
};

type Match = {
  id: number;
  status: string;
  minute?: number | null;
  home_team: Team;
  away_team: Team;
  home_score: number;
  away_score: number;
  venue?: { name: string; city?: string; country?: string } | null;
};

type Props = {
  matchId: number;
  onClose: () => void;
};


function calculateStats(events: Event[], homeTeamId: number, awayTeamId: number) {
  const base = { goals: 0, shotsOn: 0, shotsOff: 0, fouls: 0, yellow: 0, red: 0, saves: 0, subs: 0 };

  const home = { ...base };
  const away = { ...base };

  const inc = (team: typeof home, key: keyof typeof base) => (team[key] += 1);

  for (const ev of events) {
    const team =
      ev.team_id === homeTeamId
        ? home
        : ev.team_id === awayTeamId
        ? away
        : null;

    if (!team) continue; // skip events that don’t belong to home/away

    switch (ev.event_type) {
      case "goal":
        inc(team, "goals");
        inc(team, "shotsOn");
        break;
      case "shot_on_target":
        inc(team, "shotsOn");
        break;
      case "shot_off_target":
        inc(team, "shotsOff");
        break;
      case "foul":
        inc(team, "fouls");
        break;
      case "yellow_card":
        inc(team, "yellow");
        break;
      case "red_card":
        inc(team, "red");
        break;
      case "save":
        inc(team, "saves");
        break;
      case "substitution":
        inc(team, "subs");
        break;
    }
  }

  const finish = (t: typeof home) => ({
    ...t,
    totalShots: t.shotsOn + t.shotsOff,
    shotAccuracy:
      t.shotsOn + t.shotsOff > 0
        ? Math.round((t.shotsOn / (t.shotsOn + t.shotsOff)) * 100)
        : 0,
  });

  return { home: finish(home), away: finish(away) };
}



export default function MatchViewerModal({ matchId, onClose }: Props) {
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"events" | "stats" | "squad">("events");

  useEffect(() => {
    axios
      .get(`${baseURL}/matches/${matchId}/details`)
      .then((res) => {
        setMatch(res.data.match);
        setEvents(res.data.events || []);
      })
      .catch((err) => console.error("[Frontend] Failed to fetch match details:", err))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) return <div className={styles.modal}>Loading…</div>;
  if (!match) return <div className={styles.modal}>Match not found</div>;

  const stats = calculateStats(events, match.home_team.id, match.away_team.id);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
    
        <div className={styles.header}>
          <h3>
            {match.home_team.name} {match.home_score} - {match.away_score} {match.away_team.name}
          </h3>
          <span className={styles.status}>
            {match.status === "in_progress" ? `${match.minute}' LIVE` : match.status.toUpperCase()}
          </span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>


        <div className={styles.tabs}>
          <button onClick={() => setTab("events")} className={tab === "events" ? styles.active : ""}>
            Events
          </button>
          <button onClick={() => setTab("stats")} className={tab === "stats" ? styles.active : ""}>
            Stats
          </button>
          <button onClick={() => setTab("squad")} className={tab === "squad" ? styles.active : ""}>
            Squad
          </button>
        </div>

        <div className={styles.content}>
          {tab === "events" && <LiveMatchTimeline matchId={matchId} />}
          {tab === "stats" && (
            <div className={styles.stats}>
              <div>Shots on Target: {stats.home.shotsOn} - {stats.away.shotsOn}</div>
              <div>Shots off Target: {stats.home.shotsOff} - {stats.away.shotsOff}</div>
              <div>Total Shots: {stats.home.totalShots} - {stats.away.totalShots}</div>
              <div>Shot Accuracy: {stats.home.shotAccuracy}% - {stats.away.shotAccuracy}%</div>
              <div>Fouls: {stats.home.fouls} - {stats.away.fouls}</div>
              <div>Yellow Cards: {stats.home.yellow} - {stats.away.yellow}</div>
              <div>Red Cards: {stats.home.red} - {stats.away.red}</div>
              <div>Saves: {stats.home.saves} - {stats.away.saves}</div>
              <div>Substitutions: {stats.home.subs} - {stats.away.subs}</div>
            </div>
          )}
          {tab === "squad" && (
            <div className={styles.squads}>
              <div>
                <h4>{match.home_team.name}</h4>
                <p>No squad data yet — just team name for now.</p>
              </div>
              <div>
                <h4>{match.away_team.name}</h4>
                <p>No squad data yet — just team name for now.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}*/
