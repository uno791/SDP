import { useNavigate } from "react-router-dom";
import styles from "./CreateMatch.module.css";
import MatchForm from "../../components/MatchPageComp/MatchForm";
import Papa, { type ParseResult } from "papaparse";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

type CsvFormData = {
  team1: string;
  team2: string;
  date: string;
  time: string;
  duration: string;
  lineupTeam1: string;
  lineupTeam2: string;
};

const CreateMatch = () => {
  const navigate = useNavigate();
  const [csvData, setCsvData] = useState<CsvFormData | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleCsvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<string[]>(file, {
      header: false, // no headers expected
      skipEmptyLines: true,
      complete: (results: ParseResult<string[]>) => {
        if (results.data && results.data.length > 0) {
          const row = results.data[0] ?? [];
          const mapped: CsvFormData = {
            team1: row[0] ?? "",
            team2: row[1] ?? "",
            date: row[2] ?? "",
            time: row[3] ?? "",
            duration: row[4] ?? "",
            lineupTeam1: row[5] ?? "",
            lineupTeam2: row[6] ?? "",
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
      <button
        type="button"
        className={styles.uploadCsv}
        onClick={triggerFilePicker}
      >
        UPLOAD AS A CSV
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        hidden
        onChange={handleCsvUpload}
      />

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
