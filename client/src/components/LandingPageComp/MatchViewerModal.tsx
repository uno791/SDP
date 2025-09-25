import { useEffect, useState } from "react";
import axios from "axios";

import { baseURL } from "../../config";
import UserMatchViewer from "../UserMatchViewer/UserMatchViewer";

import styles from "./MatchViewerModal.module.css";

type Event = {
  id: number;
  minute?: number | null;
  event_type: string;
  team_id?: number | null;
  player_name?: string | null;
  detail?: string | null;
};

type Team = {
  id?: number | null;
  name?: string | null;
  logo_url?: string | null;
};

type Match = {
  id: number;
  status: string;
  minute?: number | null;
  home_team: Team;
  away_team: Team;
  home_score?: number | null;
  away_score?: number | null;
};

type Props = {
  matchId: number;
  onClose: () => void;
};

export default function MatchViewerModal({ matchId, onClose }: Props) {
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [homeSquad, setHomeSquad] = useState<string[]>([]);
  const [awaySquad, setAwaySquad] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await axios.get(`${baseURL}/matches/${matchId}/details`);
        if (cancelled) return;

        setMatch(data.match ?? null);
        setEvents(Array.isArray(data.events) ? data.events : []);
        setHomeSquad(Array.isArray(data.lineupTeam1) ? data.lineupTeam1 : []);
        setAwaySquad(Array.isArray(data.lineupTeam2) ? data.lineupTeam2 : []);
      } catch (err) {
        if (!cancelled) {
          console.error("[Frontend] Failed to fetch match details:", err);
          setError("Failed to load match data.");
          setMatch(null);
          setEvents([]);
          setHomeSquad([]);
          setAwaySquad([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  let content;
  if (loading) {
    content = <div className={styles.message}>Loading…</div>;
  } else if (error) {
    content = <div className={styles.message}>{error}</div>;
  } else if (!match) {
    content = <div className={styles.message}>Match not found</div>;
  } else {
    content = (
      <UserMatchViewer
        match={match}
        events={events}
        homeSquad={homeSquad}
        awaySquad={awaySquad}
        onClose={onClose}
      />
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>{content}</div>
    </div>
  );
}
