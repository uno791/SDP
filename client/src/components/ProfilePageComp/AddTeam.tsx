import React, { useState } from "react";
import styles from "./AddTeam.module.css";

interface AddTeamProps {
  onAdd: (team: string) => void;
}

const dummyTeams = [
  "Chelsea",
  "Arsenal",
  "Liverpool",
  "Man United",
  "Man City",
];

const AddTeam: React.FC<AddTeamProps> = ({ onAdd }) => {
  const [selectedTeam, setSelectedTeam] = useState("");

  const handleAdd = () => {
    if (selectedTeam) {
      onAdd(selectedTeam);
      setSelectedTeam(""); // reset
    }
  };

  return (
    <div className={styles.container}>
      <select
        className={styles.select}
        value={selectedTeam}
        onChange={(e) => setSelectedTeam(e.target.value)}
      >
        <option value="">Select a team</option>
        {dummyTeams.map((team) => (
          <option key={team} value={team}>
            {team}
          </option>
        ))}
      </select>
      <button className={styles.addButton} onClick={handleAdd}>
        Add
      </button>
    </div>
  );
};

export default AddTeam;
