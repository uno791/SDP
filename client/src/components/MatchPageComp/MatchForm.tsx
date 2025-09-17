import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MatchForm.module.css";
import { API_BASE } from "../../config";
import { useUser } from "../../Users/UserContext"; // ✅ bring in logged-in user

interface Props {
  onCancel: () => void;
}

type Privacy = "private" | "public";
type UsernameRow = { username: string };

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

const MatchForm = ({ onCancel }: Props) => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("private");

  const [lineupTeam1, setLineupTeam1] = useState<string[]>([]);
  const [lineupTeam2, setLineupTeam2] = useState<string[]>([]);

  const [allUsernames, setAllUsernames] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userToAdd, setUserToAdd] = useState<string>("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      alert("You must be logged in to create a match");
      return;
    }

    try {
      const base = API_BASE || "http://localhost:3000";

      // ✅ FIX: don’t append "Z"
      const kickoffLocal = new Date(`${date}T${time}:00`);
      const utc_kickoff = kickoffLocal.toISOString();

      const payload = {
        league_code: "custom.user",
        utc_kickoff,
        status: "scheduled",
        home_team_name: team1,
        away_team_name: team2,
        created_by: user.id,
        notes_json: {
          duration,
          privacy,
          invitedUsers: privacy === "private" ? selectedUsers : [],
          lineupTeam1,
          lineupTeam2,
        },
      };

      const res = await fetch(`${base}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create match");
      }

      navigate("/my-matches");
    } catch (err) {
      console.error("❌ Failed to create match", err);
      alert("Failed to create match, see console for details.");
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
            placeholder="Team Names"
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
            placeholder="Team Names"
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
          CREATE MATCH
        </button>
      </div>
    </form>
  );
};

export default MatchForm;
