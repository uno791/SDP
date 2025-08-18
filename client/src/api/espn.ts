// src/api/espn.ts

/** ---------------- Scoreboard (kept from before) ---------------- */
export type ScoreboardResponse = {
  events: Array<{
    id: string;
    date: string;
    shortName: string;
    status: { type: { state: "pre" | "in" | "post"; detail: string; completed: boolean } };
    competitions: Array<{
      competitors: Array<{
        homeAway: "home" | "away";
        score?: string;
        team: { shortDisplayName: string; logo?: string };
      }>;
    }>;
  }>;
};

const SCOREBOARD_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard";

/** Format YYYYMMDD for ESPN’s `?dates=` */
export function formatEspnDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export async function fetchScoreboard(date?: Date): Promise<ScoreboardResponse> {
  const url = new URL(SCOREBOARD_BASE);
  if (date) url.searchParams.set("dates", formatEspnDate(date));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`ESPN scoreboard fetch failed: ${res.status}`);
  return res.json();
}

/** ---------------- News (new) ---------------- */
export type EspnNewsResponse = {
  header?: string;
  articles: Array<{
    type?: string;
    headline: string;
    description?: string;
    published: string; // ISO
    lastModified?: string; // ISO
    links?: { web?: { href?: string } };
    images?: Array<{ url: string; width?: number; height?: number; name?: string }>;
    byline?: string;
    categories?: Array<{ type: string; description?: string }>;
  }>;
};

const NEWS_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news";

/** Fetch top EPL news from ESPN */
export async function fetchEplNews(): Promise<EspnNewsResponse> {
  const res = await fetch(NEWS_URL);
  if (!res.ok) throw new Error(`ESPN news fetch failed: ${res.status}`);
  return res.json();
}
