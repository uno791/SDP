import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import MatchForm from "../../components/MatchPageComp/MatchForm";
import styles from "./CreateMatch.module.css";

type CsvRow = {
  team1?: string;
  team2?: string;
  date?: string;
  time?: string;
  duration?: string;
  lineupTeam1?: string;
  lineupTeam2?: string;
};

const CreateMatch = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvData, setCsvData] = useState<CsvRow | null>(null);

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results: any) => {
        const [row] = (results.data as string[][]) ?? [];
        if (!row) return;

        setCsvData({
          team1: row[0] || "",
          team2: row[1] || "",
          date: row[2] || "",
          time: row[3] || "",
          duration: row[4] || "",
          lineupTeam1: row[5] || "",
          lineupTeam2: row[6] || "",
        });
      },
    });

    event.target.value = "";
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
    <div className={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>

      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>Create Matches</h1>
          <p className={styles.heroSubtitle}>
            Build your fixture with a clean, simple interface. Import via CSV or create manually.
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.mainInner}>
          {/* Match Blueprint - main content */}
          <section className={styles.formPanel}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Match Blueprint</h2>
            </div>

            <MatchForm
              onCancel={() => navigate("/my-matches")}
              csvData={csvData ?? undefined}
            />
          </section>

          {/* Quick Actions - sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Quick Actions</h3>
              <p className={styles.cardSubtitle}>
                Import your match setup quickly or start from our template.
              </p>
              <div>
                <button
                  type="button"
                  className={styles.uploadButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload as CSV
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={handleCsvUpload}
                />
                <button
                  type="button"
                  className={styles.templateButton}
                  onClick={handleDownloadTemplate}
                >
                  Download Template
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default CreateMatch;
