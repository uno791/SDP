import React, { useState, useEffect } from "react";
import styles from "./FavouriteTeams.module.css";

interface FavouriteTeam {
  team_id: number;
  team_name: string;
  logo?: string;
}

interface FavouriteTeamsProps {
  teams: FavouriteTeam[];
  onUpdate: (teams: string[]) => void; // still pass names upward
  availableTeams: string[];
}

const FavouriteTeams: React.FC<FavouriteTeamsProps> = ({
  teams,
  onUpdate,
  availableTeams,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(
    teams.map((t) => t.team_name)
  );

  // ✅ Sync selectedTeams whenever props.teams changes
  useEffect(() => {
    setSelectedTeams(teams.map((t) => t.team_name));
  }, [teams]);

  const handleSave = () => {
    onUpdate(selectedTeams);
    setIsEditing(false);
  };

  const handleToggle = (teamName: string) => {
    if (selectedTeams.includes(teamName)) {
      setSelectedTeams(selectedTeams.filter((t) => t !== teamName));
    } else {
      setSelectedTeams([...selectedTeams, teamName]);
    }
  };

  return (
    <div className={styles.container}>
      <h3>Favourite Teams</h3>

      {!isEditing ? (
        <div className={styles.teamsList}>
          {teams.length === 0 ? (
            <p>No favourite teams set</p>
          ) : (
            teams.map((t) => (
              <div key={t.team_id} className={styles.teamCard}>
                {t.logo && (
                  <img
                    src={t.logo}
                    alt={t.team_name}
                    className={styles.teamLogo}
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <span>{t.team_name}</span>
              </div>
            ))
          )}
          <button onClick={() => setIsEditing(true)}>Edit</button>
        </div>
      ) : (
        <div className={styles.editMode}>
          {availableTeams.map((teamName) => (
            <label key={teamName} className={styles.option}>
              <input
                type="checkbox"
                checked={selectedTeams.includes(teamName)}
                onChange={() => handleToggle(teamName)}
              />
              {teamName}
            </label>
          ))}
          <button onClick={handleSave}>Save</button>
        </div>
      )}
    </div>
  );
};

export default FavouriteTeams;
