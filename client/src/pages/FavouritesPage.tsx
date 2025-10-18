// src/pages/FavouritesPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../components/FavouritePageComp/FavouritesPage.module.css";
import { useUser } from "../Users/UserContext";
import axios from "axios";
import { baseURL } from "../config";
import { fetchEplStandings, type LeagueId } from "../api/espn";
import { LEAGUE_OPTIONS } from "../components/FavouritePageComp/leagues";
import FavouriteTeamMatches from "../components/FavouritePageComp/FavouriteTeamMatches";
import { notifyFavouritesUpdated } from "../utils/favouritesCache";

type Team = {
  id: number;
  name: string;
  display_name?: string;
  logo_url?: string;
  league_code?: string | null;
};

type LeagueRow = {
  pos: number;
  team: string;
  pts: number;
};
type StandingsMap = Partial<Record<LeagueId, LeagueRow[]>>;
type LeagueFilter = "all" | LeagueId;

// Supported leagues from ESPN
const SUPPORTED_LEAGUES: LeagueId[] = LEAGUE_OPTIONS.map((option) => option.id);
const REMOVABLE_TOKENS = ["afc", "fc", "cf", "ac", "sc", "ssc", "club", "de", "the"];

// ✅ Filter out UEFA competitions from dropdown
const LEAGUE_FILTER_OPTIONS: Array<{ id: LeagueFilter; label: string }> = [
  { id: "all", label: "All Leagues" },
  ...LEAGUE_OPTIONS.filter(
    (option) => !["ucl", "uel", "uecl"].includes(option.id)
  ),
];

// ✅ Hard-coded list of official main-league teams
const MAIN_LEAGUE_TEAMS = [
  // 🏴 Premier League
  "Arsenal","Aston Villa","Bournemouth","Brentford","Brighton & Hove Albion","Burnley",
  "Chelsea","Crystal Palace","Everton","Fulham","Leeds United","Liverpool",
  "Manchester City","Manchester United","Newcastle United","Nottingham Forest",
  "Sunderland","Tottenham Hotspur","West Ham United","Wolverhampton Wanderers",
  // 🇪🇸 LaLiga
  "Alavés","Athletic Club","Atlético Madrid","Barcelona","Celta Vigo","Elche","Espanyol",
  "Getafe","Girona","Levante","Mallorca","Osasuna","Rayo Vallecano","Real Betis",
  "Real Madrid","Real Sociedad","Sevilla","Valencia","Villarreal",
  // 🇮🇹 Serie A
  "AC Milan","AS Roma","Atalanta","Bologna","Cagliari","Como","Cremonese","Fiorentina",
  "Genoa","Hellas Verona","Internazionale","Juventus","Lazio","Lecce","Napoli","Parma",
  "Pisa","Sassuolo","Torino","Udinese",
  // 🇩🇪 Bundesliga
  "1. FC Heidenheim 1846","1. FC Union Berlin","Bayer Leverkusen","Bayern Munich",
  "Borussia Dortmund","Borussia Mönchengladbach","Eintracht Frankfurt","FC Augsburg",
  "FC Cologne","Hamburg SV","Mainz","RB Leipzig","SC Freiburg","St. Pauli",
  "TSG Hoffenheim","VfB Stuttgart","VfL Wolfsburg","Werder Bremen",
  // 🇫🇷 Ligue 1
  "AJ Auxerre","Angers","AS Monaco","Brest","Le Havre AC","Lens","Lille","Lorient",
  "Lyon","Marseille","Metz","Nantes","Nice","Paris FC","Paris Saint-Germain",
  "Stade Rennais","Strasbourg","Toulouse",
];

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function generateNameVariants(name: string): string[] {
  if (!name) return [];
  const variants = new Set<string>();
  const lower = name.toLowerCase().trim().replace(/\s+/g, " ");
  if (lower) variants.add(lower);
  const normalized = normalizeName(name);
  if (normalized) variants.add(normalized);
  if (normalized) {
    const tokens = normalized.split(" ").filter(Boolean);
    const filtered = tokens
      .filter((token) => !REMOVABLE_TOKENS.includes(token))
      .join(" ");
    if (filtered) {
      variants.add(filtered);
      variants.add(filtered.replace(/\s+/g, ""));
    }
    variants.add(normalized.replace(/\s+/g, ""));
  }
  if (lower) variants.add(lower.replace(/\s+/g, ""));
  return Array.from(variants).filter(Boolean);
}

function mapLeagueCodeToId(code: string | null | undefined): LeagueId | undefined {
  if (!code) return undefined;
  const normalized = code.toLowerCase();
  if (normalized.includes("premier")) return "eng1";
  if (normalized.includes("liga") && normalized.includes("la")) return "esp1";
  if (normalized.includes("serie") && normalized.includes("a")) return "ita1";
  if (normalized.includes("bundes")) return "ger1";
  if (normalized.includes("ligue")) return "fra1";
  if (normalized.includes("champion")) return "ucl";
  if (normalized.includes("conference")) return "uecl";
  if (normalized.includes("europa")) {
    return normalized.includes("conference") ? "uecl" : "uel";
  }
  return undefined;
}

function getTeamDisplayName(team: Team): string {
  return team.display_name?.trim() || team.name;
}

const FavouritesPage: React.FC = () => {
  const { user } = useUser();
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [favourites, setFavourites] = useState<Team[]>([]);
  const [standings, setStandings] = useState<StandingsMap>({});
  const [notFollowingLeague, setNotFollowingLeague] = useState<LeagueFilter>("all");

  // Load all teams + favourites
  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamsRes = await axios.get(`${baseURL}/teams`);
        const teams: Team[] = (teamsRes.data ?? []).map((team: any) => ({
          id: team.id,
          name: team.name,
          display_name: team.display_name ?? team.name,
          logo_url: team.logo_url,
          league_code: team.league_code ?? null,
        }));

        // ✅ Hard filter: only include official main-league teams
        const officialTeams = teams.filter((t) =>
          MAIN_LEAGUE_TEAMS.some(
            (official) => official.toLowerCase() === t.name.toLowerCase().trim()
          )
        );

        setAllTeams(officialTeams);

        if (user?.id) {
          const favRes = await axios.get(`${baseURL}/favourite-teams/${user.id}`);
          const normalized: Team[] = (favRes.data ?? []).map((f: any) => ({
            id: f.team_id,
            name: f.team_name,
            display_name: f.team_name,
            logo_url: f.logo,
            league_code: f.league_code ?? null,
          }));
          setFavourites(normalized);
        }
      } catch (err) {
        console.error("❌ Failed to fetch favourites page:", err);
      }
    };
    fetchData();
  }, [user?.id]);

  // Load standings for all supported leagues
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const season = new Date().getFullYear();
        const results = await Promise.all(
          SUPPORTED_LEAGUES.map(async (league) => {
            try {
              const rows = await fetchEplStandings({ season, level: 3, league });
              return { league, rows };
            } catch (leagueError) {
              console.error("[FavouritesPage] Failed to fetch standings:", league, leagueError);
              return { league, rows: [] as LeagueRow[] };
            }
          })
        );
        const map: StandingsMap = {};
        results.forEach(({ league, rows }) => {
          map[league] = rows;
        });
        setStandings(map);
      } catch (err) {
        console.error("[FavouritesPage] Failed to fetch standings:", err);
      }
    };
    fetchStandings();
  }, []);

  // Build standings + league indices
  const { statsByVariant, leagueByVariant } = useMemo(() => {
    const stats: Record<string, { pos: number; pts: number }> = {};
    const leagues: Record<string, LeagueId> = {};
    Object.entries(standings).forEach(([league, rows]) => {
      (rows ?? []).forEach(({ team, pos, pts }) => {
        generateNameVariants(team).forEach((variant) => {
          if (!stats[variant]) {
            stats[variant] = { pos, pts };
          }
          if (!leagues[variant]) {
            leagues[variant] = league as LeagueId;
          }
        });
      });
    });
    return { statsByVariant: stats, leagueByVariant: leagues };
  }, [standings]);

  const getTeamStats = (teamName: string) => {
    for (const key of generateNameVariants(teamName)) {
      const match = statsByVariant[key];
      if (match) return match;
    }
    return { pos: "N/A", pts: "N/A" };
  };

  const getTeamLeague = useCallback(
    (team: Team): LeagueId | undefined => {
      const fromCode = mapLeagueCodeToId(team.league_code ?? undefined);
      if (fromCode) return fromCode;
      const candidates = [team.name, team.display_name].filter(
        (value): value is string => typeof value === "string"
      );
      for (const candidate of candidates) {
        for (const variant of generateNameVariants(candidate)) {
          const league = leagueByVariant[variant];
          if (league) return league;
        }
      }
      return undefined;
    },
    [leagueByVariant]
  );

  const resolveNumericUserId = (): number | undefined => {
    if (!user?.id) return undefined;
    const parsed = Number(user.id);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  // Follow / Unfollow
  const handleFollow = async (teamId: number) => {
    if (!user?.id) return;
    try {
      await axios.post(`${baseURL}/favourite-teams`, { userId: user.id, teamId });
      const favRes = await axios.get(`${baseURL}/favourite-teams/${user.id}`);
      const normalized: Team[] = (favRes.data ?? []).map((f: any) => ({
        id: f.team_id,
        name: f.team_name,
        display_name: f.team_name,
        logo_url: f.logo,
        league_code: f.league_code ?? null,
      }));
      setFavourites(normalized);
      notifyFavouritesUpdated(resolveNumericUserId(), "follow");
    } catch (err) {
      console.error("❌ Failed to follow:", err);
    }
  };

  const handleUnfollow = async (teamId: number) => {
    if (!user?.id) return;
    try {
      await axios.delete(`${baseURL}/favourite-teams/${user.id}/${teamId}`);
      const favRes = await axios.get(`${baseURL}/favourite-teams/${user.id}`);
      const normalized: Team[] = (favRes.data ?? []).map((f: any) => ({
        id: f.team_id,
        name: f.team_name,
        display_name: f.team_name,
        logo_url: f.logo,
        league_code: f.league_code ?? null,
      }));
      setFavourites(normalized);
      notifyFavouritesUpdated(resolveNumericUserId(), "unfollow");
    } catch (err) {
      console.error("❌ Failed to unfollow:", err);
    }
  };

  // Partition favourites vs available teams
  const notFollowing = useMemo(() => {
    const followingIds = new Set(favourites.map((f) => f.id));
    return allTeams.filter((team) => !followingIds.has(team.id));
  }, [allTeams, favourites]);

  const filteredNotFollowing = useMemo(() => {
    if (notFollowingLeague === "all") return notFollowing;
    return notFollowing.filter(
      (team) => getTeamLeague(team) === notFollowingLeague
    );
  }, [notFollowing, notFollowingLeague, getTeamLeague]);

  const favouriteTeamNames = useMemo(
    () => favourites.map((team) => team.name),
    [favourites]
  );

  return (
    <div className={styles.container}>
      <FavouriteTeamMatches teamNames={favouriteTeamNames} />

      <h2 className={styles.sectionTitle}>Your Favourite Teams</h2>
      <div className={styles.section}>
        {favourites.length === 0 ? (
          <p>No favourite teams yet</p>
        ) : (
          favourites.map((team) => {
            const { pos, pts } = getTeamStats(team.name);
            const displayName = getTeamDisplayName(team);
            return (
              <div key={team.id} className={styles.teamCard}>
                {team.logo_url && <img src={team.logo_url} alt={displayName} />}
                <span>{displayName}</span>
                <div className={styles.statsRow}>
                  <span className={styles.positionBadge}>#{pos}</span>
                  <span className={styles.pointsBadge}>{pts} pts</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <h2 className={styles.sectionTitle}>Following</h2>
      <div className={styles.section}>
        {favourites.map((team) => {
          const displayName = getTeamDisplayName(team);
          return (
            <div key={team.id} className={styles.listCard}>
              <div className={styles.listLeft}>
                {team.logo_url && <img src={team.logo_url} alt={displayName} />}
                <span>{displayName}</span>
              </div>
              <button className={styles.unfollow} onClick={() => handleUnfollow(team.id)}>
                Unfollow
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Not Following</h2>
        <div className={styles.sectionControls}>
          <div className={styles.selectWrap}>
            <label className={styles.selectLabel} htmlFor="notFollowingLeague">
              League
            </label>
            <select
              id="notFollowingLeague"
              className={styles.leagueSelect}
              value={notFollowingLeague}
              onChange={(event) =>
                setNotFollowingLeague(event.target.value as LeagueFilter)
              }
            >
              {LEAGUE_FILTER_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        {filteredNotFollowing.length === 0 ? (
          <div className={styles.notFollowingEmpty}>
            No teams available in this league.
          </div>
        ) : (
          filteredNotFollowing.map((team) => {
            const displayName = getTeamDisplayName(team);
            return (
              <div key={team.id} className={styles.listCard}>
                <div className={styles.listLeft}>
                  {team.logo_url && <img src={team.logo_url} alt={displayName} />}
                  <span>{displayName}</span>
                </div>
                <button onClick={() => handleFollow(team.id)}>Follow</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FavouritesPage;
