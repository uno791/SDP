// types.tsx
export type TeamSide = "home" | "away" | "neutral";

export type CommentaryKind =
  | "goal"
  | "penGoal"
  | "ownGoal"
  | "chance"
  | "save"
  | "blocked"  
  | "card"
  | "subst"
  | "corner"
  | "offside"
  | "foul"
  | "handball"   // ⬅️ add this
  | "var"
  | "kickoff"
  | "ht"
  | "ft"
  | "period"
  | "other";

/** Base shape your data adapter should emit for each commentary row */
export interface CommentaryEvent {
  sequence?: number;       // ⬅️ add this (UI reads and sorts by it)
  minute?: number;         // e.g. 74 or 92 (for 90+2)
  minuteText?: string;     // optional formatted "90+2’"
  kind: CommentaryKind;
  side?: TeamSide;         // home/away/neutral for accent
  text: string;            // main line
  detail?: string;         // optional subline
}
