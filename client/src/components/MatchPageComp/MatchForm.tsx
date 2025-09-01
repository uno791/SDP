import { useEffect, useMemo, useState } from "react";
import styles from "./MatchForm.module.css";
import { API_BASE } from "../../config";

interface Props {
  onCancel: () => void;
}

type Privacy = "private" | "public";
type UsernameRow = { username: string };

/**
 * Inline editor used by both teams.
 * Lets a user type a number of players, generates inputs, and saves lineup.
 */
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
    // Filter out blanks but preserve order
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
  // Basic match fields
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("private");

  // Lineups
  const [lineupTeam1, setLineupTeam1] = useState<string[]>([]);
  const [lineupTeam2, setLineupTeam2] = useState<string[]>([]);

  // Private visibility helpers
  const [allUsernames, setAllUsernames] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userToAdd, setUserToAdd] = useState<string>("");

  // Fetch usernames when privacy becomes private (and we don't have them yet)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      team1,
      team2,
      date,
      time,
      duration,
      privacy,
      invitedUsers: privacy === "private" ? selectedUsers : [],
      lineupTeam1,
      lineupTeam2,
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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
          <button type="button" className={styles.upload}>
            UPLOAD BADGE
          </button>

          {/* Lineup editor for Team 1 */}
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
          <button type="button" className={styles.upload}>
            UPLOAD BADGE
          </button>

          {/* Lineup editor for Team 2 */}
          <TeamLineupEditor
            teamLabel="team2"
            savedLineup={lineupTeam2}
            setSavedLineup={setLineupTeam2}
          />
        </div>
      </div>

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
            placeholder=""
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
      </div>

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
            title={
              availableOptions.length === 0
                ? "No more users to add"
                : "Add selected user"
            }
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
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

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
