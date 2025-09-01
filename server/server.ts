import supabase from "./supabaseClient";
import express from "express";
import type { Request, Response } from 'express';
import cors from "cors";

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
    .select(`
      team_id,
      teams (
        id,
        name,
        display_name,
        logo_url
      )
    `)
    .eq("user_id", userId);

    console.log("🟡 Raw Supabase favourites response:", JSON.stringify(data, null, 2));

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  const formatted = data.map((f: any) => ({
    team_id: f.team_id,
    team_name: f.teams.display_name || f.teams.name,
    logo: f.teams.logo_url,
  }));

  console.log("🟢 Formatted favourites returned:", JSON.stringify(formatted, null, 2));

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

export default router;
