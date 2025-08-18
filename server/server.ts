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
