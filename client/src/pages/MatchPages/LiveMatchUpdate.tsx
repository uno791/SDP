import { useParams, useNavigate } from "react-router-dom";
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
  detail?: string;
};

type Match = {
  id: number;
  home_team: { id: number; name: string } | null;
  away_team: { id: number; name: string } | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  minute: number | null;
  events: Event[];
};

// Helper to make event_type prettier
const formatEventType = (raw: string) => {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const LiveMatchUpdate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveMinute, setLiveMinute] = useState<number | null>(null);

  // Pause/Resume state
  const [isPaused, setIsPaused] = useState(false);

  // Real-time clock
  const [now, setNow] = useState(new Date());

  // Form state for adding events
  const [eventType, setEventType] = useState("");
  const [teamId, setTeamId] = useState<number | "">("");
  const [player, setPlayer] = useState("");
  const [minute, setMinute] = useState<number | "">("");
  const [detail, setDetail] = useState("");

  // Extend match duration
  const [extraMinutes, setExtraMinutes] = useState<number>(1);

  // Fetch match data
  const fetchMatch = async () => {
    try {
      const res = await axios.get(`${baseURL}/matches/${id}`);
      setMatch(res.data.match);

      // ✅ Only update liveMinute if not paused
      if (!isPaused) {
        setLiveMinute(res.data.match.minute ?? null);
      }

      console.log(
        `♻️ Refetched at ${new Date().toLocaleTimeString()}`,
        res.data.match
      );
    } catch (err) {
      console.error("❌ Failed to fetch match:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch + polling
  useEffect(() => {
    if (!id) return;
    fetchMatch();

    const interval = setInterval(fetchMatch, 10000);
    return () => clearInterval(interval);
  }, [id, isPaused]); // depends on pause state

  // Live ticking clock (pause-aware)
  useEffect(() => {
    if (!match || isPaused) return;

    if (match.status === "in_progress" && liveMinute != null) {
      const interval = setInterval(() => {
        setLiveMinute((prev) => (prev != null ? prev + 1 : null));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [match, liveMinute, isPaused]);

  // Real-time clock updater
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleAddEvent = async () => {
    if (!eventType || !teamId || !player) {
      console.warn("⚠️ Missing required fields", { eventType, teamId, player });
      return;
    }

    const payload = {
      event_type: eventType,
      team_id: teamId,
      player_name: player,
      minute: minute === "" ? match?.minute ?? 0 : minute,
      detail: detail || null,
    };

    console.log("📤 Sending event payload:", payload);

    try {
      await axios.post(`${baseURL}/matches/${id}/events`, payload);
      await fetchMatch();
      setEventType("");
      setTeamId("");
      setPlayer("");
      setMinute("");
      setDetail("");
    } catch (err) {
      console.error("❌ Failed to add event:", err);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await axios.delete(`${baseURL}/matches/${id}/events/${eventId}`);
      await fetchMatch();
    } catch (err) {
      console.error("❌ Failed to delete event:", err);
    }
  };

  const handleEndMatch = async () => {
    console.log("END MATCH button clicked");

    if (match?.home_score == null || match?.away_score == null) {
      alert("Please set both scores before finalizing the match.");
      return;
    }

    try {
      const res = await axios.post(`${baseURL}/matches/${id}/finalize`, {
        home_score: match.home_score,
        away_score: match.away_score,
        status_detail: "FT",
      });
      console.log("✅ Match finalized:", res.data.match);
      navigate("/mymatches");
    } catch (err: any) {
      console.error(
        "❌ Failed to finalize match:",
        err.response?.data || err.message
      );
      alert(
        "Finalize failed: " + JSON.stringify(err.response?.data || err.message)
      );
    }
  };

  const handleExtend = async () => {
    try {
      await axios.patch(`${baseURL}/matches/${id}/extend`, {
        extra_minutes: extraMinutes,
      });
      await fetchMatch();
    } catch (err) {
      console.error("❌ Failed to extend match:", err);
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

      {/* ✅ Real-time clock */}
      <p className={styles.clock}>Current Time: {now.toLocaleTimeString()}</p>

      <div className={styles.scoreBox}>
        <div className={styles.team}>{match.home_team?.name ?? "Team A"}</div>
        <div className={styles.score}>
          {match.home_score ?? 0} - {match.away_score ?? 0}
          {liveMinute != null && (
            <span className={styles.minute}>{liveMinute}'</span>
          )}
        </div>
        <div className={styles.team}>{match.away_team?.name ?? "Team B"}</div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.pause}
          onClick={() => setIsPaused(true)}
          disabled={isPaused}
        >
          PAUSE
        </button>

        <button
          className={styles.resume}
          onClick={() => setIsPaused(false)}
          disabled={!isPaused}
        >
          RESUME
        </button>

        <select
          value={extraMinutes}
          onChange={(e) => setExtraMinutes(Number(e.target.value))}
          className={styles.extendSelect}
        >
          {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              +{n} min
            </option>
          ))}
        </select>
        <button className={styles.extend} onClick={handleExtend}>
          EXTEND MATCH
        </button>

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
          <option value="own_goal">Own Goal</option>
          <option value="yellow_card">Yellow Card</option>
          <option value="red_card">Red Card</option>
          <option value="foul">Foul</option>
          <option value="substitution">Substitution</option>
          <option value="save">Save</option>
          <option value="shot_on_target">Shot on Target</option>
          <option value="shot_off_target">Shot off Target</option>
          <option value="assist">Assist</option>
          <option value="offside">Offside</option>
          <option value="injury">Injury</option>
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

        <input
          type="number"
          value={minute}
          onChange={(e) => setMinute(Number(e.target.value))}
          placeholder="Minute"
        />

        <input
          type="text"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Detail (e.g., Header, Free Kick)"
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
            {ev.minute}' <strong>{formatEventType(ev.event_type)}</strong>
            {ev.player_name ? ` – ${ev.player_name}` : ""}
            {ev.team_id
              ? ` (${
                  ev.team_id === match.home_team?.id
                    ? match.home_team?.name
                    : match.away_team?.name
                })`
              : ""}
            {ev.detail ? ` | ${ev.detail}` : ""}
            <button
              onClick={() => handleDeleteEvent(ev.id)}
              className={styles.deleteBtn}
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LiveMatchUpdate;
