/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BacktestMatch {
  match_no: string;
  home: string;
  away: string;
  league: string;
  odds: { "1": number; "X": number; "2": number };
  actual: "1" | "X" | "2";
  ai_predictions: {
    conservative: "1" | "X" | "2";
    balanced: "1" | "X" | "2";
    bold: "1" | "X" | "2";
  };
}

export interface BacktestJackpot {
  id: string;
  date: string;
  grandPrize: string;
  payoutStatus: string;
  bonus_16: string;
  bonus_15: string;
  bonus_14: string;
  bonus_13: string;
  bonus_12: string;
  matches: BacktestMatch[];
}

export const HISTORICAL_BACKTEST_POOLS: BacktestJackpot[] = [
  {
    id: "MJP-WK-20",
    date: "May 23, 2026",
    grandPrize: "Ksh 351,452,190",
    payoutStatus: "Bonus Only (No 17/17 Winner)",
    bonus_16: "Ksh 2,120,440",
    bonus_15: "Ksh 340,500",
    bonus_14: "Ksh 41,200",
    bonus_13: "Ksh 3,110",
    bonus_12: "Ksh 640",
    matches: [
      {
        match_no: "1",
        home: "Liverpool FC",
        away: "Real Madrid CF",
        league: "UEFA Champions League Elite",
        odds: { "1": 2.10, "X": 3.40, "2": 3.10 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "X" }
      },
      {
        match_no: "2",
        home: "Valencia CF",
        away: "Real Sociedad",
        league: "Spain Primera Division",
        odds: { "1": 2.85, "X": 3.00, "2": 2.65 },
        actual: "X",
        ai_predictions: { conservative: "2", balanced: "X", bold: "X" }
      },
      {
        match_no: "3",
        home: "AFC Bournemouth",
        away: "Everton FC",
        league: "Premier League Classics",
        odds: { "1": 2.15, "X": 3.35, "2": 3.20 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "4",
        home: "FC Porto",
        away: "Sporting CP",
        league: "Portugal Primeira Liga",
        odds: { "1": 2.45, "X": 3.10, "2": 2.80 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "X", bold: "X" }
      },
      {
        match_no: "5",
        home: "Fiorentina",
        away: "AS Roma",
        league: "Italy Serie A Classic",
        odds: { "1": 2.60, "X": 3.25, "2": 2.70 },
        actual: "2",
        ai_predictions: { conservative: "1", balanced: "2", bold: "2" }
      },
      {
        match_no: "6",
        home: "Olympique Marseille",
        away: "RC Lens",
        league: "France Ligue 1",
        odds: { "1": 2.22, "X": 3.40, "2": 3.05 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "2" }
      },
      {
        match_no: "7",
        home: "Real Betis",
        away: "Athletic Bilbao",
        league: "Spain Primera Division",
        odds: { "1": 2.70, "X": 3.20, "2": 2.60 },
        actual: "X",
        ai_predictions: { conservative: "2", balanced: "X", bold: "1" }
      },
      {
        match_no: "8",
        home: "Werder Bremen",
        away: "SC Freiburg",
        league: "Germany Bundesliga",
        odds: { "1": 2.45, "X": 3.40, "2": 2.75 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "X" }
      },
      {
        match_no: "9",
        home: "AZ Alkmaar",
        away: "FC Utrecht",
        league: "Netherlands Eredivisie",
        odds: { "1": 1.95, "X": 3.60, "2": 3.65 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "10",
        home: "Genoa CFC",
        away: "Torino FC",
        league: "Italy Serie A",
        odds: { "1": 2.80, "X": 2.90, "2": 2.85 },
        actual: "X",
        ai_predictions: { conservative: "X", balanced: "X", bold: "2" }
      },
      {
        match_no: "11",
        home: "KV Mechelen",
        away: "KAA Gent",
        league: "Belgium First Division",
        odds: { "1": 3.10, "X": 3.50, "2": 2.15 },
        actual: "2",
        ai_predictions: { conservative: "2", balanced: "2", bold: "2" }
      },
      {
        match_no: "12",
        home: "Hearts FC",
        away: "Hibernian FC",
        league: "Scotland Premiership",
        odds: { "1": 2.10, "X": 3.35, "2": 3.40 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "X" }
      },
      {
        match_no: "13",
        home: "Las Palmas",
        away: "Getafe CF",
        league: "Spain Primera Division",
        odds: { "1": 2.50, "X": 3.05, "2": 3.05 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "X" }
      },
      {
        match_no: "14",
        home: "Fortuna Dusseldorf",
        away: "Hansa Rostock",
        league: "Germany Bundesliga 2",
        odds: { "1": 1.85, "X": 3.60, "2": 4.10 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "15",
        home: "Roda JC",
        away: "MVV Maastricht",
        league: "Netherlands Eerste Divisie",
        odds: { "1": 1.70, "X": 3.90, "2": 4.50 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "16",
        home: "Pisa SC",
        away: "Palermo FC",
        league: "Italy Serie B",
        odds: { "1": 2.40, "X": 3.10, "2": 3.00 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "X", bold: "X" }
      },
      {
        match_no: "17",
        home: "St. Etienne",
        away: "Metz FC",
        league: "France Promotion Playoff",
        odds: { "1": 2.20, "X": 3.15, "2": 3.40 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "2" }
      }
    ]
  },
  {
    id: "MJP-WK-19",
    date: "May 16, 2026",
    grandPrize: "Ksh 348,110,880",
    payoutStatus: "1 Winner (17/17 Wins!)",
    bonus_16: "Ksh 1,810,250",
    bonus_15: "Ksh 203,100",
    bonus_14: "Ksh 18,900",
    bonus_13: "Ksh 2,050",
    bonus_12: "Ksh 480",
    matches: [
      {
        match_no: "1",
        home: "Chelsea FC",
        away: "Manchester United",
        league: "FA Cup Final Classic",
        odds: { "1": 2.20, "X": 3.50, "2": 2.95 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "2",
        home: "Crystal Palace",
        away: "Aston Villa",
        league: "Premier League Classic",
        odds: { "1": 2.50, "X": 3.45, "2": 2.60 },
        actual: "2",
        ai_predictions: { conservative: "1", balanced: "2", bold: "2" }
      },
      {
        match_no: "3",
        home: "Bologna FC",
        away: "Juventus Torino",
        league: "Italy Serie A",
        odds: { "1": 2.85, "X": 3.10, "2": 2.60 },
        actual: "X",
        ai_predictions: { conservative: "2", balanced: "X", bold: "X" }
      },
      {
        match_no: "4",
        home: "Sassuolo Calcio",
        away: "AC Monza",
        league: "Italy Serie A",
        odds: { "1": 2.15, "X": 3.40, "2": 3.30 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "5",
        home: "Montpellier HSC",
        away: "Toulouse FC",
        league: "France Ligue 1",
        odds: { "1": 2.30, "X": 3.50, "2": 2.90 },
        actual: "2",
        ai_predictions: { conservative: "1", balanced: "1", bold: "2" }
      },
      {
        match_no: "6",
        home: "Cadiz CF",
        away: "UD Almeria",
        league: "Spain Primera Division",
        odds: { "1": 1.75, "X": 3.80, "2": 4.50 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "7",
        home: "Stade Reims",
        away: "Stade Rennais",
        league: "France Ligue 1",
        odds: { "1": 2.65, "X": 3.35, "2": 2.55 },
        actual: "X",
        ai_predictions: { conservative: "2", balanced: "X", bold: "X" }
      },
      {
        match_no: "8",
        home: "Villarreal CF",
        away: "Real Madrid",
        league: "Spain Primera Division",
        odds: { "1": 3.20, "X": 3.65, "2": 2.10 },
        actual: "2",
        ai_predictions: { conservative: "2", balanced: "2", bold: "2" }
      },
      {
        match_no: "9",
        home: "Platense",
        away: "Belgrano De Cordoba",
        league: "Argentina Primera Division",
        odds: { "1": 2.40, "X": 2.90, "2": 3.30 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "X" }
      },
      {
        match_no: "10",
        home: "Fenerbahce SK",
        away: "Galatasaray SK",
        league: "Turkey Super Lig",
        odds: { "1": 2.35, "X": 3.40, "2": 2.80 },
        actual: "2",
        ai_predictions: { conservative: "1", balanced: "1", bold: "2" }
      },
      {
        match_no: "11",
        home: "Tigre",
        away: "Rosario Central",
        league: "Argentina Primera Division",
        odds: { "1": 2.65, "X": 3.00, "2": 2.80 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "X", bold: "X" }
      },
      {
        match_no: "12",
        home: "Deportes Copiapo",
        away: "Cobreloa",
        league: "Chile Primera Division",
        odds: { "1": 2.10, "X": 3.35, "2": 3.40 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "X" }
      },
      {
        match_no: "13",
        home: "Lech Poznan",
        away: "Legia Warszawa",
        league: "Poland Ekstraklasa",
        odds: { "1": 2.45, "X": 3.20, "2": 2.85 },
        actual: "2",
        ai_predictions: { conservative: "1", balanced: "2", bold: "2" }
      },
      {
        match_no: "14",
        home: "SK Brann",
        away: "Sandefjord",
        league: "Norway Eliteserien",
        odds: { "1": 1.45, "X": 4.50, "2": 6.80 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "15",
        home: "Hamarkameratene",
        away: "Bodo/Glimt",
        league: "Norway Eliteserien",
        odds: { "1": 4.80, "X": 4.00, "2": 1.60 },
        actual: "2",
        ai_predictions: { conservative: "2", balanced: "2", bold: "2" }
      },
      {
        match_no: "16",
        home: "Tenerife CD",
        away: "SD Amorebieta",
        league: "Spain Segunda Division",
        odds: { "1": 1.90, "X": 3.20, "2": 4.40 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "17",
        home: "Vila Nova FC GO",
        away: "Guarani FC SP",
        league: "Brazil Serie B",
        odds: { "1": 2.15, "X": 2.95, "2": 3.75 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "X" }
      }
    ]
  },
  {
    id: "MJP-WK-18",
    date: "May 09, 2026",
    grandPrize: "Ksh 342,750,050",
    payoutStatus: "Bonus Only (No 17/17 Winner)",
    bonus_16: "Ksh 3,240,500",
    bonus_15: "Ksh 480,900",
    bonus_14: "Ksh 44,500",
    bonus_13: "Ksh 4,800",
    bonus_12: "Ksh 1,020",
    matches: [
      {
        match_no: "1",
        home: "Everton FC",
        away: "Sheffield United",
        league: "Premier League Classics",
        odds: { "1": 1.45, "X": 4.60, "2": 6.50 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "2",
        home: "West Ham United",
        away: "Luton Town",
        league: "Premier League Classic",
        odds: { "1": 1.80, "X": 4.00, "2": 3.85 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "3",
        home: "Wolverhampton",
        away: "Crystal Palace",
        league: "Premier League Classic",
        odds: { "1": 2.55, "X": 3.40, "2": 2.65 },
        actual: "2",
        ai_predictions: { conservative: "1", balanced: "2", bold: "2" }
      },
      {
        match_no: "4",
        home: "Villarreal CF",
        away: "Sevilla FC",
        league: "Spain Primera Division",
        odds: { "1": 2.10, "X": 3.50, "2": 3.30 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "5",
        home: "Granada CF",
        away: "Real Madrid",
        league: "Spain Primera Division",
        odds: { "1": 5.50, "X": 4.20, "2": 1.55 },
        actual: "2",
        ai_predictions: { conservative: "2", balanced: "2", bold: "2" }
      },
      {
        match_no: "6",
        home: "Strasbourg",
        away: "FC Metz",
        league: "France Ligue 1",
        odds: { "1": 2.15, "X": 3.40, "2": 3.30 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "7",
        home: "Rennes FC",
        away: "RC Lens",
        league: "France Ligue 1",
        odds: { "1": 2.50, "X": 3.45, "2": 2.70 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "X", bold: "X" }
      },
      {
        match_no: "8",
        home: "Mainz 05",
        away: "Borussia Dortmund",
        league: "Germany Bundesliga",
        odds: { "1": 2.30, "X": 3.80, "2": 2.75 },
        actual: "1",
        ai_predictions: { conservative: "2", balanced: "1", bold: "1" }
      },
      {
        match_no: "9",
        home: "FC Koln",
        away: "Union Berlin",
        league: "Germany Bundesliga",
        odds: { "1": 2.60, "X": 3.30, "2": 2.70 },
        actual: "1",
        ai_predictions: { conservative: "X", balanced: "1", bold: "X" }
      },
      {
        match_no: "10",
        home: "SC Freiburg",
        away: "Heidenheim",
        league: "Germany Bundesliga",
        odds: { "1": 1.75, "X": 3.90, "2": 4.40 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "1", bold: "X" }
      },
      {
        match_no: "11",
        home: "Genoa CFC",
        away: "Sassuolo Calcio",
        league: "Italy Serie A",
        odds: { "1": 2.22, "X": 3.35, "2": 3.25 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "12",
        home: "Hellas Verona",
        away: "Torino FC",
        league: "Italy Serie A",
        odds: { "1": 3.00, "X": 3.10, "2": 2.50 },
        actual: "2",
        ai_predictions: { conservative: "2", balanced: "2", bold: "X" }
      },
      {
        match_no: "13",
        home: "Juventus FC",
        away: "Salernitana",
        league: "Italy Serie A",
        odds: { "1": 1.15, "X": 7.50, "2": 17.00 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "14",
        home: "Lazio Roma",
        away: "Empoli FC",
        league: "Italy Serie A",
        odds: { "1": 1.60, "X": 3.95, "2": 5.75 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "15",
        home: "Atletico Madrid",
        away: "Celta Vigo",
        league: "Spain Primera Division",
        odds: { "1": 1.40, "X": 4.75, "2": 7.50 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "16",
        home: "Valencia CF",
        away: "Rayo Vallecano",
        league: "Spain Primera Division",
        odds: { "1": 2.25, "X": 3.05, "2": 3.55 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "X", bold: "X" }
      },
      {
        match_no: "17",
        home: "Real Betis",
        away: "UD Almeria",
        league: "Spain Primera Division",
        odds: { "1": 1.35, "X": 5.25, "2": 8.00 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      }
    ]
  },
  {
    id: "MJP-WK-17",
    date: "May 02, 2026",
    grandPrize: "Ksh 336,920,440",
    payoutStatus: "Bonus Only (No 17/17 Winner)",
    bonus_16: "Ksh 2,950,200",
    bonus_15: "Ksh 380,400",
    bonus_14: "Ksh 32,800",
    bonus_13: "Ksh 3,450",
    bonus_12: "Ksh 830",
    matches: [
      {
        match_no: "1",
        home: "Arsenal FC",
        away: "Bournemouth",
        league: "Premier League Classic",
        odds: { "1": 1.25, "X": 6.00, "2": 11.00 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "2",
        home: "Brentford FC",
        away: "Fulham FC",
        league: "Premier League Classic",
        odds: { "1": 2.15, "X": 3.60, "2": 3.25 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "X", bold: "X" }
      },
      {
        match_no: "3",
        home: "Burnley FC",
        away: "Newcastle Utd",
        league: "Premier League Classic",
        odds: { "1": 3.40, "X": 4.10, "2": 1.95 },
        actual: "2",
        ai_predictions: { conservative: "2", balanced: "2", bold: "1" }
      },
      {
        match_no: "4",
        home: "Sheffield Utd",
        away: "Nottingham Forest",
        league: "Premier League Classic",
        odds: { "1": 3.10, "X": 3.60, "2": 2.20 },
        actual: "2",
        ai_predictions: { conservative: "2", balanced: "2", bold: "X" }
      },
      {
        match_no: "5",
        home: "Manchester City",
        away: "Wolverhampton",
        league: "Premier League Classic",
        odds: { "1": 1.12, "X": 9.50, "2": 21.00 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "6",
        home: "FC Koln",
        away: "SC Freiburg",
        league: "Germany Bundesliga",
        odds: { "1": 2.40, "X": 3.50, "2": 2.80 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "X", bold: "1" }
      },
      {
        match_no: "7",
        home: "Dortmund",
        away: "Augsburg",
        league: "Germany Bundesliga",
        odds: { "1": 1.50, "X": 4.80, "2": 5.50 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "8",
        home: "VfB Stuttgart",
        away: "Bayern Munich",
        league: "Germany Bundesliga",
        odds: { "1": 2.30, "X": 3.90, "2": 2.70 },
        actual: "1",
        ai_predictions: { conservative: "2", balanced: "1", bold: "1" }
      },
      {
        match_no: "9",
        home: "Werder Bremen",
        away: "Monchengladbach",
        league: "Germany Bundesliga",
        odds: { "1": 2.25, "X": 3.65, "2": 3.00 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "X", bold: "X" }
      },
      {
        match_no: "10",
        home: "Monza",
        away: "Lazio Roma",
        league: "Italy Serie A",
        odds: { "1": 3.50, "X": 3.30, "2": 2.15 },
        actual: "X",
        ai_predictions: { conservative: "2", balanced: "2", bold: "X" }
      },
      {
        match_no: "11",
        home: "Sassuolo Calcio",
        away: "Inter Milan",
        league: "Italy Serie A",
        odds: { "1": 5.50, "X": 4.50, "2": 1.50 },
        actual: "1",
        ai_predictions: { conservative: "2", balanced: "2", bold: "1" }
      },
      {
        match_no: "12",
        home: "Real Sociedad",
        away: "Las Palmas",
        league: "Spain Primera Division",
        odds: { "1": 1.40, "X": 4.50, "2": 9.00 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "13",
        home: "Real Madrid",
        away: "Cadiz CF",
        league: "Spain Primera Division",
        odds: { "1": 1.30, "X": 5.50, "2": 10.00 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "14",
        home: "Girona FC",
        away: "FC Barcelona",
        league: "Spain Primera Division",
        odds: { "1": 2.80, "X": 3.75, "2": 2.30 },
        actual: "1",
        ai_predictions: { conservative: "2", balanced: "1", bold: "1" }
      },
      {
        match_no: "15",
        home: "Mallorca",
        away: "Atletico Madrid",
        league: "Spain Primera Division",
        odds: { "1": 3.75, "X": 3.25, "2": 2.10 },
        actual: "2",
        ai_predictions: { conservative: "2", balanced: "2", bold: "2" }
      },
      {
        match_no: "16",
        home: "Le Havre AC",
        away: "RC Strasbourg",
        league: "France Ligue 1",
        odds: { "1": 2.45, "X": 3.20, "2": 3.00 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "X" }
      },
      {
        match_no: "17",
        home: "Monaco",
        away: "Clermont Foot",
        league: "France Ligue 1",
        odds: { "1": 1.30, "X": 5.75, "2": 9.50 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      }
    ]
  },
  {
    id: "MJP-WK-16",
    date: "April 25, 2026",
    grandPrize: "Ksh 331,104,200",
    payoutStatus: "Bonus Only (No 17/17 Winner)",
    bonus_16: "Ksh 2,640,000",
    bonus_15: "Ksh 295,110",
    bonus_14: "Ksh 29,100",
    bonus_13: "Ksh 2,800",
    bonus_12: "Ksh 550",
    matches: [
      {
        match_no: "1",
        home: "West Ham United",
        away: "Liverpool FC",
        league: "Premier League Classic",
        odds: { "1": 5.25, "X": 4.50, "2": 1.55 },
        actual: "X",
        ai_predictions: { conservative: "2", balanced: "2", bold: "X" }
      },
      {
        match_no: "2",
        home: "Fulham FC",
        away: "Crystal Palace",
        league: "Premier League Classic",
        odds: { "1": 2.05, "X": 3.60, "2": 3.45 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "X", bold: "X" }
      },
      {
        match_no: "3",
        home: "Manchester Utd",
        away: "Burnley FC",
        league: "Premier League Classic",
        odds: { "1": 1.50, "X": 4.75, "2": 5.75 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "1", bold: "X" }
      },
      {
        match_no: "4",
        home: "Newcastle Utd",
        away: "Sheffield Utd",
        league: "Premier League Classic",
        odds: { "1": 1.25, "X": 6.50, "2": 10.00 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "5",
        home: "Wolverhampton",
        away: "Luton Town",
        league: "Premier League Classic",
        odds: { "1": 2.00, "X": 3.75, "2": 3.50 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "6",
        home: "Everton FC",
        away: "Brentford FC",
        league: "Premier League Classic",
        odds: { "1": 2.45, "X": 3.50, "2": 2.80 },
        actual: "1",
        ai_predictions: { conservative: "X", balanced: "1", bold: "1" }
      },
      {
        match_no: "7",
        home: "Aston Villa",
        away: "Chelsea FC",
        league: "Premier League Classic",
        odds: { "1": 2.20, "X": 3.75, "2": 3.00 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "X", bold: "1" }
      },
      {
        match_no: "8",
        home: "Bayern Munich",
        away: "Frankfurt",
        league: "Germany Bundesliga",
        odds: { "1": 1.40, "X": 5.25, "2": 6.50 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "9",
        home: "RB Leipzig",
        away: "Dortmund",
        league: "Germany Bundesliga",
        odds: { "1": 1.70, "X": 4.20, "2": 4.40 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "10",
        home: "Freiburg",
        away: "Wolfsburg",
        league: "Germany Bundesliga",
        odds: { "1": 2.25, "X": 3.50, "2": 3.10 },
        actual: "2",
        ai_predictions: { conservative: "1", balanced: "1", bold: "2" }
      },
      {
        match_no: "11",
        home: "Leverkusen",
        away: "VfB Stuttgart",
        league: "Germany Bundesliga",
        odds: { "1": 1.70, "X": 4.10, "2": 4.50 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "X", bold: "X" }
      },
      {
        match_no: "12",
        home: "Juventus",
        away: "AC Milan",
        league: "Italy Serie A",
        odds: { "1": 2.05, "X": 3.40, "2": 3.75 },
        actual: "X",
        ai_predictions: { conservative: "X", balanced: "X", bold: "2" }
      },
      {
        match_no: "13",
        home: "Lazio Roma",
        away: "Verona",
        league: "Italy Serie A",
        odds: { "1": 1.65, "X": 3.80, "2": 5.50 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "14",
        home: "Almeria",
        away: "Getafe",
        league: "Spain Primera Division",
        odds: { "1": 2.60, "X": 3.25, "2": 2.75 },
        actual: "2",
        ai_predictions: { conservative: "X", balanced: "2", bold: "2" }
      },
      {
        match_no: "15",
        home: "Alaves",
        away: "Celta Vigo",
        league: "Spain Primera Division",
        odds: { "1": 2.60, "X": 3.10, "2": 2.90 },
        actual: "1",
        ai_predictions: { conservative: "X", balanced: "1", bold: "X" }
      },
      {
        match_no: "16",
        home: "Atletico Madrid",
        away: "Athletic Bilbao",
        league: "Spain Primera Division",
        odds: { "1": 1.95, "X": 3.60, "2": 3.80 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "17",
        home: "PSG",
        away: "Le Havre AC",
        league: "France Ligue 1",
        odds: { "1": 1.35, "X": 5.50, "2": 8.00 },
        actual: "X",
        ai_predictions: { conservative: "1", balanced: "1", bold: "X" }
      }
    ]
  },
  {
    id: "MJP-WK-15",
    date: "April 18, 2026",
    grandPrize: "Ksh 325,488,110",
    payoutStatus: "Bonus Only (No 17/17 Winner)",
    bonus_16: "Ksh 2,120,400",
    bonus_15: "Ksh 245,600",
    bonus_14: "Ksh 21,300",
    bonus_13: "Ksh 2,100",
    bonus_12: "Ksh 490",
    matches: [
      {
        match_no: "1",
        home: "Luton Town",
        away: "Brentford FC",
        league: "Premier League Classic",
        odds: { "1": 3.10, "X": 3.75, "2": 2.20 },
        actual: "2",
        ai_predictions: { conservative: "2", balanced: "2", bold: "1" }
      },
      {
        match_no: "2",
        home: "Sheffield Utd",
        away: "Burnley FC",
        league: "Premier League Classic",
        odds: { "1": 2.75, "X": 3.60, "2": 2.45 },
        actual: "2",
        ai_predictions: { conservative: "1", balanced: "1", bold: "2" }
      },
      {
        match_no: "3",
        home: "Wolverhampton",
        away: "Arsenal FC",
        league: "Premier League Classic",
        odds: { "1": 8.00, "X": 5.25, "2": 1.35 },
        actual: "2",
        ai_predictions: { conservative: "2", balanced: "2", bold: "2" }
      },
      {
        match_no: "4",
        home: "Everton FC",
        away: "Nottingham Forest",
        league: "Premier League Classic",
        odds: { "1": 2.05, "X": 3.60, "2": 3.60 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "X" }
      },
      {
        match_no: "5",
        home: "Aston Villa",
        away: "Bournemouth",
        league: "Premier League Classic",
        odds: { "1": 1.85, "X": 4.10, "2": 3.80 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "6",
        home: "Crystal Palace",
        away: "West Ham United",
        league: "Premier League Classic",
        odds: { "1": 2.15, "X": 3.60, "2": 3.25 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "X", bold: "2" }
      },
      {
        match_no: "7",
        home: "Fulham FC",
        away: "Liverpool FC",
        league: "Premier League Classic",
        odds: { "1": 5.50, "X": 4.75, "2": 1.50 },
        actual: "2",
        ai_predictions: { conservative: "2", balanced: "2", bold: "2" }
      },
      {
        match_no: "8",
        home: "FC Heidenheim",
        away: "RB Leipzig",
        league: "Germany Bundesliga",
        odds: { "1": 6.00, "X": 4.80, "2": 1.45 },
        actual: "2",
        ai_predictions: { conservative: "2", balanced: "2", bold: "X" }
      },
      {
        match_no: "9",
        home: "Hoffenheim",
        away: "Monchengladbach",
        league: "Germany Bundesliga",
        odds: { "1": 2.10, "X": 3.90, "2": 3.10 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "X" }
      },
      {
        match_no: "10",
        home: "FC Koln",
        away: "Darmstadt 98",
        league: "Germany Bundesliga",
        odds: { "1": 1.50, "X": 4.50, "2": 6.50 },
        actual: "2",
        ai_predictions: { conservative: "1", balanced: "1", bold: "2" }
      },
      {
        match_no: "11",
        home: "VfL Wolfsburg",
        away: "VfL Bochum",
        league: "Germany Bundesliga",
        odds: { "1": 1.75, "X": 3.80, "2": 4.50 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "12",
        home: "Empoli FC",
        away: "SSC Napoli",
        league: "Italy Serie A",
        odds: { "1": 4.80, "X": 3.90, "2": 1.70 },
        actual: "1",
        ai_predictions: { conservative: "2", balanced: "X", bold: "1" }
      },
      {
        match_no: "13",
        home: "Verona",
        away: "Udinese Calcio",
        league: "Italy Serie A",
        odds: { "1": 2.55, "X": 3.20, "2": 2.90 },
        actual: "1",
        ai_predictions: { conservative: "X", balanced: "X", bold: "1" }
      },
      {
        match_no: "14",
        home: "Celta Vigo",
        away: "Las Palmas",
        league: "Spain Primera Division",
        odds: { "1": 1.80, "X": 3.60, "2": 4.60 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      },
      {
        match_no: "15",
        home: "Rayo Vallecano",
        away: "CA Osasuna",
        league: "Spain Primera Division",
        odds: { "1": 2.20, "X": 3.20, "2": 3.50 },
        actual: "1",
        ai_predictions: { conservative: "X", balanced: "1", bold: "X" }
      },
      {
        match_no: "16",
        home: "Valencia CF",
        away: "Real Betis",
        league: "Spain Primera Division",
        odds: { "1": 2.45, "X": 3.10, "2": 3.10 },
        actual: "2",
        ai_predictions: { conservative: "X", balanced: "X", bold: "2" }
      },
      {
        match_no: "17",
        home: "Girona FC",
        away: "Cadiz CF",
        league: "Spain Primera Division",
        odds: { "1": 1.40, "X": 4.75, "2": 8.00 },
        actual: "1",
        ai_predictions: { conservative: "1", balanced: "1", bold: "1" }
      }
    ]
  }
];
