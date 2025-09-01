import { useParams } from "react-router-dom";
import { useState } from "react";
import styles from "./LiveMatchUpdate.module.css";
import { useUser } from "../../Users/UserContext"; // ✅ import context

type Event = {
  id: number;
  minute: number;
  type: string;
  team: string;
  player: string;
};

const LiveMatchUpdate = () => {
  const { id } = useParams(); // match ID from route
  const { user } = useUser(); // ✅ { user_id, username }

  const [score, setScore] = useState({ team1: 0, team2: 1 });
  const [minute, setMinute] = useState(67);
  const [events, setEvents] = useState<Event[]>([
    { id: 1, minute: 55, type: "Goal", team: "Man United", player: "Cunha" },
  ]);

  const [eventType, setEventType] = useState("");
  const [team, setTeam] = useState("");
  const [player, setPlayer] = useState("");

  const handleAddEvent = () => {
    if (!eventType || !team || !player) return;
    const newEvent: Event = {
      id: events.length + 1,
      minute,
      type: eventType,
      team,
      player,
    };
    setEvents([...events, newEvent]);
    setEventType("");
    setTeam("");
    setPlayer("");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>LIVERPOOL VS MAN UNITED</h1>

      {/* ✅ Now showing logged-in username */}
      <p className={styles.username}>{user?.username ?? "Guest"}</p>

      <div className={styles.scoreBox}>
        <div className={styles.team}>Liverpool</div>
        <div className={styles.score}>
          {score.team1} - {score.team2}
          <span className={styles.minute}>{minute}'</span>
        </div>
        <div className={styles.team}>
          Man United
          <div className={styles.eventChip}>Cunha 55'</div>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.pause}>PAUSE GAME</button>
        <button className={styles.end}>END MATCH</button>
      </div>

      <h3 className={styles.subHeader}>ADD KEY EVENT</h3>
      <div className={styles.eventForm}>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
        >
          <option value="">Event Type</option>
          <option value="Goal">Goal</option>
          <option value="Yellow Card">Yellow Card</option>
          <option value="Red Card">Red Card</option>
          <option value="Substitution">Substitution</option>
        </select>
        <select value={team} onChange={(e) => setTeam(e.target.value)}>
          <option value="">Team</option>
          <option value="Liverpool">Liverpool</option>
          <option value="Man United">Man United</option>
        </select>
        <select value={player} onChange={(e) => setPlayer(e.target.value)}>
          <option value="">Player</option>
          <option value="Salah">Salah</option>
          <option value="Núñez">Núñez</option>
          <option value="Cunha">Cunha</option>
          <option value="Fernandes">Fernandes</option>
        </select>
        <button
          type="button"
          className={styles.addEvent}
          onClick={handleAddEvent}
        >
          ADD EVENT
        </button>
      </div>

      <h3 className={styles.subHeader}>EVENT TIMELINE:</h3>
      <ul className={styles.timeline}>
        {events.map((ev) => (
          <li key={ev.id}>
            {ev.minute}' {ev.type} – {ev.player} ({ev.team})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LiveMatchUpdate;
