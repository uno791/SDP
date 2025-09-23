// src/pages/FavouritesPage.tsx
import React, { useEffect, useState } from "react";
import styles from "../components/FavouritePageComp/FavouritesPage.module.css";
import { useUser } from "../Users/UserContext";
import axios from "axios";
import { baseURL } from "../config";
import { fetchEplStandings } from "../api/espn"; // ✅ import ESPN helper

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

// Official Premier League teams (+ Leeds + Sunderland)
const premierLeagueTeams = [
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
          const favRes = await axios.get(
            `${baseURL}/favourite-teams/${user.id}`
          );

          // Normalize backend favourites into Team shape
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

  // Load EPL standings from ESPN
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
      await axios.post(`${baseURL}/favourite-teams`, {
        userId: user.id,
        teamId,
      });
      const favRes = await axios.get(`${baseURL}/favourite-teams/${user.id}`);
      const normalized = favRes.data.map((f: any) => ({
        id: f.team_id,
        name: f.team_name,
        logo_url: f.logo,
      }));
      setFavourites(normalized);
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
    } catch (err) {
      console.error("❌ Failed to unfollow:", err);
    }
  };

  // Filter only Premier League teams
  const filteredTeams = allTeams.filter((team) =>
    premierLeagueTeams.includes(team.name)
  );

  // Partition
  const followingIds = new Set(favourites.map((f) => f.id));
  const notFollowing = filteredTeams.filter((t) => !followingIds.has(t.id));

  return (
    <div className={styles.container}>
      {/* Favourites stay as square cards WITH position + points */}
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

      {/* Following → elongated row cards */}
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

      {/* Available → elongated row cards */}
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


// src/pages/FavouritesPage.tsx
/*import React, { useEffect, useState } from "react";
import styles from "../components/FavouritePageComp/FavouritesPage.module.css";
import { useUser } from "../Users/UserContext";
import axios from "axios";
import { baseURL } from "../config";

type Team = {
  id: number;
  name: string;
  logo_url?: string;
};

// Official Premier League teams (+ Leeds + Sunderland)
const premierLeagueTeams = [
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
];

const FavouritesPage: React.FC = () => {
  const { user } = useUser();
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [favourites, setFavourites] = useState<Team[]>([]);

  // Load all teams + favourites
  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamsRes = await axios.get(`${baseURL}/teams`);
        setAllTeams(teamsRes.data);

        if (user?.id) {
          const favRes = await axios.get(
            `${baseURL}/favourite-teams/${user.id}`
          );

          // Normalize backend favourites into Team shape
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

  // Follow
  const handleFollow = async (teamId: number) => {
    if (!user?.id) return;
    try {
      await axios.post(`${baseURL}/favourite-teams`, {
        userId: user.id,
        teamId,
      });
      const favRes = await axios.get(`${baseURL}/favourite-teams/${user.id}`);
      const normalized = favRes.data.map((f: any) => ({
        id: f.team_id,
        name: f.team_name,
        logo_url: f.logo,
      }));
      setFavourites(normalized);
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
    } catch (err) {
      console.error("❌ Failed to unfollow:", err);
    }
  };

  // Filter only Premier League teams
  const filteredTeams = allTeams.filter((team) =>
    premierLeagueTeams.includes(team.name)
  );

  // Partition
  const followingIds = new Set(favourites.map((f) => f.id));
  const notFollowing = filteredTeams.filter((t) => !followingIds.has(t.id));

  return (
    <div className={styles.container}>
   
      <h2>Your Favourite Teams</h2>
      <div className={styles.section}>
        {favourites.length === 0 ? (
          <p>No favourite teams yet</p>
        ) : (
          favourites.map((team) => (
            <div key={team.id} className={styles.teamCard}>
              {team.logo_url && <img src={team.logo_url} alt={team.name} />}
              <span>{team.name}</span>
            </div>
          ))
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
            <button
              className={styles.unfollow}
              onClick={() => handleUnfollow(team.id)}
            >
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

export default FavouritesPage;*/





// src/pages/FavouritesPage.tsx
/*import React, { useEffect, useState } from "react";
import styles from "../components/FavouritePageComp/FavouritesPage.module.css";
import { useUser } from "../Users/UserContext";
import axios from "axios";
import { baseURL } from "../config";

type Team = {
  id: number;
  name: string;
  display_name?: string;
  logo_url?: string;
  position?: number; // stub for now
};

const FavouritesPage: React.FC = () => {
  const { user } = useUser();
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [favourites, setFavourites] = useState<Team[]>([]);

  // Load all teams + favourites
  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamsRes = await axios.get(`${baseURL}/teams`);
        setAllTeams(teamsRes.data);

        if (user?.id) {
          const favRes = await axios.get(`${baseURL}/favourite-teams/${user.id}`);
          setFavourites(favRes.data);
        }
      } catch (err) {
        console.error("❌ Failed to fetch favourites page:", err);
      }
    };
    fetchData();
  }, [user?.id]);

  // Follow
  const handleFollow = async (teamId: number) => {
    if (!user?.id) return;
    try {
      await axios.post(`${baseURL}/favourite-teams`, {
        userId: user.id,
        teamId,
      });
      const updated = await axios.get(`${baseURL}/favourite-teams/${user.id}`);
      setFavourites(updated.data);
    } catch (err) {
      console.error("❌ Failed to follow:", err);
    }
  };

  // Unfollow
  const handleUnfollow = async (teamId: number) => {
    if (!user?.id) return;
    try {
      await axios.delete(`${baseURL}/favourite-teams/${user.id}/${teamId}`);
      const updated = await axios.get(`${baseURL}/favourite-teams/${user.id}`);
      setFavourites(updated.data);
    } catch (err) {
      console.error("❌ Failed to unfollow:", err);
    }
  };

  // Partition teams
  const followingIds = new Set(favourites.map((f) => f.id));
  const notFollowing = allTeams.filter((t) => !followingIds.has(t.id));

  return (
    <div className={styles.container}>
      <h2>Your Favourite Teams</h2>
      <div className={styles.section}>
        {favourites.length === 0 ? (
          <p>No favourite teams yet</p>
        ) : (
          favourites.map((team) => (
            <div key={team.id} className={styles.teamCard}>
              {team.logo_url && <img src={team.logo_url} alt={team.name} />}
              <span>{team.display_name || team.name}</span>
              <p>Position: {team.position || "N/A"}</p>
            </div>
          ))
        )}
      </div>

      <h2>Following</h2>
      <div className={styles.section}>
        {favourites.map((team) => (
          <div key={team.id} className={styles.teamCard}>
            {team.logo_url && <img src={team.logo_url} alt={team.name} />}
            <span>{team.display_name || team.name}</span>
            <button
              className={`${styles.unfollow}`}
              onClick={() => handleUnfollow(team.id)}
            >
              Unfollow
            </button>
          </div>
        ))}
      </div>

      <h2>Available to Follow</h2>
      <div className={styles.section}>
        {notFollowing.map((team) => (
          <div key={team.id} className={styles.teamCard}>
            {team.logo_url && <img src={team.logo_url} alt={team.name} />}
            <span>{team.display_name || team.name}</span>
            <button onClick={() => handleFollow(team.id)}>Follow</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavouritesPage;*/
