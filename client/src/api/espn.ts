export type ScoreboardResponse = {
    leagues?: Array<{ id: string; name: string }>;
    events: Array<{
      id: string;
      date: string;
      name: string;
      shortName: string;
      status: { type: { state: "pre"|"in"|"post"; detail: string; completed: boolean } };
      competitions: Array<{
        id: string;
        venue?: { fullName?: string };
        competitors: Array<{
          id: string;
          homeAway: "home" | "away";
          team: { id: string; shortDisplayName: string; logo?: string };
          score?: string;
          records?: Array<{ name: string; summary: string }>;
        }>;
        situation?: { lastPlay?: { text?: string } };
      }>;
      links?: Array<{ href: string }>;
      headlines?: Array<{ description: string; shortLinkText?: string; type?: string; lastModified: string }>;
    }>;
  };
  
  const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard";
  
  /**
   * Format: YYYYMMDD (e.g., 20250818). ESPN accepts `?dates=` for a specific day.
   */
  export function formatEspnDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  }
  
  export async function fetchScoreboard(date?: Date): Promise<ScoreboardResponse> {
    const url = new URL(BASE);
    if (date) url.searchParams.set("dates", formatEspnDate(date));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status}`);
    return res.json();
  }
  