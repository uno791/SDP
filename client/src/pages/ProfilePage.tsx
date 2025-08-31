import React, { useState } from "react";
import UsernameDisplay from "../components/ProfilePageComp/UsernameDisplay";
import FavouriteTeams from "../components/ProfilePageComp/FavouriteTeams";
import ProfilePicture from "../components/ProfilePageComp/ProfilePicture";
import styles from "./ProfilePage.module.css";
import { useUser } from "../Users/UserContext";
import { useNavigate } from "react-router-dom";

const ProfilePage: React.FC = () => {
  const { username, setUser } = useUser();
  const [favouriteTeams, setFavouriteTeams] = useState<string[]>([
    "Chelsea",
    "Arsenal",
  ]);
  const [profilePic, setProfilePic] = useState("/assets/messi.png"); // default Messi
  const navigate = useNavigate();

  const handleSignOut = () => {
    setUser(null);
    navigate("/loginpage");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <UsernameDisplay username={username || "Guest"} />
        <ProfilePicture selected={profilePic} onChange={setProfilePic} />

        {/* Read-only list by default; edit mode lives inside this component */}
        <FavouriteTeams teams={favouriteTeams} onUpdate={setFavouriteTeams} />

        <button onClick={handleSignOut} className={styles.signOutButton}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
