/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StandingRow, GoalScorer, LeagueStats } from "../types";

// Standard teams for popular leagues to populate tables realistically
const LEAGUE_POOL_TEAMS: Record<string, string[]> = {
  "Premier League": [
    "Man City", "Arsenal", "Liverpool", "Aston Villa", "Tottenham", "Chelsea",
    "Newcastle", "Man United", "West Ham", "Brighton", "Bournemouth", "Crystal Palace",
    "Wolves", "Everton", "Brentford", "Nottingham Forest", "Luton", "Burnley", "Sheffield Utd", "Southampton"
  ],
  "Championship": [
    "Leicester", "Ipswich", "Leeds", "Southampton", "West Brom", "Norwich",
    "Hull", "Middlesbrough", "Coventry", "Preston", "Bristol City", "Cardiff",
    "Sunderland", "Swansea", "Watford", "Millwall", "Blackburn", "Plymouth",
    "Sheffield Wed", "Birmingham", "Huddersfield", "Rotherham", "Luton", "Derby"
  ],
  "Serie A": [
    "Inter", "Milan", "Juventus", "Bologna", "Roma", "Lazio",
    "Fiorentina", "Napoli", "Torino", "Genoa", "Monza", "Lecce",
    "Empoli", "Udinese", "Frosinone", "Sassuolo", "Salernitana", "Hellas Verona", "Cagliari", "Atalanta"
  ],
  "La Liga": [
    "Real Madrid", "Barcelona", "Girona", "Atletico Madrid", "Athletic Club", "Real Sociedad",
    "Real Betis", "Valencia", "Villarreal", "Getafe", "Osasuna", "Alaves",
    "Sevilla", "Las Palmas", "Rayo Vallecano", "Celta Vigo", "Mallorca", "Cadiz", "Granada", "Almeria", "Valladolid"
  ],
  "Bundesliga": [
    "Leverkusen", "Bayern Munich", "VfB Stuttgart", "Dortmund", "RB Leipzig", "Frankfurt",
    "Hoffenheim", "Freiburg", "Heidenheim", "Werder Bremen", "Augsburg", "Monchengladbach",
    "Bochum", "Union Berlin", "Mainz 05", "FC Koln", "Darmstadt", "Wolfsburg"
  ],
  "Ligue 1": [
    "PSG", "Monaco", "Brest", "Lille", "Nice", "Lens",
    "Marseille", "Reims", "Rennes", "Toulouse", "Lyon", "Montpellier",
    "Strasbourg", "Le Havre", "Nantes", "Metz", "Lorient", "Clermont"
  ]
};

// Top scorers database by league preset
const SCORER_PRESETS: Record<string, { name: string; team: string; goals: number; assists: number; penalties: number }[]> = {
  "Premier League": [
    { name: "Erling Haaland", team: "Man City", goals: 27, assists: 5, penalties: 7 },
    { name: "Cole Palmer", team: "Chelsea", goals: 22, assists: 11, penalties: 9 },
    { name: "Alexander Isak", team: "Newcastle", goals: 21, assists: 2, penalties: 5 },
    { name: "Ollie Watkins", team: "Aston Villa", goals: 19, assists: 13, penalties: 0 },
    { name: "Dominic Solanke", team: "Bournemouth", goals: 19, assists: 3, penalties: 2 },
    { name: "Mohamed Salah", team: "Liverpool", goals: 18, assists: 10, penalties: 5 }
  ],
  "Championship": [
    { name: "Sammie Szmodics", team: "Blackburn", goals: 27, assists: 4, penalties: 2 },
    { name: "Adam Armstrong", team: "Southampton", goals: 21, assists: 13, penalties: 3 },
    { name: "Crysencio Summerville", team: "Leeds", goals: 20, assists: 9, penalties: 4 },
    { name: "Morgan Whittaker", team: "Plymouth", goals: 19, assists: 8, penalties: 0 },
    { name: "Jamie Vardy", team: "Leicester", goals: 18, assists: 2, penalties: 3 }
  ],
  "Serie A": [
    { name: "Lautaro Martínez", team: "Inter", goals: 24, assists: 3, penalties: 2 },
    { name: "Dušan Vlahović", team: "Juventus", goals: 16, assists: 4, penalties: 3 },
    { name: "Victor Osimhen", team: "Napoli", goals: 15, assists: 3, penalties: 3 },
    { name: "Olivier Giroud", team: "Milan", goals: 15, assists: 8, penalties: 4 },
    { name: "Albert Guðmundsson", team: "Genoa", goals: 14, assists: 4, penalties: 4 }
  ],
  "La Liga": [
    { name: "Artem Dovbyk", team: "Girona", goals: 24, assists: 8, penalties: 7 },
    { name: "Alexander Sørloth", team: "Villarreal", goals: 23, assists: 6, penalties: 0 },
    { name: "Jude Bellingham", team: "Real Madrid", goals: 19, assists: 6, penalties: 1 },
    { name: "Robert Lewandowski", team: "Barcelona", goals: 19, assists: 8, penalties: 4 },
    { name: "Ante Budimir", team: "Osasuna", goals: 17, assists: 2, penalties: 3 }
  ]
};

// Standard fallback players for generic/simulated top scorers
const FAUX_FIRST_NAMES = ["Marcus", "Lucas", "David", "Christian", "Rodrigo", "Gabriel", "Mateo", "Alex", "Pierre", "Samuel", "Tomas", "Stefan"];
const FAUX_LAST_NAMES = ["Silva", "Petersen", "Santos", "Larsen", "Gomez", "Dubois", "Gruber", "Ivanov", "Olsen", "Muller", "Bauer", "Kovacs"];

export function getLeagueStats(
  leagueName: string,
  homeTeam: string,
  awayTeam: string,
  homeRankSetting?: number,
  awayRankSetting?: number,
  homeFormSetting?: string,
  awayFormSetting?: string
): LeagueStats {
  const normLeague = leagueName || "Unknown League";
  
  // 1. Determine league size (generally 20 or 18 teams)
  const isBundesligaOrLigue1 = normLeague.includes("Bundesliga") || normLeague.includes("Ligue 1");
  const leagueSize = isBundesligaOrLigue1 ? 18 : 20;

  // 2. Fetch or construct a list of pool teams
  let poolTeams = [...(LEAGUE_POOL_TEAMS[normLeague] || [])];
  
  // Ensure the list is adequate in size
  if (poolTeams.length < leagueSize) {
    // Generate simple generic names if subset is empty or small
    const localPoolScores = ["FC United", "City Rovers", "Town Athletic", "Sporting Club", "Real Union", "Dynamo FC", "Kickers", "Hotspur FC"];
    const generated = Array.from({ length: leagueSize }, (_, i) => poolTeams[i] || `${localPoolScores[i % localPoolScores.length]} ${10 + i}`);
    poolTeams = generated;
  }

  // Slice pool teams to our desired size
  poolTeams = poolTeams.slice(0, leagueSize);

  // 3. Setup and enforce the home and away team ranks
  const homeRank = Math.min(Math.max(homeRankSetting || 8, 1), leagueSize);
  const awayRank = Math.min(Math.max(awayRankSetting || 12, 1), leagueSize);

  // Strip homeTeam and awayTeam from other positions of the pool to avoid duplicate names
  poolTeams = poolTeams.filter(t => t.toLowerCase() !== homeTeam.toLowerCase() && t.toLowerCase() !== awayTeam.toLowerCase());

  // Insert our designated home and away teams precisely at their respective rank indexes
  const finalTeams: string[] = [];
  let tempPoolIdx = 0;
  for (let pos = 1; pos <= leagueSize; pos++) {
    if (pos === homeRank) {
      finalTeams.push(homeTeam);
    } else if (pos === awayRank) {
      finalTeams.push(awayTeam);
    } else {
      if (tempPoolIdx < poolTeams.length) {
        finalTeams.push(poolTeams[tempPoolIdx]);
        tempPoolIdx++;
      } else {
        finalTeams.push(`Club ${pos}`);
      }
    }
  }

  // 4. Generate standings row records procedurally with realistic points
  const standings: StandingRow[] = finalTeams.map((team, index) => {
    const position = index + 1;
    const played = 32; // representative late-season state
    
    // Calculate statistics aligned with rank positions
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    // Distribute points curving down as rank decreases
    const rankPct = (leagueSize - position) / (leagueSize - 1); // 1.0 down to 0.0
    const pointsEstimation = Math.round(15 + rankPct * 65); // Curve from 80pts down to 15pts
    
    // Extract win/draw/loss distribution from estimated points
    won = Math.min(Math.floor(pointsEstimation / 3), played);
    const ptsLeft = pointsEstimation - won * 3;
    drawn = Math.min(ptsLeft, played - won);
    lost = Math.max(0, played - won - drawn);

    // Re-verify points
    const points = won * 3 + drawn;

    // Goals calculation
    goalsFor = Math.round(25 + rankPct * 45 + Math.random() * 8);
    goalsAgainst = Math.round(70 - rankPct * 45 + Math.random() * 8);

    // Setup Form tracker
    let form: string[] = ["D", "D", "W", "L", "W"];
    if (team === homeTeam && homeFormSetting) {
      form = homeFormSetting.split("-").filter(Boolean);
    } else if (team === awayTeam && awayFormSetting) {
      form = awayFormSetting.split("-").filter(Boolean);
    } else {
      // Procedural form matching tier
      if (position <= 5) {
        form = ["W", "W", "D", "W", "L"];
      } else if (position >= leagueSize - 4) {
        form = ["L", "L", "D", "L", "W"];
      } else {
        const outcomes = ["W", "D", "L"];
        form = Array.from({ length: 5 }, () => outcomes[Math.floor(Math.random() * outcomes.length)]);
      }
    }

    return {
      position,
      team,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      points,
      form: form.slice(0, 5)
    };
  });

  // 5. Setup top scorers list
  let topScorers: GoalScorer[] = [];
  const presetList = SCORER_PRESETS[normLeague];

  if (presetList && presetList.length > 0) {
    topScorers = presetList.map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      team: p.team,
      goals: p.goals,
      assists: p.assists,
      penaltyGoals: p.penalties
    }));
  } else {
    // Generate high quality procedural scorers from the active pool teams
    const candidates = finalTeams.slice(0, 8); // Top scorers typically belong to best 8 teams
    const baseGoals = [19, 17, 15, 14, 13, 11];
    
    topScorers = baseGoals.map((goalsVal, idx) => {
      const idxTeam = candidates[idx % candidates.length] || homeTeam;
      // Synthesize elegant names
      const first = FAUX_FIRST_NAMES[(idx + idxTeam.length) % FAUX_FIRST_NAMES.length];
      const last = FAUX_LAST_NAMES[(idx * 3 + idxTeam.length) % FAUX_LAST_NAMES.length];
      
      const goals = goalsVal + (idx === 0 ? Math.floor(Math.random() * 4) : 0);
      const assists = Math.round(2 + Math.random() * 6);
      const penaltyGoals = Math.round(Math.random() * 3);

      return {
        rank: idx + 1,
        name: `${first} ${last}`,
        team: idxTeam,
        goals,
        assists,
        penaltyGoals
      };
    });
  }

  // Ensure that if a scorer from the home or away team should ideally be represented, they are visible!
  const hasHomeScorer = topScorers.some(s => s.team.toLowerCase() === homeTeam.toLowerCase());
  if (!hasHomeScorer && topScorers.length > 0) {
    // Insert a home player at position 3 or 4
    const first = FAUX_FIRST_NAMES[(homeTeam.length) % FAUX_FIRST_NAMES.length];
    const last = FAUX_LAST_NAMES[(homeTeam.length + 5) % FAUX_LAST_NAMES.length];
    topScorers[2] = {
      rank: 3,
      name: `${first} ${last}`,
      team: homeTeam,
      goals: Math.floor(12 + Math.random() * 4),
      assists: Math.floor(1 + Math.random() * 4),
      penaltyGoals: Math.floor(Math.random() * 2)
    };
  }

  // Recalculate scorer rank tags
  topScorers.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return {
    leagueName: normLeague,
    standings,
    topScorers
  };
}
