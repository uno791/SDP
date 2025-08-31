import supabase from "./supabaseClient";
import express from "express";
import type { Request, Response } from 'express';
import cors from "cors";
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;
const router = express.Router();

app.use(cors());
app.use(express.json());
app.use(router);

app.get("/api", (req: Request, res: Response) => {
  res.send("Hello from the API");
});

app.get("/status", (req: Request, res: Response) => {
  res.json({ status: "The server is running" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
// getting names to display
router.get("/names", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("username"); 

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data); 
});
//checking if ID exists alreayd
router.get("/checkID", async (req, res) => {
  const {user_id}=req.query;
  const { data, error } = await supabase
    .from("users")
    .select("user_id")
    .eq("user_id",user_id);

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  const exists = data && data.length > 0;

  return res.status(200).json({ exists });
});
//adding user to the DB
router.post("/addUser", async (req, res) => {
  console.log("BODY /addUser:", req.body); // should log { user_id, username }
  const {user_id,username}=req.body;
  if (!user_id || !username) {
    return res.status(400).json({ error: "user_id and username are required" });
  }
  const { data, error } = await supabase
    .from("users")
    .insert({user_id,username})
    .select('*')
    .single();

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  

  return res.status(200).json({ data });
});

// =============== Helper: SA local date (YYYY-MM-DD) ===============
function localDateSAST() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  return fmt.format(now); // "YYYY-MM-DD"
}

// =============== Helper: protect endpoint (optional) ===============
function requireSecret(req: Request, res: Response, next: Function) {
  const expected = process.env.INGEST_SECRET;
  if (!expected) return next(); // not enforced if not set
  const got = req.headers['x-ingest-secret'];
  if (got !== expected) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// =============== ESPN fetchers ===============
async function fetchScoreboard(leagueCode: string, dateYMD: string) {
  const ymd = dateYMD.replaceAll('-', '');
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard?dates=${ymd}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Scoreboard fetch failed ${res.status}`);
  return res.json();
}

async function fetchSummary(leagueCode: string, eventId: string) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/summary?event=${eventId}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function parseMinute(displayClock?: string | null) {
  if (!displayClock) return null; // e.g. "90'+2"
  const m = /(\d+)/.exec(displayClock);
  return m ? parseInt(m[1], 10) : null;
}
function parseAdded(displayClock?: string | null) {
  if (!displayClock) return null;
  const m = /\+(\d+)/.exec(displayClock);
  return m ? parseInt(m[1], 10) : null;
}

// =============== DB helpers using supabase-js ===============
async function getOrCreateTeamByName(name?: string | null, info?: {
  short_name?: string | null, abbreviation?: string | null,
  display_name?: string | null, logo_url?: string | null
}) {
  if (!name) return null;
  const found = await supabase.from('teams').select('id').eq('name', name).limit(1).maybeSingle();
  if (found.data?.id) return found.data.id;

  const inserted = await supabase.from('teams').insert({
    name,
    short_name: info?.short_name ?? null,
    abbreviation: info?.abbreviation ?? null,
    display_name: info?.display_name ?? null,
    logo_url: info?.logo_url ?? null
  }).select('id').single();

  if (inserted.error) throw inserted.error;
  return inserted.data.id;
}

async function getOrCreateVenue(name?: string | null, city?: string | null, country?: string | null) {
  if (!name) return null;
  // try (name, city)
  let q = supabase.from('venues').select('id').eq('name', name);
  if (city) q = q.eq('city', city);
  const maybe = await q.limit(1).maybeSingle();
  if (maybe.data?.id) return maybe.data.id;

  // fallback by name only if previous returned no row
  if (!maybe.data && !city) {
    const byName = await supabase.from('venues').select('id').eq('name', name).limit(1).maybeSingle();
    if (byName.data?.id) return byName.data.id;
  }

  const ins = await supabase.from('venues').insert({ name, city: city ?? null, country: country ?? null })
    .select('id').single();
  if (ins.error) throw ins.error;
  return ins.data.id;
}

async function upsertMatchRow(row: {
  league_code: string,
  season_year: number | null,
  week_number: number | null,
  utc_kickoff: string,
  status: string,
  status_detail: string | null,
  minute: number | null,
  attendance: number | null,
  home_team_id: number | null,
  away_team_id: number | null,
  home_score: number | null,
  away_score: number | null,
  venue_id: number | null
}) {
  // relies on UNIQUE(league_code, utc_kickoff, home_team_id, away_team_id)
  const { error } = await supabase
    .from('matches')
    .upsert(row, { onConflict: 'league_code,utc_kickoff,home_team_id,away_team_id' });
  if (error) throw error;
}

async function findMatchId(nk: {
  league_code: string,
  utc_kickoff: string,
  home_team_id: number | null,
  away_team_id: number | null
}) {
  const { data, error } = await supabase.from('matches')
    .select('id')
    .eq('league_code', nk.league_code)
    .eq('utc_kickoff', nk.utc_kickoff)
    .eq('home_team_id', nk.home_team_id)
    .eq('away_team_id', nk.away_team_id)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function replaceMatchEvents(match_id: number, events: Array<{
  team_id: number | null,
  player_name: string | null,
  minute: number | null,
  added_time: number | null,
  event_type: string,
  detail: string | null,
  outcome: string | null,
  notes_json?: any
}>) {
  // delete → insert fresh (idempotent and simple)
  const del = await supabase.from('match_events').delete().eq('match_id', match_id);
  if (del.error) throw del.error;

  if (!events.length) return;
  const ins = await supabase.from('match_events').insert(events);
  if (ins.error) throw ins.error;
}

// Extract a minimal event timeline from summary JSON (best-effort)
function flattenSummaryToEvents(summary: any): Array<{
  team_id: number | null, player_name: string | null, minute: number | null, added_time: number | null,
  event_type: string, detail: string | null, outcome: string | null, notes_json: any
}> {
  const out: any[] = [];

  // Goals (scoringPlays)
  const goals = summary?.scoringPlays ?? [];
  for (const g of goals) {
    out.push({
      team_id: null, // you can map by team name if needed later
      player_name: g?.athletesInvolved?.[0]?.displayName ?? null,
      minute: parseMinute(g?.clock?.displayValue),
      added_time: parseAdded(g?.clock?.displayValue),
      event_type: (g?.type?.text || '').toLowerCase().includes('own') ? 'own_goal' : 'goal',
      detail: g?.text ?? null,
      outcome: 'scored',
      notes_json: g
    });
  }

  // Cards (incidents sometimes exists; varies per league)
  const incidents = summary?.incidents ?? [];
  for (const inc of incidents) {
    const kind = (inc?.type?.text || '').toLowerCase();
    if (kind.includes('yellow') || kind.includes('red')) {
      out.push({
        team_id: null,
        player_name: inc?.athlete?.displayName ?? null,
        minute: parseMinute(inc?.clock?.displayValue),
        added_time: parseAdded(inc?.clock?.displayValue),
        event_type: kind.includes('yellow') ? 'yellow' : 'red',
        detail: inc?.text ?? null,
        outcome: null,
        notes_json: inc
      });
    }
  }

  // Penalty shootout
  const shootout = summary?.shootoutPlays ?? [];
  for (const p of shootout) {
    out.push({
      team_id: null,
      player_name: p?.athlete?.displayName ?? null,
      minute: null,
      added_time: null,
      event_type: p?.scored ? 'penalty_goal' : 'penalty_miss',
      detail: 'shootout',
      outcome: p?.scored ? 'scored' : 'missed',
      notes_json: p
    });
  }

  return out;
}

// =============== MAIN INGESTOR (one date, many leagues) ===============
async function ingestForDate(dateISO: string, leagues: string[]) {
  const perLeagueCount: Record<string, number> = {};
  for (const league of leagues) {
    const sb = await fetchScoreboard(league, dateISO);
    const events = sb?.events ?? [];
    perLeagueCount[league] = events.length;

    for (const ev of events) {
      const comp = ev?.competitions?.[0] ?? {};
      const teams = comp?.competitors ?? [];
      const home = teams.find((c: any) => c?.homeAway === 'home') ?? {};
      const away = teams.find((c: any) => c?.homeAway === 'away') ?? {};
      const hT = home.team ?? {};
      const aT = away.team ?? {};

      const home_team_id = await getOrCreateTeamByName(hT?.name, {
        short_name: hT?.shortDisplayName,
        abbreviation: hT?.abbreviation,
        display_name: hT?.displayName,
        logo_url: hT?.logo
      });
      const away_team_id = await getOrCreateTeamByName(aT?.name, {
        short_name: aT?.shortDisplayName,
        abbreviation: aT?.abbreviation,
        display_name: aT?.displayName,
        logo_url: aT?.logo
      });

      const venue = comp?.venue ?? {};
      const venue_id = await getOrCreateVenue(
        venue?.fullName ?? null,
        venue?.address?.city ?? null,
        venue?.address?.country ?? null
      );

      const utc_kickoff = ev?.date;
      const season_year = ev?.season?.year ?? null;
      const week_number = ev?.week?.number ?? null;

      const state = comp?.status?.type?.state; // 'pre'|'in'|'post' (your DB trigger normalizes)
      const status_detail = comp?.status?.type?.shortDetail ?? null;
      const minute = parseMinute(comp?.status?.displayClock);
      const attendance = comp?.attendance ?? null;

      const home_score = home?.score != null ? Number(home.score) : null;
      const away_score = away?.score != null ? Number(away.score) : null;

      // Upsert match row
      await upsertMatchRow({
        league_code: league,
        season_year,
        week_number,
        utc_kickoff,
        status: state || 'scheduled',
        status_detail,
        minute,
        attendance,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        venue_id
      });

      // If final → fetch summary and write match_events
      if ((state === 'post' || state === 'final') && ev?.id) {
        const match_id = await findMatchId({
          league_code: league,
          utc_kickoff,
          home_team_id,
          away_team_id
        });
        if (match_id) {
          const summary = await fetchSummary(league, ev.id);
          if (summary) {
            const events = flattenSummaryToEvents(summary);
            // You can improve mapping team_id by comparing names if you want.
            await replaceMatchEvents(match_id, events);
          }
        }
      }
    }
  }
  return perLeagueCount;
}

// =============== ROUTE: POST /admin/ingest ===============
router.post('/admin/ingest', requireSecret, async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || localDateSAST(); // "YYYY-MM-DD"
    const leaguesParam = (req.query.leagues as string) || process.env.DEFAULT_LEAGUES || 'eng.1';
    const leagues = leaguesParam.split(',').map(s => s.trim()).filter(Boolean);

    const result = await ingestForDate(date, leagues);
    return res.json({ ok: true, date, leagues, processed: result });
  } catch (err: any) {
    console.error('Ingest error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});
export default router;
