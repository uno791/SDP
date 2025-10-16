// client/api/fpl/[...path].ts

export default async function handler(req: any, res: any) {
  // Extract the full requested path (e.g. /api/fpl/bootstrap-static)
  const path = Array.isArray(req.query.path)
    ? req.query.path.join("/")
    : req.query.path;
  const url = `https://fantasy.premierleague.com/api/${path}/`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    console.error("FPL proxy error:", err);
    res.status(500).json({ error: "Failed to fetch from FPL API" });
  }
}
