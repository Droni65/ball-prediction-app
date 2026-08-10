// types/match.ts

export interface Outcome1X2 {
  probability: number;
  odd: number | null;
}

export interface Match1X2 {
  id: string;
  day: string;
  league: string;
  country?: string;
  startTime?: string;
  homeTeam: string;
  awayTeam: string;
  home: Outcome1X2;
  draw: Outcome1X2;
  away: Outcome1X2;
  correctScore: { home: number; away: number } | null;
  matchUrl: string | null;
}