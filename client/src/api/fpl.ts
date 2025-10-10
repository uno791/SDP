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
  ? "http://localhost:3000/api/fpl" // ✅ FIXED — removed extra /api
  : "https://your-app-name.vercel.app/api/fpl"; // ← replace with your actual Vercel app domain

/**
 * Fetch general static data:
 * players, teams, events, and game settings.
 */
export const getBootstrap = () => safeGet(`${BASE_PROXY_URL}/bootstrap-static`);

/**
 * Fetch a specific user's (team manager’s) information.
 * Includes their name, team name, region, favourite team, etc.
 *
 * @param entryId - the manager’s team ID
 */
export const getEntry = (entryId: number) =>
  safeGet(`${BASE_PROXY_URL}/entry/${entryId}`);

/**
 * Fetch historical and current performance data for a user.
 * Contains total points, ranks, and transfers per gameweek.
 *
 * @param entryId - the manager’s team ID
 */
export const getEntryHistory = (entryId: number) =>
  safeGet(`${BASE_PROXY_URL}/entry/${entryId}/history`);

/**
 * Fetch the user's picks (players selected) for a given gameweek.
 *
 * @param entryId - the manager’s team ID
 * @param event - the gameweek number
 */
export const getUserPicks = (entryId: number, event: number) =>
  safeGet(`${BASE_PROXY_URL}/entry/${entryId}/event/${event}/picks`);

/**
 * Fetch real-time live data for a specific gameweek:
 * includes player performance and bonus points.
 *
 * @param event - the gameweek number
 */
export const getLiveGWData = (event: number) =>
  safeGet(`${BASE_PROXY_URL}/event/${event}/live`);

/**
 * Fetch standings for a classic league.
 *
 * @param leagueId - FPL classic league ID
 */
export const getLeagueStandings = (leagueId: number) =>
  safeGet(`${BASE_PROXY_URL}/leagues-classic/${leagueId}/standings`);

/**
 * Fetch data for head-to-head league standings.
 *
 * @param leagueId - H2H league ID
 */
export const getH2HLeagueStandings = (leagueId: number) =>
  safeGet(`${BASE_PROXY_URL}/leagues-h2h/${leagueId}/standings`);

/**
 * Fetch a list of fixtures for a given gameweek or season.
 */
export const getFixtures = () => safeGet(`${BASE_PROXY_URL}/fixtures`);

/**
 * Fetch all teams and their metadata (names, codes, short names, etc.)
 */
export const getTeams = () => safeGet(`${BASE_PROXY_URL}/teams`);

/**
 * Fetch detailed player (element) data by ID.
 *
 * @param elementId - Player’s unique ID in FPL
 */
export const getPlayerSummary = (elementId: number) =>
  safeGet(`${BASE_PROXY_URL}/element-summary/${elementId}`);
