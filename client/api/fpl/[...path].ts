// client/api/fpl/[...path].ts

export default async function handler(req: any, res: any) {
  try {
    const path = Array.isArray(req.query.path)
      ? req.query.path.join("/")
      : req.query.path;

    // ✅ removed the trailing slash
    const url = `https://fantasy.premierleague.com/api/${path}`;
    console.log("Proxying FPL request:", url);

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }, // prevent FPL from rejecting serverless fetches
    });

    if (!response.ok) {
      console.error(
        "Upstream FPL response:",
        response.status,
        response.statusText
      );
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err: any) {
    console.error("FPL proxy error:", err);
    res.status(500).json({ error: "Failed to fetch from FPL API" });
  }
}
