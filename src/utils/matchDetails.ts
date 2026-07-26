/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match } from "../types";

export interface MatchExtraDetails {
  referee: string;
  refereeRole: string;
  refereeCardsAvg: string;
  stadium: string;
  capacity: string;
  city: string;
  pitchType: string;
  broadcast: string;
  broadcastChannels: string[];
  weather: string;
  temperature: string;
  keyH2HNote: string;
}

export function getMatchExtraDetails(match: Match): MatchExtraDetails {
  const matchId = match.id || parseInt(match.match_no) || 1;

  // Pseudo-random seed function based on matchId
  const seed = (offset: number) => {
    let x = Math.sin(matchId * 999 + offset) * 10000;
    return x - Math.floor(x);
  };

  const referees = [
    { name: "Peter Waweru", role: "FIFA Badge Referee", cards: "3.6 Y / 0.12 R" },
    { name: "Anthony Taylor", role: "Premier League Official", cards: "3.8 Y / 0.18 R" },
    { name: "Michael Oliver", role: "Select Group 1 Ref", cards: "3.4 Y / 0.15 R" },
    { name: "Szymon Marciniak", role: "UEFA Elite Category", cards: "4.1 Y / 0.22 R" },
    { name: "Clement Turpin", role: "UEFA Elite Category", cards: "3.2 Y / 0.10 R" },
    { name: "Gilbert Cheruiyot", role: "FIFA Assistant / Ref", cards: "2.9 Y / 0.08 R" },
    { name: "Daniele Orsato", role: "Senior UEFA Official", cards: "4.4 Y / 0.25 R" },
    { name: "Felix Zwayer", role: "DFB Elite Referee", cards: "3.9 Y / 0.20 R" },
    { name: "Mary Njoroge", role: "FIFA Certified Ref", cards: "3.1 Y / 0.11 R" }
  ];

  const refereeObj = referees[Math.floor(seed(1) * referees.length)];

  // Stadium mappings based on home team or fallback
  const getStadiumInfo = (homeTeam: string) => {
    const home = homeTeam.toLowerCase();
    if (home.includes("arsenal")) return { stadium: "Emirates Stadium", capacity: "60,704", city: "London, UK", pitch: "Hybrid Desso GrassMaster" };
    if (home.includes("manchester city") || home.includes("man city")) return { stadium: "Etihad Stadium", capacity: "53,400", city: "Manchester, UK", pitch: "Reinforced Natural Turf" };
    if (home.includes("chelsea")) return { stadium: "Stamford Bridge", capacity: "40,341", city: "London, UK", pitch: "Natural Grass" };
    if (home.includes("liverpool")) return { stadium: "Anfield", capacity: "61,276", city: "Liverpool, UK", pitch: "GrassMaster Hybrid" };
    if (home.includes("gor mahia") || home.includes("gor")) return { stadium: "Kasarani Stadium", capacity: "60,000", city: "Nairobi, Kenya", pitch: "Natural Grass" };
    if (home.includes("afc leopards") || home.includes("leopards")) return { stadium: "Nyayo National Stadium", capacity: "30,000", city: "Nairobi, Kenya", pitch: "Natural Grass" };
    if (home.includes("real madrid")) return { stadium: "Santiago Bernabéu", capacity: "81,044", city: "Madrid, Spain", pitch: "Retractable Hybrid Pitch" };
    if (home.includes("barcelona")) return { stadium: "Lluís Companys Olympic", capacity: "55,926", city: "Barcelona, Spain", pitch: "Natural Grass" };
    if (home.includes("bayern")) return { stadium: "Allianz Arena", capacity: "75,024", city: "Munich, Germany", pitch: "Hybrid Turf" };
    if (home.includes("inter") || home.includes("milan")) return { stadium: "San Siro (Stadio Giuseppe Meazza)", capacity: "75,817", city: "Milan, Italy", pitch: "GrassMaster Hybrid" };
    if (home.includes("psg")) return { stadium: "Parc des Princes", capacity: "47,929", city: "Paris, France", pitch: "Natural Grass" };

    // Fallback stadiums
    const fallbacks = [
      { stadium: "National SuperSport Arena", capacity: "48,500", city: "Nairobi, Kenya", pitch: "Hybrid Natural Turf" },
      { stadium: "Mombasa Municipal Stadium", capacity: "32,000", city: "Mombasa, Kenya", pitch: "Natural Grass" },
      { stadium: "Eldoret Kipchoge Keino Stadium", capacity: "25,000", city: "Eldoret, Kenya", pitch: "Standard Grass" },
      { stadium: "Metropolitan Sports Complex", capacity: "52,000", city: "London, UK", pitch: "Desso GrassMaster" },
      { stadium: "Continental Arena", capacity: "41,500", city: "Frankfurt, Germany", pitch: "Natural Hybrid" }
    ];
    return fallbacks[Math.floor(seed(2) * fallbacks.length)];
  };

  const stadiumInfo = getStadiumInfo(match.home);

  // Broadcast Channels
  const broadcasts = [
    { main: "SuperSport Football HD", channels: ["DSTV Ch 205", "GOtv Supa Ch 66", "SuperSport Variety 3"] },
    { main: "SuperSport Grandstand", channels: ["DSTV Ch 201", "KBC Channel 1", "GOtv Max Ch 62"] },
    { main: "Azam Sports 1 HD", channels: ["Azam TV Ch 101", "StarTimes World Football", "Azam Max"] },
    { main: "Canal+ Sport 3", channels: ["Canal+ Ch 303", "SuperSport Select 2", "Kwesé Free Sports"] },
    { main: "Sky Sports Premier League", channels: ["DSTV Ch 203", "GOtv Football", "Maxland TV"] }
  ];
  const broadcastObj = broadcasts[Math.floor(seed(3) * broadcasts.length)];

  // Weather conditions
  const weatherList = [
    { weather: "Clear Sky & Dry Pitch", temp: "24°C (Humidity 45%, Wind 11 km/h)" },
    { weather: "Mild Light Rain & Slick Grass", temp: "18°C (Humidity 82%, Wind 18 km/h)" },
    { weather: "Overcast & Cool Evening", temp: "20°C (Humidity 60%, Wind 9 km/h)" },
    { weather: "Warm & Sunny Afternoon", temp: "27°C (Humidity 50%, Wind 14 km/h)" },
    { weather: "Partly Cloudy with Calm Winds", temp: "22°C (Humidity 55%, Wind 8 km/h)" }
  ];
  const weatherObj = weatherList[Math.floor(seed(4) * weatherList.length)];

  const h2hNotes = [
    `${match.home} have maintained a clean sheet in 3 of their last 4 encounters at ${stadiumInfo.stadium}.`,
    `Referee ${refereeObj.name} averages higher yellow card rates in physical derby fixtures.`,
    `Heavy public money shifting towards ${match.home} in Asian handicap books.`,
    `Expected pitch surface speed: Fast slick ball movement favored for counter-attacks.`,
    `Match broadcast live globally across ${broadcastObj.main} and ${broadcastObj.channels[0]}.`
  ];
  const keyH2HNote = h2hNotes[Math.floor(seed(5) * h2hNotes.length)];

  return {
    referee: refereeObj.name,
    refereeRole: refereeObj.role,
    refereeCardsAvg: refereeObj.cards,
    stadium: stadiumInfo.stadium,
    capacity: stadiumInfo.capacity,
    city: stadiumInfo.city,
    pitchType: stadiumInfo.pitch,
    broadcast: broadcastObj.main,
    broadcastChannels: broadcastObj.channels,
    weather: weatherObj.weather,
    temperature: weatherObj.temp,
    keyH2HNote
  };
}
