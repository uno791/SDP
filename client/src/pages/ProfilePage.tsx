import React, { useState, useEffect } from "react";
import UsernameDisplay from "../components/ProfilePageComp/UsernameDisplay";
import FavouriteTeams from "../components/ProfilePageComp/FavouriteTeams";
import ProfilePicture from "../components/ProfilePageComp/ProfilePicture";
import styles from "./ProfilePage.module.css";
import { useUser } from "../Users/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { baseURL } from "../config";
import { notifyFavouritesUpdated } from "../utils/favouritesCache";

type FavouriteTeam = {
  team_id: number;
  team_name: string;
  logo?: string;
};

const ProfilePage: React.FC = () => {
  const { user, username, setUser } = useUser();
  const [favouriteTeams, setFavouriteTeams] = useState<FavouriteTeam[]>([]);
  const [allTeams, setAllTeams] = useState<{ id: number; name: string; display_name?: string }[]>([]);
  const [profilePic, setProfilePic] = useState("/assets/messi.png"); // default Messi
  const navigate = useNavigate();

  // Fetch teams + favourites on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Fetch all teams
        const teamsRes = await axios.get(`${baseURL}/teams`);
        console.log("🟡 All teams from backend:", teamsRes.data);
        setAllTeams(teamsRes.data);

        // 2) Fetch user’s favourites
        if (user?.id) {
          const favRes = await axios.get(`${baseURL}/favourite-teams/${user.id}`);
          console.log("🟡 Raw favourites from backend:", favRes.data);

          // ✅ no need to re-map f.teams, backend already formatted
          const formatted = favRes.data.map((f: any) => ({
            team_id: f.team_id,
            team_name: f.team_name,
            logo: f.logo,
          }));

          console.log("🟢 Formatted favourites for state:", formatted);
          setFavouriteTeams(formatted);
        }
      } catch (err) {
        console.error("❌ Failed to fetch profile data:", err);
      }
    };

    fetchData();
  }, [user?.id]);

  // Handle sign out
  const handleSignOut = () => {
    setUser(null);
    navigate("/login");
  };

  // Handle saving/updating favourites
  const handleUpdateTeams = async (teamNames: string[]) => {
    try {
      if (!user?.id) return;

      const currentNames = favouriteTeams.map((f) => f.team_name);

      const added = teamNames.filter((t) => !currentNames.includes(t));
      const removed = currentNames.filter((t) => !teamNames.includes(t));

      // Add new teams
      for (const teamName of added) {
        const team = allTeams.find(
          (t) => t.display_name === teamName || t.name === teamName
        );
        if (team) {
          await axios.post(`${baseURL}/favourite-teams`, {
            userId: user.id,
            teamId: team.id, // ✅ only send ID
          });
        }
      }

      // Remove deleted teams
      if (removed.length > 0) {
        for (const fav of favouriteTeams) {
          if (removed.includes(fav.team_name)) {
            await axios.delete(`${baseURL}/favourite-teams/${user.id}/${fav.team_id}`);
          }
        }
      }

      // Refresh
      const updatedRes = await axios.get(`${baseURL}/favourite-teams/${user.id}`);
      const formatted = updatedRes.data.map((f: any) => ({
        team_id: f.team_id,
        team_name: f.team_name,
        logo: f.logo,
      }));
      setFavouriteTeams(formatted);
      const numericUserId = Number(user.id);
      notifyFavouritesUpdated(
        Number.isFinite(numericUserId) ? numericUserId : undefined,
        "profile-update"
      );
    } catch (err) {
      console.error("❌ Failed to update favourites:", err);
    }
  };

  console.log("🔵 Passing to FavouriteTeams:", favouriteTeams);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <UsernameDisplay username={username || "Guest"} />
        <ProfilePicture selected={profilePic} onChange={setProfilePic} />

        {/* ✅ Pass full objects directly */}
        <FavouriteTeams
          teams={favouriteTeams}
          onUpdate={handleUpdateTeams}
          availableTeams={allTeams.map((t) => t.display_name || t.name)}
        />

        <button onClick={handleSignOut} className={styles.signOutButton}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;





/*import React, { useState, useEffect } from "react";
import UsernameDisplay from "../components/ProfilePageComp/UsernameDisplay";
import FavouriteTeams from "../components/ProfilePageComp/FavouriteTeams";
import ProfilePicture from "../components/ProfilePageComp/ProfilePicture";
import styles from "./ProfilePage.module.css";
import { useUser } from "../Users/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { baseURL } from "../config";

type FavouriteTeam = {
  team_id: number;
  team_name: string;
  logo?: string;
};

const ProfilePage: React.FC = () => {
  const { user, username, setUser } = useUser();
  const [favouriteTeams, setFavouriteTeams] = useState<FavouriteTeam[]>([]);
  const [allTeams, setAllTeams] = useState<{ id: number; name: string; display_name?: string }[]>([]);
  const [profilePic, setProfilePic] = useState("/assets/messi.png"); // default Messi
  const navigate = useNavigate();

  // Fetch teams + favourites on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Fetch all teams
        const teamsRes = await axios.get(`${baseURL}/teams`);
        setAllTeams(teamsRes.data);

        // 2) Fetch user’s favourites
        if (user?.id) {
          const favRes = await axios.get(`${baseURL}/favourite-teams/${user.id}`);
          const formatted = favRes.data.map((f: any) => ({
            team_id: f.team_id,
            team_name: f.teams?.display_name || f.teams?.name,
            logo: f.teams?.logo_url,
          }));
          setFavouriteTeams(formatted);
        }
      } catch (err) {
        console.error("❌ Failed to fetch profile data:", err);
      }
    };

    fetchData();
  }, [user?.id]);

  // Handle sign out
  const handleSignOut = () => {
    setUser(null);
    navigate("/login");
  };

  // Handle saving/updating favourites
  const handleUpdateTeams = async (teamNames: string[]) => {
    try {
      if (!user?.id) return;

      const currentNames = favouriteTeams.map((f) => f.team_name);

      const added = teamNames.filter((t) => !currentNames.includes(t));
      const removed = currentNames.filter((t) => !teamNames.includes(t));

      // Add new teams
      for (const teamName of added) {
        const team = allTeams.find(
          (t) => t.display_name === teamName || t.name === teamName
        );
        if (team) {
          await axios.post(`${baseURL}/favourite-teams`, {
            userId: user.id,
            teamId: team.id,   // ✅ only send ID
          });
        }
      }

      // Remove deleted teams
      if (removed.length > 0) {
        for (const fav of favouriteTeams) {
          if (removed.includes(fav.team_name)) {
            await axios.delete(`${baseURL}/favourite-teams/${user.id}/${fav.team_id}`);
          }
        }
      }

      // Refresh
      const updatedRes = await axios.get(`${baseURL}/favourite-teams/${user.id}`);
      const formatted = updatedRes.data.map((f: any) => ({
        team_id: f.team_id,
        team_name: f.teams?.display_name || f.teams?.name,
        logo: f.teams?.logo_url,
      }));
      setFavouriteTeams(formatted);
    } catch (err) {
      console.error("❌ Failed to update favourites:", err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <UsernameDisplay username={username || "Guest"} />
        <ProfilePicture selected={profilePic} onChange={setProfilePic} />

        <FavouriteTeams
          teams={favouriteTeams.map((f) => f.team_name)} // show names only
          onUpdate={handleUpdateTeams}
          availableTeams={allTeams.map((t) => t.display_name || t.name)}
        />

        <button onClick={handleSignOut} className={styles.signOutButton}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;*/
