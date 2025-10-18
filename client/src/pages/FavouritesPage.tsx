// src/pages/FavouritesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import styles from "../components/FavouritePageComp/FavouritesPage.module.css";
import { useUser } from "../Users/UserContext";
import axios from "axios";
import { baseURL } from "../config";
import { fetchEplStandings } from "../api/espn";
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

// ✅ Extended list: Premier League + LaLiga + Serie A + Bundesliga + Ligue 1
const mainLeagueTeams = [
  // 🏴 Premier League
  "Arsenal",
  "Aston Villa",
  "Bournemouth",
  "Brentford",
  "Brighton & Hove Albion",
  "Burnley",
  "Chelsea",
  "Crystal Palace",
  "Everton",
  "Fulham",
  "Leeds United",
  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Newcastle United",
  "Nottingham Forest",
  "Sunderland",
  "Tottenham Hotspur",
  "West Ham United",
  "Wolverhampton Wanderers",

  // 🇪🇸 LaLiga
  "Alavés",
  "Athletic Club",
  "Atlético Madrid",
  "Barcelona",
  "Celta Vigo",
  "Elche",
  "Espanyol",
  "Getafe",
  "Girona",
  "Levante",
  "Mallorca",
  "Osasuna",
  "Rayo Vallecano",
  "Real Betis",
  "Real Madrid",
  "Real Sociedad",
  "Sevilla",
  "Valencia",
  "Villarreal",

  // 🇮🇹 Serie A
  "AC Milan",
  "AS Roma",
  "Atalanta",
  "Bologna",
  "Cagliari",
  "Como",
  "Cremonese",
  "Fiorentina",
  "Genoa",
  "Hellas Verona",
  "Internazionale",
  "Juventus",
  "Lazio",
  "Lecce",
  "Napoli",
  "Parma",
  "Pisa",
  "Sassuolo",
  "Torino",
  "Udinese",

  // 🇩🇪 Bundesliga
  "1. FC Heidenheim 1846",
  "1. FC Union Berlin",
  "Bayer Leverkusen",
  "Bayern Munich",
  "Borussia Dortmund",
  "Borussia Mönchengladbach",
  "Eintracht Frankfurt",
  "FC Augsburg",
  "FC Cologne",
  "Hamburg SV",
  "Mainz",
  "RB Leipzig",
  "SC Freiburg",
  "St. Pauli",
  "TSG Hoffenheim",
  "VfB Stuttgart",
  "VfL Wolfsburg",
  "Werder Bremen",

  // 🇫🇷 Ligue 1
  "AJ Auxerre",
  "Angers",
  "AS Monaco",
  "Brest",
  "Le Havre AC",
  "Lens",
  "Lille",
  "Lorient",
  "Lyon",
  "Marseille",
  "Metz",
  "Nantes",
  "Nice",
  "Paris FC",
  "Paris Saint-Germain",
  "Stade Rennais",
  "Strasbourg",
  "Toulouse",
];

const FavouritesPage: React.FC = () => {
  const { user } = useUser();
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [favourites, setFavourites] = useState<Team[]>([]);
  const [standings, setStandings] = useState<LeagueRow[]>([]);

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

  // Load EPL standings from ESPN (for badges)
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const rows = await fetchEplStandings({
          season: new Date().getFullYear(),
          level: 3,
        });
        setStandings(rows);
      } catch (err) {
        console.error("❌ Failed to fetch standings:", err);
      }
    };
    fetchStandings();
  }, []);

  // Lookup team stats
  const getTeamStats = (teamName: string) => {
    const row = standings.find((r) => r.team === teamName);
    return row ? { pos: row.pos, pts: row.pts } : { pos: "N/A", pts: "N/A" };
  };

  // Follow
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
      notifyFavouritesUpdated(user.id, "follow");
    } catch (err) {
      console.error("❌ Failed to follow:", err);
    }
  };

  // Unfollow
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
      notifyFavouritesUpdated(user.id, "unfollow");
    } catch (err) {
      console.error("❌ Failed to unfollow:", err);
    }
  };

  // ✅ Filter only main league teams (extended list)
  const filteredTeams = allTeams.filter((team) =>
    mainLeagueTeams.includes(team.name)
  );

  // Partition teams
  const followingIds = new Set(favourites.map((f) => f.id));
  const notFollowing = filteredTeams.filter((t) => !followingIds.has(t.id));
  const favouriteTeamNames = useMemo(
    () => favourites.map((team) => team.name),
    [favourites]
  );

  return (
    <div className={styles.container}>
      <FavouriteTeamMatches teamNames={favouriteTeamNames} />

      {/* Favourite Teams with stats */}
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

      {/* Following list */}
      <h2>Following</h2>
      <div className={styles.section}>
        {favourites.map((team) => (
          <div key={team.id} className={styles.listCard}>
            <div className={styles.listLeft}>
              {team.logo_url && <img src={team.logo_url} alt={team.name} />}
              <span>{team.name}</span>
            </div>
            <button
              className={styles.unfollow}
              onClick={() => handleUnfollow(team.id)}
            >
              Unfollow
            </button>
          </div>
        ))}
      </div>

      {/* Not Following list */}
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
