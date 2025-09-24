import { useNavigate, useParams } from "react-router-dom";
import styles from "./CreateMatch.module.css";
import MatchForm from "../../components/MatchPageComp/MatchForm";
import Papa, { type ParseResult } from "papaparse";
import { useRef, useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { baseURL } from "../../config";

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
  const { id } = useParams<{ id?: string }>(); // ✅ useParams typed
  const [csvData, setCsvData] = useState<CsvFormData | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ Load existing match if editing
  useEffect(() => {
    if (!id) return; // create mode

    async function fetchMatch() {
      try {
        const res = await fetch(`${baseURL}/matches/${id}`);
        if (!res.ok) {
          console.error("Failed to fetch match");
          return;
        }

        const { match } = await res.json(); // ✅ backend returns { match: {...} }

        if (!match?.utc_kickoff) {
          console.error("Match data missing utc_kickoff");
          return;
        }

        const kickoff = new Date(match.utc_kickoff);
        if (isNaN(kickoff.getTime())) {
          console.error("Invalid kickoff date:", match.utc_kickoff);
          return;
        }

        // Map backend match to CsvFormData
        const mapped: CsvFormData = {
          team1: match.home_team?.name || "",
          team2: match.away_team?.name || "",
          date: kickoff.toISOString().slice(0, 10),
          time: kickoff.toISOString().slice(11, 16),
          duration: String(match.notes_json?.duration ?? 90),
          lineupTeam1: (match.notes_json?.lineupTeam1 || []).join(";"),
          lineupTeam2: (match.notes_json?.lineupTeam2 || []).join(";"),
        };
        setCsvData(mapped);
      } catch (err) {
        console.error("Error fetching match:", err);
      }
    }

    fetchMatch();
  }, [id]);

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleCsvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<string[]>(file, {
      header: false,
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
      <h2 className={styles.header}>
        {id ? "EDIT MATCH" : "FILL IN MATCH FORM OR"}
      </h2>

      {!id && (
        <>
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
          <button
            className={styles.csvTemplate}
            onClick={handleDownloadTemplate}
          >
            DOWNLOAD CSV TEMPLATE
          </button>
        </>
      )}

      {/* Pass CSV or loaded data into form */}
      <MatchForm
        onCancel={() => navigate("/my-matches")}
        csvData={csvData}
        matchId={id ? Number(id) : undefined} // ✅ editing mode passes matchId
      />
    </div>
  );
};

export default CreateMatch;
