import type { LeagueId } from "../../api/espn";

export const DEFAULT_LEAGUE: LeagueId = "eng1";

export const LEAGUE_OPTIONS: Array<{ id: LeagueId; label: string }> = [
  { id: "eng1", label: "Premier League" },
  { id: "esp1", label: "LaLiga" },
  { id: "ita1", label: "Serie A" },
  { id: "ger1", label: "Bundesliga" },
  { id: "fra1", label: "Ligue 1" },
  { id: "ucl", label: "UEFA Champions League" },
  { id: "uel", label: "UEFA Europa League" },
  { id: "uecl", label: "UEFA Europa Conference League" },
];

export const isLeagueId = (
  value: string | null | undefined
): value is LeagueId =>
  value != null && LEAGUE_OPTIONS.some((option) => option.id === value);
