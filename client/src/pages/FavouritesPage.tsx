// src/pages/FavouritesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
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
  logo_url?: string;
};

type LeagueRow = {
  pos: number;
  team: string;
  pts: number;
};
type StandingsMap = Partial<Record<LeagueId, LeagueRow[]>>;

// Supported leagues from ESPN
const SUPPORTED_LEAGUES: LeagueId[] = LEAGUE_OPTIONS.map((option) => option.id);
const REMOVABLE_TOKENS = ["afc", "fc", "cf", "ac", "sc", "ssc", "club", "de", "the"];

// ✅ Extended list of official main-league teams (EPL + LaLiga + Serie A + Bundesliga + Ligue 1)
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

const FavouritesPage: React.FC = () => {
  const { user } = useUser();
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [favourites, setFavourites] = useState<Team[]>([]);
  const [standings, setStandings] = useState<StandingsMap>({});

  // Load all teams + favourites
  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamsRes = await axios.get(`${baseURL}/teams`);
        setAllTeams(teamsRes.data);
        if (user?.id) {
          const favRes = await axios.get(`${baseURL}/favourite-teams/${user.id}`);
          const normalized = favRes.data.map((f: any) => ({
            id: f.team_id,
            name: f.team_name,
            logo_url: f.logo,
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

  // Build standings index
  const standingsIndex = useMemo(() => {
    const index: Record<string, { pos: number; pts: number }> = {};
    Object.values(standings).forEach((rows) => {
      rows.forEach(({ team, pos, pts }) => {
        generateNameVariants(team).forEach((variant) => {
          if (!index[variant]) index[variant] = { pos, pts };
        });
      });
    });
    return index;
  }, [standings]);

  const getTeamStats = (teamName: string) => {
    for (const key of generateNameVariants(teamName)) {
      const match = standingsIndex[key];
      if (match) return match;
    }
    return { pos: "N/A", pts: "N/A" };
  };

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
      const normalized = favRes.data.map((f: any) => ({
        id: f.team_id,
        name: f.team_name,
        logo_url: f.logo,
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
      const normalized = favRes.data.map((f: any) => ({
        id: f.team_id,
        name: f.team_name,
        logo_url: f.logo,
      }));
      setFavourites(normalized);
      notifyFavouritesUpdated(resolveNumericUserId(), "unfollow");
    } catch (err) {
      console.error("❌ Failed to unfollow:", err);
    }
  };

  // ✅ Filter only main-league teams
  const filteredTeams = allTeams.filter((team) =>
    MAIN_LEAGUE_TEAMS.includes(team.name)
  );

  // Partition
  const followingIds = new Set(favourites.map((f) => f.id));
  const notFollowing = filteredTeams.filter((t) => !followingIds.has(t.id));
  const favouriteTeamNames = useMemo(
    () => favourites.map((team) => team.name),
    [favourites]
  );

  return (
    <div className={styles.container}>
      <FavouriteTeamMatches teamNames={favouriteTeamNames} />
      <h2>Your Favourite Teams</h2>
      <div className={styles.section}>
        {favourites.length === 0 ? (
          <p>No favourite teams yet</p>
        ) : (
          favourites.map((team) => {
            const { pos, pts } = getTeamStats(team.name);
            return (
              <div key={team.id} className={styles.teamCard}>
                {team.logo_url && <img src={team.logo_url} alt={team.name} />}
                <span>{team.name}</span>
                <div className={styles.statsRow}>
                  <span className={styles.positionBadge}>#{pos}</span>
                  <span className={styles.pointsBadge}>{pts} pts</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <h2>Following</h2>
      <div className={styles.section}>
        {favourites.map((team) => (
          <div key={team.id} className={styles.listCard}>
            <div className={styles.listLeft}>
              {team.logo_url && <img src={team.logo_url} alt={team.name} />}
              <span>{team.name}</span>
            </div>
            <button className={styles.unfollow} onClick={() => handleUnfollow(team.id)}>
              Unfollow
            </button>
          </div>
        ))}
      </div>

      <h2>Not Following</h2>
      <div className={styles.section}>
        {notFollowing.map((team) => (
          <div key={team.id} className={styles.listCard}>
            <div className={styles.listLeft}>
              {team.logo_url && <img src={team.logo_url} alt={team.name} />}
              <span>{team.name}</span>
            </div>
            <button onClick={() => handleFollow(team.id)}>Follow</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavouritesPage;
