import React, { useState } from "react";
import TeamCard from "./TeamCard";
import styles from "./FavouriteTeams.module.css";
import AddTeam from "./AddTeam";

interface FavouriteTeamsProps {
  teams: string[];
  onUpdate: (teams: string[]) => void;
}

const FavouriteTeams: React.FC<FavouriteTeamsProps> = ({ teams, onUpdate }) => {
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
          <AddTeam onAdd={handleAdd} />
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

export default FavouriteTeams;
