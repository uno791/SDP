import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./LiveMatchUpdate.module.css";
import { useUser } from "../../Users/UserContext";
import axios from "axios";
import { baseURL } from "../../config";

type Event = {
  id: number;
  minute: number;
  event_type: string;
  team_id?: number;
  player_name?: string;
};

type Match = {
  id: number;
  home_team: { id: number; name: string } | null;
  away_team: { id: number; name: string } | null;
  home_score: number;
  away_score: number;
  status: string;
  minute: number | null;
  events: Event[];
};

const LiveMatchUpdate = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state for adding events
  const [eventType, setEventType] = useState("");
  const [teamId, setTeamId] = useState<number | "">("");
  const [player, setPlayer] = useState("");

  // Fetch match data
  useEffect(() => {
    if (!id) return;

    const fetchMatch = async () => {
      try {
        const res = await axios.get(`${baseURL}/matches/${id}`);
        setMatch(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch match:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [id]);

  const handleAddEvent = async () => {
    if (!eventType || !teamId || !player) return;
    try {
      await axios.post(`${baseURL}/matches/${id}/events`, {
        event_type: eventType.toLowerCase().replace(" ", "_"),
        team_id: teamId,
        player_name: player,
        minute: match?.minute ?? 0,
      });

      // refresh match
      const res = await axios.get(`${baseURL}/matches/${id}`);
      setMatch(res.data);

      setEventType("");
      setTeamId("");
      setPlayer("");
    } catch (err) {
      console.error("❌ Failed to add event:", err);
    }
  };

  const handleEndMatch = async () => {
    try {
      await axios.post(`${baseURL}/matches/${id}/finalize`, {
        status_detail: "FT",
      });
      const res = await axios.get(`${baseURL}/matches/${id}`);
      setMatch(res.data);
    } catch (err) {
      console.error("❌ Failed to finalize match:", err);
    }
  };

  if (loading) return <p>Loading match...</p>;
  if (!match) return <p>Match not found</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {match.home_team?.name ?? "Team A"} vs{" "}
        {match.away_team?.name ?? "Team B"}
      </h1>

      <p className={styles.username}>{user?.username ?? "Guest"}</p>

      <div className={styles.scoreBox}>
        <div className={styles.team}>{match.home_team?.name ?? "Team A"}</div>
        <div className={styles.score}>
          {match.home_score} - {match.away_score}
          {match.minute != null && (
            <span className={styles.minute}>{match.minute}'</span>
          )}
        </div>
        <div className={styles.team}>{match.away_team?.name ?? "Team B"}</div>
      </div>

      <div className={styles.actions}>
        <button className={styles.end} onClick={handleEndMatch}>
          END MATCH
        </button>
      </div>

      <h3 className={styles.subHeader}>ADD KEY EVENT</h3>
      <div className={styles.eventForm}>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
        >
          <option value="">Event Type</option>
          <option value="goal">Goal</option>
          <option value="yellow">Yellow Card</option>
          <option value="red">Red Card</option>
          <option value="substitution">Substitution</option>
        </select>

        <select
          value={teamId}
          onChange={(e) => setTeamId(Number(e.target.value))}
        >
          <option value="">Team</option>
          {match.home_team && (
            <option value={match.home_team.id}>{match.home_team.name}</option>
          )}
          {match.away_team && (
            <option value={match.away_team.id}>{match.away_team.name}</option>
          )}
        </select>

        <input
          type="text"
          value={player}
          onChange={(e) => setPlayer(e.target.value)}
          placeholder="Player name"
        />

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
        {match.events.map((ev) => (
          <li key={ev.id}>
            {ev.minute}' {ev.event_type} – {ev.player_name} (
            {ev.team_id === match.home_team?.id
              ? match.home_team?.name
              : match.away_team?.name}
            )
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LiveMatchUpdate;
