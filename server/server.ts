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

// 2) Create a team (or return existing if same name)
router.post("/teams", async (req, res) => {
  const { name, short_name, abbreviation, display_name, logo_url } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Team name is required" });
  }

  try {
    // upsert: if team with same name exists, return it
    const { data, error } = await supabase
      .from("teams")
      .upsert(
        {
          name: name.trim(),
          short_name: short_name ?? null,
          abbreviation: abbreviation ?? null,
          display_name: display_name ?? null,
          logo_url: logo_url ?? null,
        },
        { onConflict: "name" }
      )
      .select("*")
      .single();

    if (error) {
      console.error("❌ Supabase error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  } catch (err: any) {
    console.error("❌ Failed to create team:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
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
  "yellow_card",
  "red_card",
  "foul",
  "substitution",
  "save",
  "shot_on_target",
  "shot_off_target",
  "assist",
  "offside",
  "injury",
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
        home_score: home_score ?? 0,
        away_score: away_score ?? 0,
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
// ✅ Update possession for a match
app.patch("/matches/:id/possession", async (req, res) => {
  const { id } = req.params;
  const { home_possession, away_possession } = req.body;

  // Ensure both sides add up to 100
  if (home_possession + away_possession !== 100) {
    return res.status(400).json({ error: "Possession must add up to 100" });
  }

  try {
    const { data, error } = await supabase
      .from("matches")
      .update({ home_possession, away_possession })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to update possession:", error);
      return res.status(500).json({ error: "Failed to update possession" });
    }

    res.json({ match: data });
  } catch (err) {
    console.error("❌ Server error updating possession:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
});

router.delete("/matches/:id", async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    if (!matchId) return res.status(400).json({ error: "Invalid match id" });

    const { data: match, error: fetchErr } = await supabase
      .from("matches")
      .select("id, status")
      .eq("id", matchId)
      .maybeSingle();

    if (fetchErr || !match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (match.status !== "scheduled") {
      return res
        .status(400)
        .json({ error: "Only upcoming (scheduled) matches can be deleted" });
    }

    const { error: delErr } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchId);

    if (delErr) {
      return res.status(500).json({ error: delErr.message });
    }

    return res.json({ success: true });
  } catch (e: any) {
    console.error("DELETE /matches/:id error", e);
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

    // 🔒 Privacy check
    const { user_id, username } = req.query as {
      user_id?: string;
      username?: string;
    };
    const privacy = match.notes_json?.privacy || "public";
    if (privacy === "private") {
      if (!user_id || !username) {
        return res.status(403).json({ error: "Not authorized" });
      }
      if (
        match.created_by !== user_id &&
        !(match.notes_json?.invitedUsers || []).includes(username)
      ) {
        return res.status(403).json({ error: "Not authorized" });
      }
    }

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

    // ✅ Ensure scores are never null + embed teams/venue inside match
    const safeMatch = {
      ...match,
      home_score: match.home_score ?? 0,
      away_score: match.away_score ?? 0,
      events: events ?? [],
      home_team: home ?? null,
      away_team: away ?? null,
      venue: venue ?? null,
    };

    console.log(
      "📤 Returning match with scores:",
      safeMatch.home_score,
      safeMatch.away_score,
      "| Events:",
      safeMatch.events.length
    );

    return res.json({ match: safeMatch });
  } catch (e: any) {
    console.error("GET /matches/:id error", e);
    return res.status(500).json({ error: e.message });
  }
});
/**
 * GET /matches/:id
 * Returns match with team/venue names and events.
 */
/*router.get("/matches/:id", async (req, res) => {
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
});*/

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

/**
 * POST /matches/:id/events
 * Adds a timeline event (goal, card, foul, etc.)
 */

// PUT /matches/:id
router.put("/matches/:id", async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    const updates = req.body;

    const { error } = await supabase
      .from("matches")
      .update(updates)
      .eq("id", matchId);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (e: any) {
    console.error("PUT /matches/:id error", e);
    res.status(500).json({ error: e.message });
  }
});

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

    // ✅ Step 1: log if event_type invalid
    if (!event_type || !allowedEventTypes.has(event_type)) {
      console.error("❌ Invalid event_type received:", event_type);
      return res.status(400).json({
        error: `event_type must be one of: ${Array.from(allowedEventTypes).join(
          ", "
        )}`,
      });
    }

    // ✅ Step 3: sanitize empty strings → null
    const insertPayload = {
      match_id,
      team_id: team_id === "" ? null : team_id,
      player_name: player_name === "" ? null : player_name,
      minute: minute === "" ? null : minute,
      added_time: added_time === "" ? null : added_time,
      event_type,
      detail: detail === "" ? null : detail,
      outcome: outcome === "" ? null : outcome,
    };

    console.log("📥 Final insert payload:", insertPayload);

    // Insert event
    const { data: event, error: insertErr } = await supabase
      .from("match_events")
      .insert(insertPayload)
      .select("*")
      .single();

    if (insertErr) {
      console.error("❌ Supabase insert error:", insertErr.message);
      return res.status(500).json({ error: insertErr.message });
    }

    // Optional: update score if goal/own goal
    if (event_type === "goal" || event_type === "own_goal") {
      const { data: match, error: matchErr } = await supabase
        .from("matches")
        .select("home_team_id, away_team_id, home_score, away_score")
        .eq("id", match_id)
        .single();

      if (!match || matchErr) {
        console.error("❌ Failed to fetch match for score update:", matchErr);
      } else {
        let home_score = match.home_score ?? 0;
        let away_score = match.away_score ?? 0;

        if (event_type === "goal") {
          if (team_id === match.home_team_id) home_score++;
          if (team_id === match.away_team_id) away_score++;
        } else if (event_type === "own_goal") {
          if (team_id === match.home_team_id) away_score++;
          if (team_id === match.away_team_id) home_score++;
        }

        const { error: updateErr } = await supabase
          .from("matches")
          .update({ home_score, away_score })
          .eq("id", match_id);

        if (updateErr) {
          console.error("❌ Failed to update score:", updateErr.message);
        } else {
          console.log("✅ Score updated:", { home_score, away_score });
        }
      }
    }

    return res.status(201).json({ event });
  } catch (e: any) {
    console.error("POST /matches/:id/events error", e);
    return res.status(500).json({ error: e.message });
  }
});

/*router.post("/matches/:id/events", async (req, res) => {
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
});*/

// PATCH /matches/:id/extend
router.patch("/matches/:id/extend", async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    const { extra_minutes } = req.body;

    console.log("🔍 Incoming extend request");
    console.log("   ➡️ matchId:", matchId);
    console.log("   ➡️ extra_minutes:", extra_minutes);

    if (!matchId || !extra_minutes) {
      console.error("❌ Missing parameters: matchId or extra_minutes");
      return res
        .status(400)
        .json({ error: "matchId and extra_minutes required" });
    }

    // Fetch the match row
    const { data: match, error: fetchErr } = await supabase
      .from("matches")
      .select("id, notes_json")
      .eq("id", matchId)
      .maybeSingle(); // ✅ use maybeSingle so it doesn't throw if no row

    console.log("📦 Supabase response:", { match, fetchErr });

    if (fetchErr || !match) {
      console.error("❌ Match not found or query failed:", fetchErr?.message);
      return res.status(404).json({ error: "Match not found" });
    }

    // Default duration to 90 if missing
    const currentDuration = Number(match.notes_json?.duration ?? 90);
    const newDuration = currentDuration + Number(extra_minutes);

    console.log(
      `⏱️ Extending match ${matchId}: ${currentDuration} → ${newDuration}`
    );

    const { data: updated, error: updateErr } = await supabase
      .from("matches")
      .update({
        notes_json: { ...match.notes_json, duration: newDuration },
      })
      .eq("id", matchId)
      .select("*")
      .single();

    if (updateErr) {
      console.error("❌ Failed to update duration:", updateErr.message);
      return res.status(500).json({ error: updateErr.message });
    }

    console.log("✅ Duration updated successfully:", updated.notes_json);
    res.json({ match: updated });
  } catch (e: any) {
    console.error("💥 PATCH /matches/:id/extend error", e);
    res.status(500).json({ error: e.message });
  }
});

// ======================
// GET /matches/:id/details
// ======================
/*router.get("/matches/:id/details", async (req, res) => {
  const matchId = Number(req.params.id);
  console.log(`[API] Incoming request: /matches/${matchId}/details`);

  try {
    // Fetch match
    const { data: match, error: matchErr } = await supabase
      .from("matches")
      .select("*, home_team:home_team_id(*), away_team:away_team_id(*), venue:venue_id(*)")
      .eq("id", matchId)
      .single();

    if (matchErr) {
      console.error("[API] Error fetching match:", matchErr);
      return res.status(500).json({ error: "Failed to fetch match" });
    }
    if (!match) {
      console.warn("[API] No match found for id", matchId);
      return res.status(404).json({ error: "Match not found" });
    }

    // Fetch events
    const { data: events, error: eventErr } = await supabase
      .from("match_events")
      .select("*")
      .eq("match_id", matchId)
      .order("minute", { ascending: true });

    if (eventErr) {
      console.error("[API] Error fetching events:", eventErr);
      return res.status(500).json({ error: "Failed to fetch events" });
    }

    console.log(
      `[API] Success: Match ${matchId} details fetched with ${events?.length || 0} events`
    );

    res.json({ match, events });
  } catch (err) {
    console.error("[API] Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
});*/

router.get("/matches/:id/details", async (req, res) => {
  const matchId = Number(req.params.id);
  console.log(`[API] Incoming request: /matches/${matchId}/details`);

  try {
    const { data: match, error: matchErr } = await supabase
      .from("matches")
      .select(
        "*, home_team:home_team_id(*), away_team:away_team_id(*), venue:venue_id(*)"
      )
      .eq("id", matchId)
      .single();

    if (matchErr) {
      console.error("[API] Error fetching match:", matchErr);
      return res.status(500).json({ error: "Failed to fetch match" });
    }

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    const { data: events, error: eventErr } = await supabase
      .from("match_events")
      .select("*")
      .eq("match_id", matchId)
      .order("minute", { ascending: true });

    if (eventErr) {
      console.error("[API] Error fetching events:", eventErr);
      return res.status(500).json({ error: "Failed to fetch events" });
    }

    // Extract squads from notes_json
    const lineupTeam1 = match.notes_json?.lineupTeam1 ?? [];
    const lineupTeam2 = match.notes_json?.lineupTeam2 ?? [];

    res.json({ match, events, lineupTeam1, lineupTeam2 });
  } catch (err) {
    console.error("[API] Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
});

/**
 * DELETE /matches/:id/events/:eventId
 * Removes a specific event from the match timeline.
 * If it's a goal/own_goal, adjust scores accordingly.
 */
router.delete("/matches/:id/events/:eventId", async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    const eventId = Number(req.params.eventId);
    if (!matchId || !eventId)
      return res.status(400).json({ error: "Invalid ids" });

    // Fetch the event before deleting
    const { data: event, error: fetchErr } = await supabase
      .from("match_events")
      .select("*")
      .eq("id", eventId)
      .eq("match_id", matchId)
      .single();

    if (fetchErr || !event) {
      console.error("❌ Event not found:", fetchErr?.message);
      return res.status(404).json({ error: "Event not found" });
    }

    console.log("🗑️ Deleting event:", event);

    // Delete the event
    const { error: delErr } = await supabase
      .from("match_events")
      .delete()
      .eq("id", eventId)
      .eq("match_id", matchId);

    if (delErr) {
      console.error("❌ Failed to delete event:", delErr.message);
      return res.status(500).json({ error: delErr.message });
    }

    // Adjust score if it was a goal / own goal
    if (event.event_type === "goal" || event.event_type === "own_goal") {
      const { data: match, error: matchErr } = await supabase
        .from("matches")
        .select("home_team_id, away_team_id, home_score, away_score")
        .eq("id", matchId)
        .single();

      if (!match || matchErr) {
        console.error("❌ Failed to fetch match for score adjust:", matchErr);
      } else {
        let home_score = match.home_score ?? 0;
        let away_score = match.away_score ?? 0;

        if (event.event_type === "goal") {
          if (event.team_id === match.home_team_id) home_score--;
          if (event.team_id === match.away_team_id) away_score--;
        } else if (event.event_type === "own_goal") {
          if (event.team_id === match.home_team_id) away_score--;
          if (event.team_id === match.away_team_id) home_score--;
        }

        // prevent negative scores
        home_score = Math.max(home_score, 0);
        away_score = Math.max(away_score, 0);

        const { error: updateErr } = await supabase
          .from("matches")
          .update({ home_score, away_score })
          .eq("id", matchId);

        if (updateErr) {
          console.error(
            "❌ Failed to update score after delete:",
            updateErr.message
          );
        } else {
          console.log("✅ Score adjusted after delete:", {
            home_score,
            away_score,
          });
        }
      }
    }

    return res.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /matches/:id/events/:eventId error", e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /matches/:id/events/:eventId
 * Removes a specific event from the match timeline.
 */
/*router.delete("/matches/:id/events/:eventId", async (req, res) => {
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
});*/

/**
 * GET /matches (optional convenience)
 * Query params: league_code? status? from? to?
 * Returns recent matches with names joined.
 */
/*router.get("/matches", async (req, res) => {
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
});*/

/* ---------------- USER REPORTS ---------------- */

// Create a new report for a match
app.post("/matches/:id/reports", async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const { data, error } = await supabase
      .from("match_reports")
      .insert([{ match_id: Number(id), message }])
      .select();

    if (error) throw error;

    res.json({ report: data[0] });
  } catch (err: any) {
    console.error("[Backend] Failed to create report:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all reports for a match
app.get("/matches/:id/reports", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("match_reports")
      .select("*")
      .eq("match_id", Number(id))
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ reports: data });
  } catch (err: any) {
    console.error("[Backend] Failed to fetch reports:", err);
    res.status(500).json({ error: err.message });
  }
});

// (Optional) Delete a specific report
app.delete("/matches/:id/reports/:reportId", async (req, res) => {
  const { id, reportId } = req.params;

  try {
    const { error } = await supabase
      .from("match_reports")
      .delete()
      .eq("id", Number(reportId))
      .eq("match_id", Number(id));

    if (error) throw error;

    res.json({ success: true });
  } catch (err: any) {
    console.error("[Backend] Failed to delete report:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/matches", async (req, res) => {
  try {
    const {
      league_code,
      status,
      from,
      to,
      created_by,
      type,
      user_id,
      username,
    } = req.query as {
      league_code?: string;
      status?: string;
      from?: string;
      to?: string;
      created_by?: string;
      type?: string;
      user_id?: string; // NEW
      username?: string; // NEW
    };

    let q = supabase.from("matches").select("*");

    if (league_code) q = q.eq("league_code", league_code);
    if (status) q = q.eq("status", status);
    if (from) q = q.gte("utc_kickoff", from);
    if (to) q = q.lte("utc_kickoff", to);
    if (created_by) q = q.eq("created_by", created_by);

    q = q.order("utc_kickoff", { ascending: false }).limit(100);

    const { data: matches, error } = await q;
    if (error) return res.status(500).json({ error: error.message });

    // 🔒 Filter private matches
    const filtered = (matches ?? []).filter((m: any) => {
      const privacy = m.notes_json?.privacy || "public";
      if (privacy === "public") return true;
      if (!user_id || !username) return false;
      if (m.created_by === user_id) return true;
      if ((m.notes_json?.invitedUsers || []).includes(username)) return true;
      return false;
    });

    // join names (batched lookups)
    const teamIds = Array.from(
      new Set(
        (filtered ?? [])
          .flatMap((m) => [m.home_team_id, m.away_team_id])
          .filter(Boolean)
      )
    ) as number[];
    const venueIds = Array.from(
      new Set((filtered ?? []).map((m) => m.venue_id).filter(Boolean))
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

    let enriched = (filtered ?? []).map((m) => ({
      ...m,
      home_team: m.home_team_id ? teamMap.get(m.home_team_id) : null,
      away_team: m.away_team_id ? teamMap.get(m.away_team_id) : null,
      venue: m.venue_id ? venueMap.get(m.venue_id) : null,
    }));

    // ✅ Apply type filter if requested
    if (type) {
      const now = new Date();
      enriched = enriched.filter((m) => {
        const kickoff = new Date(m.utc_kickoff);
        const duration = Number(m.notes_json?.duration ?? 90);
        const end = new Date(kickoff.getTime() + duration * 60000);

        switch (type) {
          case "live":
            return m.status !== "final" && now >= kickoff && now <= end;
          case "past":
            return m.status === "final" || now > end;
          case "upcoming":
            return now < kickoff;
          default:
            return true;
        }
      });
    }

    console.log(
      `[Backend] /matches type=${type || "all"} → ${enriched.length} matches`
    );

    return res.json({ matches: enriched });
  } catch (e: any) {
    console.error("GET /matches error", e);
    return res.status(500).json({ error: e.message });
  }
});

type WatchalongItem = {
  id: string;
  title: string;
  channelTitle: string;
  url: string;
  thumbnail: string;
  description?: string;
  publishedAt?: string;
  isLive?: boolean;
  liveViewers?: number | null;
  scheduledStartTime?: string;
  actualStartTime?: string;
  viewCount?: number | null;
  duration?: string;
};

const FALLBACK_WATCHALONGS: WatchalongItem[] = [
  {
    id: "sample-live-1",
    title: "The Red Banner Watchalong: Man United vs Arsenal",
    channelTitle: "The Red Banner",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    isLive: true,
    liveViewers: 12450,
    description:
      "Live watchalong with instant reaction to every kick at Old Trafford.",
  },
  {
    id: "sample-live-2",
    title: "City Voice Live: Manchester City Watchalong",
    channelTitle: "City Voice",
    url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    isLive: true,
    liveViewers: 8320,
    description:
      "Join the City Voice crew for minute-by-minute reactions and tactical discussion.",
  },
  {
    id: "sample-live-3",
    title: "North London Derby Watchalong",
    channelTitle: "Premier Fan TV",
    url: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
    thumbnail: "https://i.ytimg.com/vi/3JZ_D3ELwOQ/hqdefault.jpg",
    isLive: true,
    liveViewers: 5640,
    description:
      "Live Premier League watch party with polls, chat, and analysis.",
  },
];

const FALLBACK_REACTIONS: WatchalongItem[] = [
  {
    id: "sample-reaction-1",
    title: "Liverpool Fans GO WILD vs Chelsea! Last-Minute Winner Reaction",
    channelTitle: "Kop Corner",
    url: "https://www.youtube.com/watch?v=l482T0yNkeo",
    thumbnail: "https://i.ytimg.com/vi/l482T0yNkeo/hqdefault.jpg",
    description:
      "Pure chaos in the studio as the Reds snatch all three points.",
    publishedAt: "2024-08-28T19:15:00Z",
    viewCount: 98000,
  },
  {
    id: "sample-reaction-2",
    title: "Arsenal Fan TV: Reactions to 4-2 North London Thriller",
    channelTitle: "Arsenal Fan TV",
    url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    thumbnail: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    description:
      "Instant fan takes from the Emirates after a goal-packed derby.",
    publishedAt: "2024-09-14T18:45:00Z",
    viewCount: 125000,
  },
  {
    id: "sample-reaction-3",
    title: "Brighton vs Spurs Fan Reactions | Premier League Highlights",
    channelTitle: "Fan Zone Live",
    url: "https://www.youtube.com/watch?v=60ItHLz5WEA",
    thumbnail: "https://i.ytimg.com/vi/60ItHLz5WEA/hqdefault.jpg",
    description: "Best bits from the south coast as Seagulls stun Spurs.",
    publishedAt: "2024-09-08T16:05:00Z",
    viewCount: 67000,
  },
];

function parseLimit(v: unknown, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), 1), 25);
}

router.get("/watchalongs", async (req, res) => {
  const key = process.env.YOUTUBE_API_KEY;
  const mode =
    typeof req.query.mode === "string" &&
    req.query.mode.toLowerCase() === "clips"
      ? "clips"
      : "watchalong";
  const rawQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const limit = parseLimit(req.query.limit, 8);
  const query =
    rawQuery ||
    (mode === "watchalong"
      ? "premier league watchalong"
      : "premier league fan reaction");

  if (!key) {
    const fallbackItems = (
      mode === "watchalong" ? FALLBACK_WATCHALONGS : FALLBACK_REACTIONS
    ).slice(0, limit);
    return res.json({
      items: fallbackItems,
      query,
      mode,
      isFallback: true,
      message: "Set YOUTUBE_API_KEY for live YouTube data.",
    });
  }

  try {
    const searchParams = new URLSearchParams({
      key,
      part: "snippet",
      maxResults: String(limit),
      q: query,
      type: "video",
      safeSearch: "moderate",
    });

    if (mode === "watchalong") {
      searchParams.set("eventType", "live");
      searchParams.set("order", "viewCount");
    } else {
      searchParams.set("order", "date");
      searchParams.set("videoDuration", "medium");
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`;
    const searchResp = await fetch(searchUrl);
    if (!searchResp.ok) {
      const body = await searchResp.text();
      console.error("YouTube search error", searchResp.status, body);
      return res
        .status(502)
        .json({ error: "Failed to reach YouTube search API" });
    }

    const searchJson: any = await searchResp.json();
    const ids = (searchJson.items ?? [])
      .map((item: any) => item?.id?.videoId)
      .filter((id: string | undefined): id is string => Boolean(id));

    if (!ids.length) {
      return res.json({ items: [], query, mode });
    }

    const detailsParams = new URLSearchParams({
      key,
      part: "snippet,statistics,contentDetails,liveStreamingDetails",
      id: ids.join(","),
    });

    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?${detailsParams.toString()}`;
    const detailsResp = await fetch(detailsUrl);
    if (!detailsResp.ok) {
      const body = await detailsResp.text();
      console.error("YouTube videos error", detailsResp.status, body);
      return res
        .status(502)
        .json({ error: "Failed to reach YouTube videos API" });
    }

    const detailsJson: any = await detailsResp.json();
    const videos: WatchalongItem[] = (detailsJson.items ?? []).map(
      (video: any) => {
        const snippet = video?.snippet ?? {};
        const liveDetails = video?.liveStreamingDetails ?? {};
        const stats = video?.statistics ?? {};
        const thumbnails = snippet?.thumbnails ?? {};
        const thumbnail =
          thumbnails?.maxres?.url ??
          thumbnails?.standard?.url ??
          thumbnails?.high?.url ??
          thumbnails?.medium?.url ??
          thumbnails?.default?.url ??
          "";

        const liveBroadcast = snippet?.liveBroadcastContent;
        const isLive =
          liveBroadcast === "live" ||
          Boolean(liveDetails?.actualStartTime && !liveDetails?.actualEndTime);

        return {
          id: video?.id ?? "",
          title: snippet?.title ?? "Untitled stream",
          channelTitle: snippet?.channelTitle ?? "Unknown channel",
          url: `https://www.youtube.com/watch?v=${video?.id}`,
          thumbnail,
          description: snippet?.description ?? undefined,
          publishedAt: snippet?.publishedAt ?? undefined,
          isLive,
          liveViewers: liveDetails?.concurrentViewers
            ? Number(liveDetails.concurrentViewers)
            : null,
          scheduledStartTime: liveDetails?.scheduledStartTime ?? undefined,
          actualStartTime: liveDetails?.actualStartTime ?? undefined,
          viewCount: stats?.viewCount ? Number(stats.viewCount) : null,
          duration: video?.contentDetails?.duration ?? undefined,
        } satisfies WatchalongItem;
      }
    );

    return res.json({ items: videos, query, mode });
  } catch (error: any) {
    console.error("GET /watchalongs error", error);
    return res
      .status(500)
      .json({ error: "Unexpected error fetching watchalongs" });
  }
});

/* --------------- Start server --------------- */
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default router;
