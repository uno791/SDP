import supabase from "./supabaseClient";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";

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

// getting names to display
router.get("/names", async (req, res) => {
  const { data, error } = await supabase.from("users").select("username");

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
});
//checking if ID exists alreayd
router.get("/checkID", async (req, res) => {
  const { user_id } = req.query;
  const { data, error } = await supabase
    .from("users")
    .select("user_id")
    .eq("user_id", user_id);

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  const exists = data && data.length > 0;

  return res.status(200).json({ exists });
});

// 1) Get all teams
router.get("/teams", async (req, res) => {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, display_name, logo_url");

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
});

// Get user’s favourite teams (join with teams for names/logos)

router.get("/favourite-teams/:userId", async (req, res) => {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from("favourite_teams")
    .select(
      `
      team_id,
      teams (
        id,
        name,
        display_name,
        logo_url
      )
    `
    )
    .eq("user_id", userId);

  console.log(
    "🟡 Raw Supabase favourites response:",
    JSON.stringify(data, null, 2)
  );

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  const formatted = data.map((f: any) => ({
    team_id: f.team_id,
    team_name: f.teams.display_name || f.teams.name,
    logo: f.teams.logo_url,
  }));

  console.log(
    "🟢 Formatted favourites returned:",
    JSON.stringify(formatted, null, 2)
  );

  return res.status(200).json(formatted);
});

// Add a favourite team
router.post("/favourite-teams", async (req, res) => {
  const { userId, teamId } = req.body;

  if (!userId || !teamId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const { error } = await supabase
    .from("favourite_teams")
    .insert([{ user_id: userId, team_id: teamId }]);

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ success: true });
});

// Remove a favourite team
router.delete("/favourite-teams/:userId/:teamId", async (req, res) => {
  const { userId, teamId } = req.params;

  const { error } = await supabase
    .from("favourite_teams")
    .delete()
    .eq("user_id", userId)
    .eq("team_id", teamId);

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
});

//adding user to the DB
router.post("/addUser", async (req, res) => {
  console.log("BODY /addUser:", req.body); // should log { user_id, username }
  const { user_id, username } = req.body;
  if (!user_id || !username) {
    return res.status(400).json({ error: "user_id and username are required" });
  }
  const { data, error } = await supabase
    .from("users")
    .insert({ user_id, username })
    .select("*")
    .single();

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
});

function parseMinute(displayClock?: string | null): number | null {
  if (!displayClock) return null;
  const m = /(\d+)/.exec(displayClock);
  return m ? parseInt(m[1], 10) : null;
}

// Creates or returns an existing team by name
async function getOrCreateTeamByName(
  name?: string | null,
  info?: {
    short_name?: string | null;
    abbreviation?: string | null;
    display_name?: string | null;
    logo_url?: string | null;
  }
) {
  if (!name) return null;
  // upsert on unique name
  const { data, error } = await supabase
    .from("teams")
    .upsert(
      {
        name,
        short_name: info?.short_name ?? null,
        abbreviation: info?.abbreviation ?? null,
        display_name: info?.display_name ?? null,
        logo_url: info?.logo_url ?? null,
      },
      { onConflict: "name" }
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id as number;
}

// Creates or returns an existing venue (unique by name+city)
async function getOrCreateVenue(
  name?: string | null,
  city?: string | null,
  country?: string | null
) {
  if (!name) return null;
  const { data, error } = await supabase
    .from("venues")
    .upsert(
      { name, city: city ?? null, country: country ?? null },
      { onConflict: "name,city" }
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id as number;
}

// Validate event type
const allowedEventTypes = new Set([
  "goal",
  "own_goal",
  "penalty_goal",
  "penalty_miss",
  "yellow",
  "red",
  "substitution",
  "var",
]);

/* =========================================
   MATCH MANAGEMENT API (NEW)
   - Create matches (scheduled or completed)
   - Update scores/status/minute/attendance/venue
   - Add timeline events (goals/cards/penalties/subs)
   - Read match full with names + events
========================================= */

/**
 * POST /matches
 * Create a match (scheduled or completed).
 * Request body examples:
 * {
 *   "league_code": "local.u20",
 *   "season_year": 2025,
 *   "utc_kickoff": "2025-09-10T13:00:00Z",
 *   "status": "final",                    // optional; trigger will normalize
 *   "status_detail": "FT",
 *   "minute": null,
 *   "attendance": 120,
 *   // provide either ids or names (names will create teams/venue if needed)
 *   "home_team_id": 1,
 *   "away_team_id": 2,
 *   "home_team_name": "My Club",          // used if id not provided
 *   "away_team_name": "Opponents FC",
 *   "venue_name": "Local Park", "venue_city": "Joburg", "venue_country": "South Africa",
 *   "home_score": 2, "away_score": 1
 * }
 */
router.post("/matches", async (req, res) => {
  try {
    const {
      league_code,
      season_year,
      week_number,
      utc_kickoff,
      status,
      status_detail,
      minute,
      attendance,
      home_team_id,
      away_team_id,
      home_team_name,
      away_team_name,
      home_score,
      away_score,
      venue_id,
      venue_name,
      venue_city,
      venue_country,
      created_by, // <-- NEW
      notes_json,
    } = req.body || {};

    if (!league_code || !utc_kickoff) {
      return res
        .status(400)
        .json({ error: "league_code and utc_kickoff are required" });
    }

    let homeId = home_team_id ?? null;
    let awayId = away_team_id ?? null;
    let venId = venue_id ?? null;

    if (!homeId && home_team_name)
      homeId = await getOrCreateTeamByName(home_team_name);
    if (!awayId && away_team_name)
      awayId = await getOrCreateTeamByName(away_team_name);
    if (!venId && venue_name)
      venId = await getOrCreateVenue(venue_name, venue_city, venue_country);

    const { data, error } = await supabase
      .from("matches")
      .insert({
        league_code,
        season_year: season_year ?? null,
        week_number: week_number ?? null,
        utc_kickoff,
        status: status ?? "scheduled",
        status_detail: status_detail ?? null,
        minute: minute ?? null,
        attendance: attendance ?? null,
        home_team_id: homeId,
        away_team_id: awayId,
        home_score: home_score ?? null,
        away_score: away_score ?? null,
        venue_id: venId,
        created_by: created_by ?? null, // <-- store user who created it
        notes_json: notes_json ?? null,
      })
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ match: data });
  } catch (e: any) {
    console.error("POST /matches error", e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * PATCH /matches/:id
 * Partial update of a match: scores, status, minute, attendance, venue, etc.
 * Body can include any of the match fields you want to change.
 */
router.patch("/matches/:id", async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    if (!matchId) return res.status(400).json({ error: "Invalid match id" });

    const patch: Record<string, any> = {};
    const allowed = [
      "league_code",
      "season_year",
      "week_number",
      "utc_kickoff",
      "status",
      "status_detail",
      "minute",
      "attendance",
      "home_team_id",
      "away_team_id",
      "home_score",
      "away_score",
      "venue_id",
    ];
    for (const k of allowed) if (k in req.body) patch[k] = req.body[k];

    // (Optional) venue by name if not id is given
    if (
      !patch.venue_id &&
      (req.body.venue_name || req.body.venue_city || req.body.venue_country)
    ) {
      const venId = await getOrCreateVenue(
        req.body.venue_name ?? null,
        req.body.venue_city ?? null,
        req.body.venue_country ?? null
      );
      patch.venue_id = venId;
    }

    const { data, error } = await supabase
      .from("matches")
      .update(patch)
      .eq("id", matchId)
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ match: data });
  } catch (e: any) {
    console.error("PATCH /matches/:id error", e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * POST /matches/:id/score
 * Body: { home_score: number, away_score: number }
 * (Nice convenience endpoint for “user changes the score”)
 */
router.post("/matches/:id/score", async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    const { home_score, away_score } = req.body || {};
    if (home_score == null || away_score == null) {
      return res
        .status(400)
        .json({ error: "home_score and away_score are required" });
    }
    const { data, error } = await supabase
      .from("matches")
      .update({ home_score, away_score })
      .eq("id", matchId)
      .select("*")
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ match: data });
  } catch (e: any) {
    console.error("POST /matches/:id/score error", e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * POST /matches/:id/finalize
 * Requires scores present (your DB trigger will enforce).
 */
router.post("/matches/:id/finalize", async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    const { status_detail } = req.body || {};
    const patch: any = { status: "final" };
    if (status_detail) patch.status_detail = status_detail;

    const { data, error } = await supabase
      .from("matches")
      .update(patch)
      .eq("id", matchId)
      .select("*")
      .single();

    if (error) return res.status(400).json({ error: error.message }); // trigger might raise if no scores
    return res.json({ match: data });
  } catch (e: any) {
    console.error("POST /matches/:id/finalize error", e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * POST /matches/:id/unfinalize
 * Allows further edits to scores after final (set status back).
 */
router.post("/matches/:id/unfinalize", async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    const next = req.body?.status ?? "in_progress"; // or 'scheduled'
    const { data, error } = await supabase
      .from("matches")
      .update({ status: next })
      .eq("id", matchId)
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ match: data });
  } catch (e: any) {
    console.error("POST /matches/:id/unfinalize error", e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * GET /matches/:id
 * Returns match with team/venue names and events.
 */
router.get("/matches/:id", async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    if (!matchId) return res.status(400).json({ error: "Invalid match id" });

    // fetch match
    const { data: match, error: mErr } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();
    if (mErr || !match)
      return res.status(404).json({ error: "Match not found" });

    // join names
    const [{ data: home }, { data: away }, { data: venue }] = await Promise.all(
      [
        supabase
          .from("teams")
          .select("id,name,abbreviation")
          .eq("id", match.home_team_id)
          .maybeSingle(),
        supabase
          .from("teams")
          .select("id,name,abbreviation")
          .eq("id", match.away_team_id)
          .maybeSingle(),
        supabase
          .from("venues")
          .select("id,name,city,country")
          .eq("id", match.venue_id)
          .maybeSingle(),
      ]
    );

    // events ordered by time
    const { data: events, error: eErr } = await supabase
      .from("match_events")
      .select(
        "id,team_id,player_name,minute,added_time,event_type,detail,outcome,created_at"
      )
      .eq("match_id", matchId)
      .order("minute", { ascending: true })
      .order("id", { ascending: true });

    if (eErr) return res.status(500).json({ error: eErr.message });

    return res.json({
      match,
      home_team: home ?? null,
      away_team: away ?? null,
      venue: venue ?? null,
      events: events ?? [],
    });
  } catch (e: any) {
    console.error("GET /matches/:id error", e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * POST /matches/:id/events
 * Adds a timeline event (goal, card, penalty, etc.)
 * Body:
 * {
 *   "event_type": "goal" | "own_goal" | "penalty_goal" | "penalty_miss" | "yellow" | "red" | "substitution" | "var",
 *   "team_id": 123,                           // optional if you don’t care
 *   "player_name": "Jane Doe",
 *   "minute": 45,
 *   "added_time": 2,                          // for 45+2
 *   "detail": "Foul",                         // optional
 *   "outcome": "scored" | "missed" | "saved"  // for pens (optional)
 * }
 */
router.post("/matches/:id/events", async (req, res) => {
  try {
    const match_id = Number(req.params.id);
    if (!match_id) return res.status(400).json({ error: "Invalid match id" });

    const {
      event_type,
      team_id,
      player_name,
      minute,
      added_time,
      detail,
      outcome,
    } = req.body || {};
    if (!event_type || !allowedEventTypes.has(String(event_type))) {
      return res.status(400).json({
        error: `event_type required and must be one of: ${Array.from(
          allowedEventTypes
        ).join(", ")}`,
      });
    }

    const { data, error } = await supabase
      .from("match_events")
      .insert({
        match_id,
        team_id: team_id ?? null,
        player_name: player_name ?? null,
        minute: minute ?? null,
        added_time: added_time ?? null,
        event_type,
        detail: detail ?? null,
        outcome: outcome ?? null,
      })
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ event: data });
  } catch (e: any) {
    console.error("POST /matches/:id/events error", e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /matches/:id/events/:eventId
 * Removes a specific event from the match timeline.
 */
router.delete("/matches/:id/events/:eventId", async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    const eventId = Number(req.params.eventId);
    if (!matchId || !eventId)
      return res.status(400).json({ error: "Invalid ids" });

    const { error } = await supabase
      .from("match_events")
      .delete()
      .eq("id", eventId)
      .eq("match_id", matchId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /matches/:id/events/:eventId error", e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * GET /matches (optional convenience)
 * Query params: league_code? status? from? to?
 * Returns recent matches with names joined.
 */
router.get("/matches", async (req, res) => {
  try {
    const { league_code, status, from, to, created_by } = req.query as {
      league_code?: string;
      status?: string;
      from?: string;
      to?: string;
      created_by?: string; // <-- NEW
    };

    let q = supabase.from("matches").select("*");

    if (league_code) q = q.eq("league_code", league_code);
    if (status) q = q.eq("status", status);
    if (from) q = q.gte("utc_kickoff", from);
    if (to) q = q.lte("utc_kickoff", to);
    if (created_by) q = q.eq("created_by", created_by); // <-- filter by user

    q = q.order("utc_kickoff", { ascending: false }).limit(100);

    const { data: matches, error } = await q;
    if (error) return res.status(500).json({ error: error.message });

    // join names (batched lookups)
    const teamIds = Array.from(
      new Set(
        (matches ?? [])
          .flatMap((m) => [m.home_team_id, m.away_team_id])
          .filter(Boolean)
      )
    ) as number[];
    const venueIds = Array.from(
      new Set((matches ?? []).map((m) => m.venue_id).filter(Boolean))
    ) as number[];

    const [teamsRes, venuesRes] = await Promise.all([
      teamIds.length
        ? supabase
            .from("teams")
            .select("id,name,abbreviation")
            .in("id", teamIds)
        : Promise.resolve({ data: [] as any[] }),
      venueIds.length
        ? supabase
            .from("venues")
            .select("id,name,city,country")
            .in("id", venueIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const teamMap = new Map<number, any>(
      (teamsRes.data ?? []).map((t) => [t.id, t])
    );
    const venueMap = new Map<number, any>(
      (venuesRes.data ?? []).map((v) => [v.id, v])
    );

    const enriched = (matches ?? []).map((m) => ({
      ...m,
      home_team: m.home_team_id ? teamMap.get(m.home_team_id) : null,
      away_team: m.away_team_id ? teamMap.get(m.away_team_id) : null,
      venue: m.venue_id ? venueMap.get(m.venue_id) : null,
    }));

    return res.json({ matches: enriched });
  } catch (e: any) {
    console.error("GET /matches error", e);
    return res.status(500).json({ error: e.message });
  }
});

/* --------------- Start server --------------- */
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default router;
