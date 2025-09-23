import { useNavigate } from "react-router-dom";
import styles from "./CreateMatch.module.css";
import MatchForm from "../../components/MatchPageComp/MatchForm";
import Papa from "papaparse";
import { useState } from "react";

const CreateMatch = () => {
  const navigate = useNavigate();
  const [csvData, setCsvData] = useState<any>(null);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: false, // no headers expected
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const row = results.data[0]; // take the first row
          const mapped = {
            team1: row[0] || "",
            team2: row[1] || "",
            date: row[2] || "",
            time: row[3] || "",
            duration: row[4] || "",
            lineupTeam1: row[5] || "",
            lineupTeam2: row[6] || "",
          };
          setCsvData(mapped);
        }
      },
    });
  };

  const handleDownloadTemplate = () => {
    const template =
      "Team1,Team2,YYYY-MM-DD,HH:MM,Duration_in_minutes,Player1;Player2;Player3,Player1;Player2;Player3\n";

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "match_template.csv");
    link.click();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>FILL IN MATCH FORM OR</h2>

      {/* Upload CSV */}
      <label className={styles.uploadCsv}>
        UPLOAD AS A CSV
        <input type="file" accept=".csv" hidden onChange={handleCsvUpload} />
      </label>

      {/* Download CSV Template */}
      <button className={styles.csvTemplate} onClick={handleDownloadTemplate}>
        DOWNLOAD CSV TEMPLATE
      </button>

      {/* Pass CSV data into form */}
      <MatchForm onCancel={() => navigate("/my-matches")} csvData={csvData} />
    </div>
  );
};

export default CreateMatch;
