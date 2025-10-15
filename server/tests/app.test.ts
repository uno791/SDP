import request from "supertest";
import app from "../server";
import supabase from "../supabaseClient";
import type { MockSupabaseClient } from "./__mocks__/supabaseClient";

const mockedSupabase = supabase as unknown as MockSupabaseClient;

beforeEach(() => {
  mockedSupabase.__reset();
  delete process.env.YOUTUBE_API_KEY;
});

describe("Basic health endpoints", () => {
  it("GET /api returns hello message", async () => {
    const res = await request(app).get("/api");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Hello from the API");
  });

  it("GET /status returns running status", async () => {
    const res = await request(app).get("/status");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "The server is running" });
  });

  it("GET /names returns usernames", async () => {
    const res = await request(app).get("/names");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ username: "harshil" }),
        expect.objectContaining({ username: "guest" }),
      ])
    );
  });

  it("GET /checkID detects existing and missing ids", async () => {
    const existsRes = await request(app).get("/checkID").query({ user_id: "u1" });
    expect(existsRes.status).toBe(200);
    expect(existsRes.body).toEqual({ exists: true });

    const missingRes = await request(app)
      .get("/checkID")
      .query({ user_id: "unknown" });
    expect(missingRes.status).toBe(200);
    expect(missingRes.body).toEqual({ exists: false });
  });
});

describe("Team management", () => {
  it("GET /teams returns seeded teams", async () => {
    const res = await request(app).get("/teams");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty("name", "Arsenal");
  });

  it("POST /teams requires a name", async () => {
    const res = await request(app).post("/teams").send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /teams creates or upserts a team", async () => {
    const res = await request(app).post("/teams").send({
      name: "Liverpool",
      display_name: "Liverpool FC",
      logo_url: "liv.png",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Liverpool",
      display_name: "Liverpool FC",
    });
    expect(res.body).toHaveProperty("id");
  });
});

describe("Favourite teams", () => {
  it("GET /favourite-teams/:userId returns formatted favourites", async () => {
    const res = await request(app).get("/favourite-teams/u1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        team_id: 1,
        team_name: "Arsenal FC",
        logo: "ars.png",
      },
    ]);
  });

  it("POST /favourite-teams validates payload", async () => {
    const bad = await request(app).post("/favourite-teams").send({});
    expect(bad.status).toBe(400);
    expect(bad.body).toHaveProperty("error");
  });

  it("POST /favourite-teams inserts a favourite", async () => {
    const res = await request(app)
      .post("/favourite-teams")
      .send({ userId: "u1", teamId: 2 });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true });
  });

  it("DELETE /favourite-teams/:userId/:teamId removes favourite", async () => {
    const res = await request(app).delete("/favourite-teams/u1/1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});

describe("User management", () => {
  it("POST /addUser requires fields", async () => {
    const res = await request(app).post("/addUser").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /addUser inserts a user", async () => {
    const res = await request(app)
      .post("/addUser")
      .send({ user_id: "u3", username: "newbie" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toMatchObject({ user_id: "u3", username: "newbie" });
  });
});

describe("Matches CRUD", () => {
  it("POST /matches creates a match and resolves names to ids", async () => {
    const res = await request(app).post("/matches").send({
      league_code: "premier.league",
      utc_kickoff: "2025-06-01T12:00:00Z",
      home_team_name: "Arsenal",
      away_team_name: "Chelsea",
      venue_name: "Emirates Stadium",
      status: "scheduled",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("match");
    expect(res.body.match).toMatchObject({
      league_code: "premier.league",
      home_team_id: 1,
      away_team_id: 2,
    });
  });

  it("PATCH /matches/:id updates allowed fields", async () => {
    const res = await request(app).patch("/matches/101").send({
      home_score: 3,
      away_score: 1,
    });
    expect(res.status).toBe(200);
    expect(res.body.match).toMatchObject({ home_score: 3, away_score: 1 });
  });

  it("POST /matches/:id/score overwrites the score", async () => {
    const res = await request(app)
      .post("/matches/101/score")
      .send({ home_score: 4, away_score: 2 });
    expect(res.status).toBe(200);
    expect(res.body.match).toMatchObject({ home_score: 4, away_score: 2 });
  });

  it("POST /matches/:id/finalize marks match final", async () => {
    const res = await request(app)
      .post("/matches/101/finalize")
      .send({ status_detail: "FT" });
    expect(res.status).toBe(200);
    expect(res.body.match.status).toBe("final");
    expect(res.body.match.status_detail).toBe("FT");
  });

  it("POST /matches/:id/unfinalize resets status", async () => {
    const matches = mockedSupabase.__getTable("matches");
    matches[0].status = "final";
    mockedSupabase.__setTable("matches", matches);

    const res = await request(app)
      .post("/matches/101/unfinalize")
      .send({ status: "in_progress" });
    expect(res.status).toBe(200);
    expect(res.body.match.status).toBe("in_progress");
  });

  it("PATCH /matches/:id/possession validates totals", async () => {
    const bad = await request(app)
      .patch("/matches/101/possession")
      .send({ home_possession: 60, away_possession: 30 });
    expect(bad.status).toBe(400);

    const res = await request(app)
      .patch("/matches/101/possession")
      .send({ home_possession: 55, away_possession: 45 });
    expect(res.status).toBe(200);
    expect(res.body.match).toMatchObject({
      home_possession: 55,
      away_possession: 45,
    });
  });

  it("DELETE /matches/:id enforces scheduled-only deletion", async () => {
    const scheduled = await request(app).delete("/matches/101");
    expect(scheduled.status).toBe(200);
    expect(scheduled.body).toEqual({ success: true });

    const rescheduled = mockedSupabase.__getTable("matches");
    rescheduled.push({
      id: 999,
      league_code: "premier.league",
      utc_kickoff: "2025-06-01T12:00:00Z",
      status: "final",
      home_team_id: 1,
      away_team_id: 2,
      venue_id: 10,
      home_score: 1,
      away_score: 1,
      notes_json: {},
    });
    mockedSupabase.__setTable("matches", rescheduled);

    const finalMatch = await request(app).delete("/matches/999");
    expect(finalMatch.status).toBe(400);
    expect(finalMatch.body).toHaveProperty("error");
  });
});

describe("Match retrieval & privacy", () => {
  it("GET /matches/:id enforces private visibility", async () => {
    const forbidden = await request(app).get("/matches/102");
    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .get("/matches/102")
      .query({ user_id: "u1", username: "harshil" });
    expect(allowed.status).toBe(200);
    expect(allowed.body.match.id).toBe(102);
  });

  it("GET /matches/:id returns 404 for missing match", async () => {
    const res = await request(app).get("/matches/9999");
    expect(res.status).toBe(404);
  });

  it("GET /matches returns only public matches without credentials", async () => {
    const res = await request(app).get("/matches");
    expect(res.status).toBe(200);
    expect(res.body.matches.every((m: any) => m.notes_json?.privacy !== "private")).toBe(
      true
    );
  });

  it("GET /matches includes private matches for invited users", async () => {
    const res = await request(app)
      .get("/matches")
      .query({ user_id: "u1", username: "harshil" });
    expect(res.status).toBe(200);
    const ids = res.body.matches.map((m: any) => m.id);
    expect(ids).toEqual(expect.arrayContaining([101, 102]));
  });
});

describe("Match events workflow", () => {
  it("POST /matches/:id/events rejects invalid event type", async () => {
    const res = await request(app)
      .post("/matches/101/events")
      .send({ event_type: "dance" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("event_type must be one of");
  });

  it("POST /matches/:id/events creates a goal and updates score", async () => {
    const res = await request(app)
      .post("/matches/101/events")
      .send({ event_type: "goal", team_id: 1, minute: 75 });
    expect(res.status).toBe(201);
    expect(res.body.event).toHaveProperty("event_type", "goal");

    const match = mockedSupabase.__getTable("matches").find((m) => m.id === 101);
    expect(match?.home_score).toBeGreaterThan(1);
  });

  it("PATCH /matches/:id/extend updates duration", async () => {
    const res = await request(app)
      .patch("/matches/101/extend")
      .send({ extra_minutes: 30 });
    expect(res.status).toBe(200);
    expect(res.body.match.notes_json.duration).toBe(120);
  });

  it("DELETE /matches/:id/events/:eventId removes event and adjusts score", async () => {
    const res = await request(app).delete("/matches/101/events/9001");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    const events = mockedSupabase.__getTable("match_events");
    expect(events.find((e) => e.id === 9001)).toBeUndefined();
  });

  it("GET /matches/:id/details returns events and lineups", async () => {
    const res = await request(app).get("/matches/101/details");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      match: expect.objectContaining({ id: 101 }),
      events: expect.any(Array),
      lineupTeam1: expect.arrayContaining(["Player A1"]),
      lineupTeam2: expect.arrayContaining(["Player B1"]),
    });
  });
});

describe("Match reports", () => {
  it("POST /matches/:id/reports requires message", async () => {
    const res = await request(app).post("/matches/101/reports").send({});
    expect(res.status).toBe(400);
  });

  it("POST /matches/:id/reports inserts report", async () => {
    const res = await request(app)
      .post("/matches/101/reports")
      .send({ message: "What a match!" });
    expect(res.status).toBe(200);
    expect(res.body.report).toMatchObject({ message: "What a match!" });
  });

  it("GET /matches/:id/reports returns reports", async () => {
    const res = await request(app).get("/matches/101/reports");
    expect(res.status).toBe(200);
    expect(res.body.reports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: "Great game!" }),
      ])
    );
  });

  it("DELETE /matches/:id/reports/:reportId removes report", async () => {
    const reports = mockedSupabase.__getTable("match_reports");
    reports.push({
      id: 5,
      match_id: 101,
      message: "Temporary report",
      created_at: new Date().toISOString(),
    });
    mockedSupabase.__setTable("match_reports", reports);

    const res = await request(app).delete("/matches/101/reports/5");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});

describe("Watchalongs", () => {
  it("falls back to static items when API key missing", async () => {
    const res = await request(app).get("/watchalongs");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      isFallback: true,
      mode: "watchalong",
    });
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
  });
});
