import { useState } from "react";
import styles from "./FPLSearch.module.css";

interface Props {
  onSelectTeam: (teamId: number) => void;
}

export default function FPLSearch({ onSelectTeam }: Props) {
  const [manualId, setManualId] = useState("");
  const [error, setError] = useState("");

  const handleManualSubmit = () => {
    const idNum = Number(manualId);
    if (isNaN(idNum) || idNum <= 0) {
      setError("Please enter a valid numeric team ID.");
      return;
    }
    setError("");
    onSelectTeam(idNum);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h2 className={styles.heading}>Enter your FPL team ID</h2>

        <div className={styles.manualSection}>
          <div className={styles.manualBox}>
            <input
              type="number"
              placeholder="Enter your team ID"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className={styles.manualInput}
            />
            <button className={styles.enterButton} onClick={handleManualSubmit}>
              Go
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
