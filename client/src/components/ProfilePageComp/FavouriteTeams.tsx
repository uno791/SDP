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
  console.log("🔴 FavouriteTeams component received:", teams);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(
    teams.map((t) => t.team_name)
  );

  // ✅ Sync selectedTeams whenever props.teams changes
  useEffect(() => {
    setSelectedTeams(teams.map((t) => t.team_name));
  }, [teams]);

  const handleSave = () => {
    console.log("✅ Saving selected teams:", selectedTeams);
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
                  <img src={t.logo} alt={t.team_name} className={styles.teamLogo} />
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



/*import React, { useState } from "react";
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
  console.log("🔴 FavouriteTeams component received:", teams);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(
    teams.map((t) => t.team_name)
  );

  const handleSave = () => {
    console.log("✅ Saving selected teams:", selectedTeams);
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
                  <img src={t.logo} alt={t.team_name} className={styles.teamLogo} />
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

export default FavouriteTeams;*/



/*import React, { useState } from "react";
import TeamCard from "./TeamCard";
import styles from "./FavouriteTeams.module.css";
import AddTeam from "./AddTeam";

interface FavouriteTeamsProps {
  teams: string[];
  onUpdate: (teams: string[]) => void;
  availableTeams: string[];
}

const FavouriteTeams: React.FC<FavouriteTeamsProps> = ({
  teams,
  onUpdate,
  availableTeams,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTeams, setDraftTeams] = useState<string[]>(teams);

  const handleRemove = (team: string) => {
    setDraftTeams(draftTeams.filter((t) => t !== team));
  };

  const handleAdd = (team: string) => {
    if (!draftTeams.includes(team)) {
      setDraftTeams([...draftTeams, team]);
    }
  };

  const handleSave = () => {
    onUpdate(draftTeams);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftTeams(teams); // reset to original
    setIsEditing(false);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Favourite Teams</h3>

      {!isEditing ? (
        <div className={styles.readOnly}>
          {teams.length > 0 ? (
            <ul className={styles.teamList}>
              {teams.map((team) => (
                <li key={team}>{team}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No favourite teams set.</p>
          )}
          <button
            className={styles.editButton}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        </div>
      ) : (
        <div className={styles.editMode}>
          <div className={styles.editList}>
            {draftTeams.map((team) => (
              <TeamCard key={team} team={team} onRemove={handleRemove} />
            ))}
          </div>
          <AddTeam onAdd={handleAdd} availableTeams={availableTeams} />
          <div className={styles.actions}>
            <button className={styles.saveButton} onClick={handleSave}>
              Save
            </button>
            <button className={styles.cancelButton} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavouriteTeams;*/
