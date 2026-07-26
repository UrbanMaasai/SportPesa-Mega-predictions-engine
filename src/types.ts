/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Odds {
  "1": number;
  "X": number;
  "2": number;
}

export interface Match {
  id: number;
  match_no: string;
  kickoff: string;
  home: string;
  away: string;
  odds: Odds;
  league?: string;
  homeForm?: string; // e.g. "W-D-L-W-W"
  awayForm?: string; // e.g. "L-W-D-D-L"
  homeRank?: number;
  awayRank?: number;
  h2hText?: string;
  predictionStats?: {
    "1": number; // percentage probability
    "X": number;
    "2": number;
  };
}

export interface Coupon {
  id: string;
  name: string;
  selections: Record<string, string[]>; // match_no -> Array of selected outcomes ('1', 'X', '2')
  totalCombinations: number;
  cost: number;
  createdAt: string;
  isSimulated: boolean;
  simulatedResults?: Record<string, {
    homeScore: number;
    awayScore: number;
    result: "1" | "X" | "2";
    isCorrect: boolean;
  }>;
  correctCount?: number;
  bonusWon?: string; // "None" | "12/17 Bonus" | "13/17 Bonus" | "14/17 Bonus" | "15/17 Bonus" | "16/17 Bonus" | "Mega Jackpot Grand Prize!"
}

export interface MatchAnalysis {
  matchNo: string;
  tacticalOverview: string;
  confidence: "High" | "Medium" | "Low";
  suggestedPick: string;
  justification: string;
  keyFactors: string[];
  isMocked?: boolean;
  rateLimited?: boolean;
  fallbackEngine?: string;
  reasoningThoughts?: string;
}

export interface StandingRow {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: string[];
}

export interface GoalScorer {
  rank: number;
  name: string;
  team: string;
  goals: number;
  assists: number;
  penaltyGoals: number;
}

export interface LeagueStats {
  leagueName: string;
  standings: StandingRow[];
  topScorers: GoalScorer[];
}

