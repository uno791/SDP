import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MatchForm.module.css";
import { API_BASE } from "../../config";
import { useUser } from "../../Users/UserContext"; // ✅ bring in logged-in user

interface Props {
  onCancel: () => void;
  csvData?: any; // ✅ optional prop for prefilling from CSV
  matchId?: number; // ✅ optional prop for editing
}

type Privacy = "private" | "public";
type UsernameRow = { username: string };
type Team = { id: number; name: string };

function TeamLineupEditor({
  teamLabel,
  savedLineup,
  setSavedLineup,
}: {
  teamLabel: string;
  savedLineup: string[];
  setSavedLineup: (names: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<string>("");
  const [draft, setDraft] = useState<string[]>([]);

  const handleCreateFields = () => {
    const n = Math.max(0, Number(count));
    if (!Number.isFinite(n) || n <= 0) return;
    setDraft(Array.from({ length: n }, () => ""));
  };

  const updateDraft = (idx: number, value: string) => {
    setDraft((prev) => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };

  const handleSave = () => {
    const cleaned = draft.map((s) => s.trim()).filter(Boolean);
    setSavedLineup(cleaned);
    setOpen(false);
  };

  const handleClear = () => {
    setDraft([]);
    setCount("");
  };

  return (
    <div className={styles.lineupBlock}>
      <button
        type="button"
        className={styles.addLineup}
        onClick={() => setOpen((o) => !o)}
      >
        ADD LINEUP +
      </button>

      {open && (
        <div className={styles.lineupEditor}>
          <div className={styles.lineupCountRow}>
            <label className={styles.label} htmlFor={`${teamLabel}-count`}>
              Number of players:
            </label>
            <input
              id={`${teamLabel}-count`}
              className={styles.countInput}
              type="number"
              min={1}
              max={23}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="e.g. 11"
            />
            <button
              type="button"
              className={styles.smallAction}
              onClick={handleCreateFields}
            >
              Create Fields
            </button>
            <button
              type="button"
              className={styles.smallActionAlt}
              onClick={handleClear}
            >
              Clear
            </button>
          </div>

          {draft.length > 0 && (
            <div className={styles.lineupInputs}>
              {draft.map((value, i) => (
                <div key={i} className={styles.lineupInputRow}>
                  <span className={styles.numberBadge}>{i + 1}</span>
                  <input
                    className={styles.textInput}
                    placeholder="Player name"
                    value={value}
                    onChange={(e) => updateDraft(i, e.target.value)}
                  />
                </div>
              ))}
              <div className={styles.lineupActions}>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handleSave}
                >
                  Save Lineup
                </button>
                <button
                  type="button"
                  className={styles.cancelInline}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {savedLineup.length > 0 && (
        <>
          <div className={styles.smallNote}>Saved lineup</div>
          <div className={styles.chips}>
            {savedLineup.map((name, idx) => (
              <span key={idx} className={styles.chip}>
                {name}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const MatchForm = ({ onCancel, csvData, matchId }: Props) => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [team1, setTeam1] = useState(""); // team name
  const [team2, setTeam2] = useState(""); // team name
  const [teams, setTeams] = useState<Team[]>([]); // ✅ all teams

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("public");

  const [lineupTeam1, setLineupTeam1] = useState<string[]>([]);
  const [lineupTeam2, setLineupTeam2] = useState<string[]>([]);

  const [allUsernames, setAllUsernames] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userToAdd, setUserToAdd] = useState<string>("");

  // ✅ Fetch all teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const base = API_BASE || "http://localhost:3000";
        const res = await fetch(`${base}/teams`);
        if (!res.ok) throw new Error("Failed to fetch teams");
        const data: Team[] = await res.json();
        setTeams(data);
      } catch (err) {
        console.error("❌ Error fetching teams:", err);
      }
    };
    fetchTeams();
  }, []);

  // ✅ Prefill from csvData (assume team names in CSV)
  useEffect(() => {
    if (!csvData) return;

    setTeam1(csvData.team1 || "");
    setTeam2(csvData.team2 || "");
    setDate(csvData.date || "");
    setTime(csvData.time || "");
    setDuration(csvData.duration || "");
    setLineupTeam1(
      csvData.lineupTeam1
        ? csvData.lineupTeam1.split(";").map((s: string) => s.trim())
        : []
    );
    setLineupTeam2(
      csvData.lineupTeam2
        ? csvData.lineupTeam2.split(";").map((s: string) => s.trim())
        : []
    );
  }, [csvData]);

  // ✅ Prefill from API if matchId exists (edit mode)
  useEffect(() => {
    if (!matchId) return;

    const fetchMatch = async () => {
      try {
        const base = API_BASE || "http://localhost:3000";
        // const res = await fetch(`${base}/matches/${matchId}`);
        const url = new URL(`${base}/matches/${matchId}`);
        if (user?.id) url.searchParams.set("user_id", user.id);
        if (user?.username) url.searchParams.set("username", user.username);

        const res = await fetch(url.toString());

        if (!res.ok) throw new Error("Failed to fetch match");
        const data = await res.json();

        setTeam1(data.home_team?.name || "");
        setTeam2(data.away_team?.name || "");

        if (data.utc_kickoff) {
          const kickoff = new Date(data.utc_kickoff.replace(" ", "T"));
          if (!isNaN(kickoff.getTime())) {
            setDate(kickoff.toISOString().split("T")[0]);
            setTime(kickoff.toISOString().split("T")[1].slice(0, 5));
          }
        }

        setDuration(data.notes_json?.duration || "");
        setPrivacy(data.notes_json?.privacy || "public");
        setSelectedUsers(data.notes_json?.invitedUsers || []);
        setLineupTeam1(data.notes_json?.lineupTeam1 || []);
        setLineupTeam2(data.notes_json?.lineupTeam2 || []);
      } catch (err) {
        console.error("❌ Error fetching match:", err);
      }
    };

    fetchMatch();
  }, [matchId]);

  // ✅ fetch usernames for private matches
  useEffect(() => {
    if (privacy !== "private") return;
    if (allUsernames.length > 0) return;

    const fetchNames = async () => {
      try {
        const base = API_BASE || "http://localhost:3000";
        const res = await fetch(`${base}/names`);
        if (!res.ok) throw new Error(`Failed to fetch names: ${res.status}`);
        const data: UsernameRow[] = await res.json();
        const names = data
          .map((row) => row.username)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        setAllUsernames(names);
        if (names.length > 0) setUserToAdd(names[0]);
      } catch (err) {
        console.error(err);
      }
    };

    fetchNames();
  }, [privacy, allUsernames.length]);

  const availableOptions = useMemo(
    () => allUsernames.filter((n) => !selectedUsers.includes(n)),
    [allUsernames, selectedUsers]
  );

  const handleAddUser = () => {
    if (!userToAdd) return;
    if (selectedUsers.includes(userToAdd)) return;
    setSelectedUsers((prev) => [...prev, userToAdd]);
    const remaining = availableOptions.filter((n) => n !== userToAdd);
    setUserToAdd(remaining[0] ?? "");
  };

  const handleRemoveUser = (name: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u !== name));
  };

  const ensureTeam = async (name: string): Promise<number | null> => {
    if (!name.trim()) return null;
    const existing = teams.find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) return existing.id;

    // create new team
    const base = API_BASE || "http://localhost:3000";
    const res = await fetch(`${base}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to create team");
    const newTeam: Team = await res.json();
    setTeams((prev) => [...prev, newTeam]);
    return newTeam.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      alert("You must be logged in to create or edit a match");
      return;
    }

    try {
      const base = API_BASE || "http://localhost:3000";

      const kickoffLocal = new Date(`${date}T${time}:00`);
      const utc_kickoff = kickoffLocal.toISOString();

      // ensure team IDs
      const team1Id = await ensureTeam(team1);
      const team2Id = await ensureTeam(team2);

      const payload = {
        league_code: "custom.user",
        utc_kickoff,
        status: "scheduled",
        home_team_id: team1Id,
        away_team_id: team2Id,
        created_by: user.id,
        notes_json: {
          duration,
          privacy,
          invitedUsers: privacy === "private" ? selectedUsers : [],
          lineupTeam1,
          lineupTeam2,
        },
      };

      const res = await fetch(
        matchId ? `${base}/matches/${matchId}` : `${base}/matches`,
        {
          method: matchId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save match");
      }

      navigate("/mymatches");
    } catch (err) {
      console.error("❌ Failed to save match", err);
      alert("Failed to save match, see console for details.");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Teams */}
      <h3 className={styles.subHeader}>FILL IN TEAM</h3>
      <div className={styles.teams}>
        <div className={styles.teamColumn}>
          <label className={styles.teamLabel}>TEAM 1</label>
          <input
            className={styles.textInput}
            placeholder="Enter Team Name"
            value={team1}
            onChange={(e) => setTeam1(e.target.value)}
          />
          <TeamLineupEditor
            teamLabel="team1"
            savedLineup={lineupTeam1}
            setSavedLineup={setLineupTeam1}
          />
        </div>

        <div className={styles.teamColumn}>
          <label className={styles.teamLabel}>TEAM 2</label>
          <input
            className={styles.textInput}
            placeholder="Enter Team Name"
            value={team2}
            onChange={(e) => setTeam2(e.target.value)}
          />
          <TeamLineupEditor
            teamLabel="team2"
            savedLineup={lineupTeam2}
            setSavedLineup={setLineupTeam2}
          />
        </div>
      </div>

      {/* Match settings */}
      <h3 className={styles.subHeader}>MATCH SETTINGS</h3>
      <div className={styles.settings}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>DATE:</label>
          <input
            className={styles.textInput}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>START TIME:</label>
          <input
            className={styles.textInput}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>DURATION:</label>
          <input
            className={styles.durationInput}
            placeholder="Minutes"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
      </div>

      {/* Privacy */}
      <div className={styles.privacyRow}>
        <label className={styles.privacyOption}>
          <input
            type="radio"
            checked={privacy === "private"}
            onChange={() => setPrivacy("private")}
          />
          <span>PRIVATE</span>
        </label>
        <label className={styles.privacyOption}>
          <input
            type="radio"
            checked={privacy === "public"}
            onChange={() => setPrivacy("public")}
          />
          <span>PUBLIC</span>
        </label>
      </div>

      {privacy === "private" && (
        <div className={styles.inviteBlock}>
          <button
            type="button"
            className={styles.addUsersBtn}
            onClick={handleAddUser}
            disabled={availableOptions.length === 0}
          >
            ADD USERS
          </button>

          <div className={styles.inviteRow}>
            <select
              className={styles.userSelect}
              value={userToAdd}
              onChange={(e) => setUserToAdd(e.target.value)}
            >
              {availableOptions.length === 0 ? (
                <option value="">No users available</option>
              ) : (
                availableOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedUsers.length > 0 && (
            <div className={styles.chips}>
              {selectedUsers.map((name) => (
                <span key={name} className={styles.chip}>
                  {name}
                  <button
                    type="button"
                    className={styles.chipRemove}
                    onClick={() => handleRemoveUser(name)}
                    aria-label={`Remove ${name}`}
                    title={`Remove ${name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className={styles.buttons}>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          CANCEL
        </button>
        <button type="submit" className={styles.create}>
          {matchId ? "UPDATE MATCH" : "CREATE MATCH"}
        </button>
      </div>
    </form>
  );
};

export default MatchForm;
