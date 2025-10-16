// src/api/fpl.ts

/**
 * Generic safe fetch helper
 * Returns parsed JSON or null on failure.
 */
export async function safeGet<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error("FPL API Error:", err);
    return null;
  }
}

/**
 * Automatically detect environment (local vs production)
 * so the correct base URL is used.
 */
const isLocalhost = window.location.hostname === "localhost";
const BASE_PROXY_URL = isLocalhost
  ? "http://localhost:3000/api/fpl"
  : "https://sdp-webserver.onrender.com/api/fpl"; // ✅ Your real backend (Render) URL

/**
 * Interfaces for FPL endpoints
 */
export interface FPLEntry {
  id: number;
  name: string;
  player_first_name: string;
  player_last_name: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  leagues?: {
    classic?: {
      id: number;
      name: string;
      entry_rank: number;
    }[];
  };
}

export interface UserPicksResponse {
  picks: {
    element: number;
    is_captain: boolean;
  }[];
}

export interface LeagueStandingsResponse {
  standings: {
    results: {
      entry: number;
      entry_name: string;
      player_name: string;
      rank: number;
      last_rank: number;
      total: number;
    }[];
  };
}

/**
 * Fetch general static data (players, teams, events, settings)
 */
export const getBootstrap = () => safeGet(`${BASE_PROXY_URL}/bootstrap-static`);

/**
 * Fetch a specific user's (team manager’s) info
 */
export const getEntry = (entryId: number) =>
  safeGet<FPLEntry>(`${BASE_PROXY_URL}/entry/${entryId}`);

/**
 * Fetch user's entry history
 */
export const getEntryHistory = (entryId: number) =>
  safeGet(`${BASE_PROXY_URL}/entry/${entryId}/history`);

/**
 * Fetch user's picks for a specific gameweek
 */
export const getUserPicks = (entryId: number, event: number) =>
  safeGet<UserPicksResponse>(
    `${BASE_PROXY_URL}/entry/${entryId}/event/${event}/picks`
  );

/**
 * Fetch real-time live data for a specific gameweek
 */
export const getLiveGWData = (event: number) =>
  safeGet(`${BASE_PROXY_URL}/event/${event}/live`);

/**
 * Fetch standings for a classic league
 */
export const getLeagueStandings = (leagueId: number) =>
  safeGet<LeagueStandingsResponse>(
    `${BASE_PROXY_URL}/leagues-classic/${leagueId}/standings`
  );

/**
 * Fetch data for head-to-head league standings
 */
export const getH2HLeagueStandings = (leagueId: number) =>
  safeGet(`${BASE_PROXY_URL}/leagues-h2h/${leagueId}/standings`);

/**
 * Fetch all fixtures
 */
export const getFixtures = () => safeGet(`${BASE_PROXY_URL}/fixtures`);

/**
 * Fetch all teams
 */
export const getTeams = () => safeGet(`${BASE_PROXY_URL}/teams`);

/**
 * Fetch transfers made by a given user
 */
export const getTransfers = (entryId: number) =>
  safeGet(`${BASE_PROXY_URL}/entry/${entryId}/transfers`);

/**
 * Fetch detailed player (element) data by ID
 */
export const getPlayerSummary = (elementId: number) =>
  safeGet(`${BASE_PROXY_URL}/element-summary/${elementId}`);

/**
 * Fetch all leagues the user is part of
 */
export const getUserLeagues = async (entryId: number) => {
  const entryData = await getEntry(entryId);
  return entryData?.leagues?.classic || [];
};
