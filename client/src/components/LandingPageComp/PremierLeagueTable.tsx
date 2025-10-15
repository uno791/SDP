import { useEffect, useState } from "react";
import LeagueTable from "./LeagueTable"; // <-- your presentational table
import { fetchEplStandings, type LeagueId } from "../../api/espn"; // <-- adjust path if your espn.ts is elsewhere

type LeagueRow = {
  pos: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: string; // signed string e.g. "+8", "-3"
  pts: number;
};

const CURRENT_YEAR = new Date().getFullYear();
const withSign = (n: number) => (n > 0 ? `+${n}` : String(n));

export default function PremierLeagueTable({
  season = CURRENT_YEAR,
  league = "eng1",
}: {
  season?: number;
  league?: LeagueId;
}) {
  const [rows, setRows] = useState<LeagueRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Fetch live EPL standings (top division = level 3 in your helper)
        const raw = await fetchEplStandings({ season, level: 3, league });

        // Map API rows to the shape your presentational table expects
        const mapped: LeagueRow[] = (raw ?? []).map((r: any) => {
          const played = r.p ?? r.played ?? r.gamesPlayed ?? 0;
          const won = r.w ?? r.won ?? 0;
          const drawn = r.d ?? r.drawn ?? 0;
          const lost = r.l ?? r.lost ?? 0;
          const gdNum =
            typeof r.gd === "number"
              ? r.gd
              : typeof r.goalsFor === "number" &&
                typeof r.goalsAgainst === "number"
              ? r.goalsFor - r.goalsAgainst
              : Number(r.gd ?? 0);
          return {
            pos: r.pos ?? r.rank ?? r.position ?? 0,
            team: r.team,
            played,
            won,
            drawn,
            lost,
            gd: withSign(gdNum),
            pts: r.pts ?? r.points ?? won * 3 + drawn,
          };
        });

        if (!alive) return;
        setRows(mapped);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load league table.");
        setRows(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [season, league]);

  if (loading) return <div style={{ padding: "0.75rem" }}>Loading…</div>;
  if (err)
    return <div style={{ padding: "0.75rem", color: "#b00020" }}>{err}</div>;
  if (!rows?.length)
    return <div style={{ padding: "0.75rem" }}>No standings available.</div>;

  // Hand off to your presentational table (unchanged)
  return <LeagueTable data={rows} />;
}
