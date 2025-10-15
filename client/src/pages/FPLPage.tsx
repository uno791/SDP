import { useState } from "react";
import styles from "./FPLPage.module.css";
import FPLSearch from "../components/FPLPageComp/FPLSearch/FPLSearch";
import FPLDashboard from "../components/FPLPageComp/FPLDashboard/FPLDashboard";

/**
 * This is the parent page for your Fantasy Premier League (FPL) section.
 * It shows the search screen first, and once the user selects a team,
 * it displays the dashboard with stats, picks, and summary.
 */

export default function FPLPage() {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const handleSelectTeam = (teamId: number) => {
    setSelectedTeamId(teamId);
  };

  const handleBack = () => {
    setSelectedTeamId(null);
  };

  return (
    <div className={styles.container}>
      {!selectedTeamId ? (
        <FPLSearch onSelectTeam={handleSelectTeam} />
      ) : (
        <FPLDashboard teamId={selectedTeamId} onBack={handleBack} />
      )}
    </div>
  );
}
