// client/src/components/LandingPageComp/LiveUserMatches.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../config";
import MatchList from "../MatchPageComp/MatchList";

type Match = {
  id: number;
  home_team?: { id: number; name: string } | null;
  away_team?: { id: number; name: string } | null;
  home_score?: number | null;
  away_score?: number | null;
  status: string;
  utc_kickoff: string;
  minute?: number | null;
  notes_json?: {
    duration?: string | number;
  };
};

export default function LiveUserMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    axios
      .get(`${baseURL}/matches`)
      .then((res) => setMatches(res.data.matches || []))
      .catch((err) => console.error("Failed to fetch matches:", err));
  }, []);

  // Update "now" every 30s
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter only LIVE matches
  const liveMatches = matches.filter((m) => {
    if (m.status === "final") return false;
    const kickoff = new Date(m.utc_kickoff).getTime();
    const duration = Number(m.notes_json?.duration ?? 90);
    const end = kickoff + duration * 60000;
    return now.getTime() >= kickoff && now.getTime() < end;
  });

  const transform = (m: Match) => {
    const kickoff = new Date(m.utc_kickoff).getTime();
    const duration = Number(m.notes_json?.duration ?? 90);
    const end = kickoff + duration * 60000;

    let status: "live" | "upcoming" | "finished";
    if (m.status === "final" || now.getTime() >= end) {
      status = "finished";
    } else if (now.getTime() < kickoff) {
      status = "upcoming";
    } else {
      status = "live";
    }

    const minute =
      status === "live"
        ? Math.min(Math.floor((now.getTime() - kickoff) / 60000), duration)
        : undefined;

    return {
      id: m.id,
      team1: m.home_team?.name || "TBD",
      team2: m.away_team?.name || "TBD",
      score:
        m.home_score != null && m.away_score != null
          ? `${m.home_score} - ${m.away_score}`
          : "",
      status,
      minute,
      date: new Date(m.utc_kickoff).toLocaleString(),
    };
  };

  if (liveMatches.length === 0) {
    return <p>No live matches right now.</p>;
  }

  return (
    <MatchList
      title="Live User Matches"
      matches={liveMatches.map(transform)}
      onSeeMore={(id) => (window.location.href = `/live/${id}`)}
    />
  );
}
