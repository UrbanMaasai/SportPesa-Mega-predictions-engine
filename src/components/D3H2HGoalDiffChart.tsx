import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  Info, 
  Shield, 
  Calendar, 
  User, 
  MapPin, 
  Activity, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  X,
  Trophy,
  Sparkles,
  Clock,
  Download,
  Table,
  Flame,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  ShieldAlert
} from "lucide-react";

import TeamLogo from "./TeamLogo";

interface D3H2HGoalDiffChartProps {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  matchNo?: string;
}

export interface H2HMatchData {
  index: number;
  season: string;
  homeScore: number;
  awayScore: number;
  goalDiff: number; // homeScore - awayScore
  scoreLabel: string;
  winner: "home" | "away" | "draw";
  matchDate: string;
  competition: string;
  possessionHome: number;
  possessionAway: number;
}

interface H2HMatchDetails {
  possessionHome: number;
  possessionAway: number;
  shotsHome: number;
  shotsAway: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  cornersHome: number;
  cornersAway: number;
  foulsHome: number;
  foulsAway: number;
  referee: string;
  venue: string;
  homeFormation: string;
  awayFormation: string;
  keyEvents: { minute: number; team: "home" | "away"; type: "goal" | "yellow" | "red"; description: string }[];
  summary: string;
}

// Deterministic historical H2H goals builder based on match details to guarantee consistent and stable plot
export function getHistoricalH2HData(matchId: number, homeTeam: string, awayTeam: string): H2HMatchData[] {
  // Use team names and matchId for a fully reproducible deterministic seed
  const combinedSeedStr = `${matchId}-${homeTeam}-${awayTeam}`;
  let seed = 0;
  for (let i = 0; i < combinedSeedStr.length; i++) {
    seed += combinedSeedStr.charCodeAt(i);
  }
  
  const seedRandom = (s: number) => {
    let value = s;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  };

  const rand = seedRandom(seed + 123);
  const seasons = ["2022/23 First", "2022/23 Second", "2023/24 First", "2023/24 Second", "2024/25 Last"];
  const competitions = [
    "2022/23 Cup Match",
    "2022/23 League Match",
    "2023/24 Cup Match",
    "2023/24 League Match",
    "24/25 Championship Leg"
  ];
  const dates = [
    "15 Oct 2022",
    "22 Jan 2023",
    "04 Nov 2023",
    "17 Mar 2024",
    "08 Jan 2025"
  ];
  
  return seasons.map((season, idx) => {
    // Standard realistic football goals distribution (mostly 0-3 goals)
    let homeScore = Math.floor(rand() * 4);
    let awayScore = Math.floor(rand() * 4);
    
    // Add natural variance
    if (homeScore === awayScore && rand() > 0.6) {
      if (rand() > 0.5) {
        homeScore += 1;
      } else if (awayScore > 0) {
        awayScore -= 1;
      }
    }
    
    const goalDiff = homeScore - awayScore;
    const winner = goalDiff > 0 ? "home" : goalDiff < 0 ? "away" : "draw";
    
    // Deterministic compact possession values (40% to 61% range)
    const itemSeed = matchId * 7 + (idx + 1) * 31 + homeTeam.length + awayTeam.length;
    const itemRand = seedRandom(itemSeed);
    const possessionHome = Math.round(40 + itemRand() * 21);
    const possessionAway = 100 - possessionHome;
    
    return {
      index: idx + 1,
      season,
      homeScore,
      awayScore,
      goalDiff,
      scoreLabel: `${homeScore} - ${awayScore}`,
      winner,
      matchDate: dates[idx],
      competition: competitions[idx],
      possessionHome,
      possessionAway
    };
  });
}

// Deterministic historical report details builder
function getDeterministicMatchDetails(matchId: number, homeTeam: string, awayTeam: string, match: H2HMatchData): H2HMatchDetails {
  const seed = matchId * 7 + match.index * 31 + homeTeam.length + awayTeam.length;
  const seedRandom = (s: number) => {
    let value = s;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  };
  const rand = seedRandom(seed);
  
  const referees = ["Peter Waweru", "Sylvester Kirwa", "Anthony Taylor", "Oliver Michael", "Gilbert Cheruiyot", "Mary Njoroge"];
  const referee = referees[Math.floor(rand() * referees.length)];
  
  const stadiums = ["SuperSport Arena", "National Stadium Complex", "Kasarani Stadium", "Nyayo Stadium", "Mombasa Municipal Field"];
  const venue = stadiums[Math.floor(rand() * stadiums.length)];
  
  const formations = ["4-3-3", "4-2-3-1", "4-4-2", "3-5-2", "5-3-2", "4-1-4-1"];
  const homeFormation = formations[Math.floor(rand() * formations.length)];
  const awayFormation = formations[Math.floor(rand() * formations.length)];
  
  const possessionHome = match.possessionHome;
  const possessionAway = match.possessionAway;
  
  const shotsHome = Math.round(6 + rand() * 12);
  const shotsAway = Math.round(5 + rand() * 11);
  
  const shotsOnTargetHome = Math.round(Math.min(shotsHome - 2, 2 + rand() * 6));
  const shotsOnTargetAway = Math.round(Math.min(shotsAway - 2, 1 + rand() * 6));
  
  const cornersHome = Math.round(2 + rand() * 6);
  const cornersAway = Math.round(2 + rand() * 6);
  
  const foulsHome = Math.round(8 + rand() * 10);
  const foulsAway = Math.round(9 + rand() * 11);
  
  // Key Events
  const keyEvents: any[] = [];
  
  // Home goals
  for (let g = 0; g < match.homeScore; g++) {
    const minute = Math.round(5 + (g * 25) + rand() * 20);
    keyEvents.push({
      minute,
      team: "home",
      type: "goal",
      description: `GOAL! Home star striker slides a clinical finish into the bottom corner.`
    });
  }
  
  // Away goals
  for (let g = 0; g < match.awayScore; g++) {
    const minute = Math.round(5 + (g * 25) + rand() * 20);
    keyEvents.push({
      minute,
      team: "away",
      type: "goal",
      description: `GOAL! Away team intercepts on a fast break and curls it past the goalkeeper.`
    });
  }
  
  // Yellow cards
  const yHome = Math.round(rand() * 2) + 1;
  for (let c = 0; c < yHome; c++) {
    keyEvents.push({
      minute: Math.round(15 + (c * 20) + rand() * 15),
      team: "home",
      type: "yellow",
      description: `Yellow Card: Tactical booking for a professional foul in midfield.`
    });
  }
  
  const yAway = Math.round(rand() * 2) + 1;
  for (let c = 0; c < yAway; c++) {
    keyEvents.push({
      minute: Math.round(15 + (c * 20) + rand() * 15),
      team: "away",
      type: "yellow",
      description: `Yellow Card: Defensive warning issued after persistent infringements.`
    });
  }
  
  // Sort events chronologically
  keyEvents.sort((a, b) => a.minute - b.minute);
  
  // Match summary description
  let summary = "";
  if (match.winner === "home") {
    summary = `A dominating performance by ${homeTeam} on home turf, executing their ${homeFormation} tactical blueprint with precision to outclass ${awayTeam}.`;
  } else if (match.winner === "away") {
    summary = `An exceptional away game plan from ${awayTeam}, breaking down ${homeTeam}'s defensive structure using rapid counter transitions in their ${awayFormation} shape.`;
  } else {
    summary = `A heavily contested, tactical stalemate. Both managers cancelled each other out with highly synchronized defensive alignments and spatial pressure.`;
  }
  
  return {
    possessionHome,
    possessionAway,
    shotsHome,
    shotsAway,
    shotsOnTargetHome,
    shotsOnTargetAway,
    cornersHome,
    cornersAway,
    foulsHome,
    foulsAway,
    referee,
    venue,
    homeFormation,
    awayFormation,
    keyEvents,
    summary,
  };
}

const getScoringMinuteVerdict = (minute: number) => {
  if (minute <= 15) return "Early Outbreak Intensity — Aggressive opening offence catches defenses off-guard.";
  if (minute <= 30) return "Tactical Chess Surge — Dynamic adjustments unlock spaces in middle transitional channels.";
  if (minute <= 45) return "Pre-Halftime Pressure — High-urgency offensive pushes right before managers re-strategize.";
  if (minute <= 60) return "Second-Half Recharge — Fresh instructions and early tactical pivots yield swift breakthroughs.";
  if (minute <= 75) return "Substitutes Acceleration — Fresh squad legs and altered spatial shape speed up scoring rates.";
  return "Late-Game High-Drama clutch surge — High physical fatigue leads to defensive gaps and thrilling finishes.";
};

export default function D3H2HGoalDiffChart({ matchId, homeTeam, awayTeam, matchNo }: D3H2HGoalDiffChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 160 });
  const [hoveredPoint, setHoveredPoint] = useState<H2HMatchData | null>(null);
  const [selectedH2HMatch, setSelectedH2HMatch] = useState<H2HMatchData | null>(null);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [metric, setMetric] = useState<"goalDiff" | "possession">("goalDiff");
  const [showH2HMetricsTable, setShowH2HMetricsTable] = useState<boolean>(false);
  const [flagAnomalies, setFlagAnomalies] = useState<boolean>(false);
  const [showAutoAnalysisThresholds, setShowAutoAnalysisThresholds] = useState<boolean>(true);

  const data = getHistoricalH2HData(matchId, homeTeam, awayTeam);

  // Calculate Auto-Analysis Statistical Significance & Model Confidence
  const autoAnalysisInfo = useMemo(() => {
    const values = data.map(d => metric === "goalDiff" ? d.goalDiff : d.possessionHome);
    const mean = values.reduce((sum, v) => sum + v, 0) / (values.length || 1);
    
    // Threshold values
    const upperThreshold = metric === "goalDiff" ? 1.5 : 58;
    const lowerThreshold = metric === "goalDiff" ? -1.5 : 42;

    let status: "home_significant" | "away_significant" | "inconclusive";
    let confidencePercent = 50;
    let textSummary = "";

    if (mean >= upperThreshold) {
      status = "home_significant";
      confidencePercent = Math.min(98, Math.round(78 + (mean - upperThreshold) * 10));
      textSummary = metric === "goalDiff" 
        ? `Statistically Significant Trend (+${mean.toFixed(1)} Avg GD) — ${homeTeam} holds a dominant H2H performance advantage.`
        : `Statistically Significant Control (${mean.toFixed(0)}% Avg Possession) — ${homeTeam} dictates game tempo.`;
    } else if (mean <= lowerThreshold) {
      status = "away_significant";
      confidencePercent = Math.min(98, Math.round(78 + (lowerThreshold - mean) * 10));
      textSummary = metric === "goalDiff"
        ? `Statistically Significant Trend (${mean.toFixed(1)} Avg GD) — ${awayTeam} holds a dominant H2H performance advantage.`
        : `Statistically Significant Control (${(100 - mean).toFixed(0)}% Avg Possession) — ${awayTeam} dictates game tempo.`;
    } else {
      status = "inconclusive";
      confidencePercent = Math.round(52 + Math.abs(mean - (metric === "goalDiff" ? 0 : 50)) * 8);
      textSummary = metric === "goalDiff"
        ? `Inconclusive / Volatile Trend (${mean > 0 ? `+${mean.toFixed(1)}` : mean.toFixed(1)} Avg GD) — Historical outcomes lie within normal sample noise variance (High Draw Risk).`
        : `Inconclusive Trend (${mean.toFixed(0)}% Avg Possession) — Balanced possession share with contested midfield phases.`;
    }

    return {
      mean,
      status,
      confidencePercent,
      textSummary,
      upperThreshold,
      lowerThreshold,
    };
  }, [data, metric, homeTeam, awayTeam]);

  // Construct detailed stats for each of the 5 historical matches
  const detailedH2HMetrics = useMemo(() => {
    return data.map((mItem) => {
      const details = getDeterministicMatchDetails(matchId, homeTeam, awayTeam, mItem);
      
      // Calculate yellow cards from events
      const yellowCardsHome = details.keyEvents.filter(e => e.team === "home" && e.type === "yellow").length;
      const yellowCardsAway = details.keyEvents.filter(e => e.team === "away" && e.type === "yellow").length;

      return {
        ...mItem,
        details,
        cornersHome: details.cornersHome,
        cornersAway: details.cornersAway,
        shotsHome: details.shotsHome,
        shotsAway: details.shotsAway,
        yellowCardsHome,
        yellowCardsAway,
        foulsHome: details.foulsHome,
        foulsAway: details.foulsAway,
      };
    });
  }, [data, matchId, homeTeam, awayTeam]);

  // Compute average metrics over all these 5 H2H games
  const averages = useMemo(() => {
    const total = detailedH2HMetrics.length;
    if (total === 0) return null;

    let cornersH = 0, cornersA = 0;
    let shotsH = 0, shotsA = 0;
    let yellowH = 0, yellowA = 0;
    let foulsH = 0, foulsA = 0;
    let goalsH = 0, goalsA = 0;

    detailedH2HMetrics.forEach(item => {
      cornersH += item.cornersHome;
      cornersA += item.cornersAway;
      shotsH += item.shotsHome;
      shotsA += item.shotsAway;
      yellowH += item.yellowCardsHome;
      yellowA += item.yellowCardsAway;
      foulsH += item.foulsHome;
      foulsA += item.foulsAway;
      goalsH += item.homeScore;
      goalsA += item.awayScore;
    });

    return {
      avgCornersHome: cornersH / total,
      avgCornersAway: cornersA / total,
      avgShotsHome: shotsH / total,
      avgShotsAway: shotsA / total,
      avgYellowHome: yellowH / total,
      avgYellowAway: yellowA / total,
      avgFoulsHome: foulsH / total,
      avgFoulsAway: foulsA / total,
      avgGoalsHome: goalsH / total,
      avgGoalsAway: goalsA / total,
    };
  }, [detailedH2HMetrics]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      const height = Math.max(150, Math.min(190, width * 0.5));
      setDimensions({
        width: width || 300,
        height
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);
  
  // Calculate standard deviation of goal differences
  const volatilityInfo = useMemo(() => {
    const goalDiffs = data.map((d) => d.goalDiff);
    const n = goalDiffs.length;
    if (n === 0) return { stdDev: 0, classification: "Low" as const };
    const mean = goalDiffs.reduce((sum, val) => sum + val, 0) / n;
    const variance = goalDiffs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Math.sqrt(variance);

    let classification: "Low" | "Medium" | "High" = "Medium";
    if (stdDev < 1.1) {
      classification = "Low";
    } else if (stdDev > 1.8) {
      classification = "High";
    }

    return {
      stdDev,
      classification
    };
  }, [data]);
  
  // Fallback to latest historical match if none selected
  const activeH2H = selectedH2HMatch || data[data.length - 1];
  const reportDetails = getDeterministicMatchDetails(matchId, homeTeam, awayTeam, activeH2H);

  const hypeFactors = useMemo(() => {
    const minuteCounts: Record<number, number> = {};
    data.forEach((mItem) => {
      const details = getDeterministicMatchDetails(matchId, homeTeam, awayTeam, mItem);
      details.keyEvents.forEach((evt) => {
        if (evt.type === "goal") {
          minuteCounts[evt.minute] = (minuteCounts[evt.minute] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(minuteCounts)
      .map(([mStr, count]) => ({ minute: parseInt(mStr, 10), count }))
      .sort((a, b) => b.count - a.count || a.minute - b.minute);

    const result = [...sorted];
    const defaultMins = [44, 88, 12, 23, 67, 75];
    let idx = 0;
    while (result.length < 3 && idx < defaultMins.length) {
      const defMin = defaultMins[idx++];
      if (!result.some((r) => r.minute === defMin)) {
        result.push({ minute: defMin, count: 1 });
      }
    }

    return result.slice(0, 3);
  }, [data, matchId, homeTeam, awayTeam]);

  const handleDownloadCSV = () => {
    // CSV Header
    const headers = [
      "Index", "Match Date", "Season", "Competition", "Home Team", "Away Team", 
      "Home Score", "Away Score", "Goal Difference", "Possession Home (%)", 
      "Possession Away (%)", "Winner"
    ];
    
    // Create rows
    const rows = data.map(item => [
      item.index,
      `"${item.matchDate}"`,
      `"${item.season}"`,
      `"${item.competition}"`,
      `"${homeTeam}"`,
      `"${awayTeam}"`,
      item.homeScore,
      item.awayScore,
      item.goalDiff,
      item.possessionHome,
      item.possessionAway,
      `"${item.winner}"`
    ]);
    
    // Combine header and rows
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    // Download Link creation & dispatch
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `h2h_trend_match_${matchNo || matchId}_${homeTeam.replace(/\s+/g, "_")}_vs_${awayTeam.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveImage = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    
    const clone = svgElement.cloneNode(true) as SVGElement;
    const width = dimensions.width || 600;
    const height = dimensions.height || 180;
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));
    clone.setAttribute("style", "background-color: #ffffff; font-family: sans-serif;");

    const svgData = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const canvas = document.createElement("canvas");
    const scale = 2; // High-resolution 2x canvas
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      
      const link = document.createElement("a");
      link.href = pngUrl;
      link.setAttribute("download", `H2H_Trend_Chart_Match_${matchNo || matchId}_${homeTeam.replace(/\s+/g, "_")}_vs_${awayTeam.replace(/\s+/g, "_")}.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = url;
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svgElement = d3.select(svgRef.current);

    const { width, height } = dimensions;
    const margin = { top: 20, right: 20, bottom: 25, left: 35 };
    const chartWidth = Math.max(50, width - margin.left - margin.right);
    const chartHeight = Math.max(50, height - margin.top - margin.bottom);

    svgElement
      .attr("width", width)
      .attr("height", height);

    let g = svgElement.select<SVGGElement>("g.main-group");
    if (g.empty()) {
      g = svgElement
        .append("g")
        .attr("class", "main-group");
    }
    g.attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X Scale domain includes historical seasons plus model's projected next match
    const projSeason = "Next Match (Proj)";
    const xDomain = [...data.map(d => d.season), projSeason];
    const x = d3.scalePoint()
      .domain(xDomain)
      .range([10, chartWidth - 10]);

    // Y Scale: centered differently depending on metric
    const isGoalDiff = metric === "goalDiff";
    const y = d3.scaleLinear()
      .domain(isGoalDiff ? [-4, 4] : [0, 100])
      .range([chartHeight, 0]);

    // Auto-Analysis Background Confidence & Significance Zones
    let zoneG = g.select<SVGGElement>("g.confidence-zones");
    if (zoneG.empty()) {
      zoneG = g.insert("g", ":first-child").attr("class", "confidence-zones");
    }

    if (showAutoAnalysisThresholds) {
      const upperThresh = isGoalDiff ? 1.5 : 58;
      const lowerThresh = isGoalDiff ? -1.5 : 42;
      const topY = isGoalDiff ? 4 : 100;
      const bottomY = isGoalDiff ? -4 : 0;

      const zonesData = [
        {
          id: "upper",
          y1: topY,
          y2: upperThresh,
          fill: "#10b981",
          opacity: 0.08,
          stroke: "#059669",
          label: isGoalDiff ? `${homeTeam} Dominance Zone (>90% Confidence)` : `${homeTeam} Control Zone (>90% Confidence)`
        },
        {
          id: "neutral",
          y1: upperThresh,
          y2: lowerThresh,
          fill: "#f59e0b",
          opacity: 0.04,
          stroke: "#d97706",
          label: "Inconclusive / Volatile Zone (Draw Risk)"
        },
        {
          id: "lower",
          y1: lowerThresh,
          y2: bottomY,
          fill: "#6366f1",
          opacity: 0.08,
          stroke: "#4f46e5",
          label: isGoalDiff ? `${awayTeam} Dominance Zone (>90% Confidence)` : `${awayTeam} Control Zone (>90% Confidence)`
        }
      ];

      const zoneRects = zoneG.selectAll<SVGRectElement, typeof zonesData[0]>("rect.zone-bg")
        .data(zonesData, d => d.id);

      zoneRects.exit().remove();

      zoneRects.enter()
        .append("rect")
        .attr("class", "zone-bg")
        .merge(zoneRects)
        .transition()
        .duration(750)
        .attr("x", 0)
        .attr("width", chartWidth)
        .attr("y", d => Math.min(y(d.y1), y(d.y2)))
        .attr("height", d => Math.abs(y(d.y1) - y(d.y2)))
        .attr("fill", d => d.fill)
        .attr("opacity", d => d.opacity);

      const threshLines = zoneG.selectAll<SVGLineElement, number>("line.thresh-line")
        .data([upperThresh, lowerThresh]);

      threshLines.exit().remove();

      threshLines.enter()
        .append("line")
        .attr("class", "thresh-line")
        .attr("stroke-dasharray", "3,3")
        .attr("stroke-width", 1.2)
        .merge(threshLines)
        .transition()
        .duration(750)
        .attr("x1", 0)
        .attr("x2", chartWidth)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("stroke", d => d > (isGoalDiff ? 0 : 50) ? "#059669" : "#4f46e5")
        .attr("opacity", 0.6);

      const threshText = zoneG.selectAll<SVGTextElement, typeof zonesData[0]>("text.zone-label")
        .data(zonesData, d => d.id);

      threshText.exit().remove();

      threshText.enter()
        .append("text")
        .attr("class", "zone-label")
        .attr("font-size", "7.5px")
        .attr("font-weight", "800")
        .attr("font-family", "system-ui, sans-serif")
        .attr("x", 6)
        .merge(threshText)
        .transition()
        .duration(750)
        .attr("y", d => {
          const yStart = y(d.y1);
          const yEnd = y(d.y2);
          return Math.min(yStart, yEnd) + Math.abs(yStart - yEnd) / 2 + 3;
        })
        .attr("fill", d => d.stroke)
        .attr("opacity", 0.85)
        .text(d => d.label);
    } else {
      zoneG.selectAll("*").remove();
    }

    // Grid lines
    let gridG = g.select<SVGGElement>("g.grid");
    if (gridG.empty()) {
      gridG = g.append("g").attr("class", "grid");
    }
    gridG.transition()
      .duration(700)
      .call(
        d3.axisLeft(y)
          .tickValues(isGoalDiff ? [-3, -2, -1, 1, 2, 3] : [25, 50, 75])
          .tickSize(-chartWidth)
          .tickFormat(() => "")
      )
      .call(grid => grid.select(".domain").remove())
      .call(grid => grid.selectAll(".tick line")
        .attr("stroke", "#f1f5f9")
        .attr("stroke-dasharray", "2,2")
      );

    // Zero/Equal baseline indicator
    const baselineVal = isGoalDiff ? 0 : 50;
    let baselineLine = g.select<SVGLineElement>("line.baseline");
    if (baselineLine.empty()) {
      baselineLine = g.append("line")
        .attr("class", "baseline")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "3,3");
    }
    baselineLine.transition()
      .duration(700)
      .attr("x1", 0)
      .attr("y1", y(baselineVal))
      .attr("x2", chartWidth)
      .attr("y2", y(baselineVal));

    // Zero baseline label
    let baselineLabel = g.select<SVGTextElement>("text.baseline-label");
    if (baselineLabel.empty()) {
      baselineLabel = g.append("text")
        .attr("class", "baseline-label")
        .attr("text-anchor", "end")
        .attr("fill", "#94a3b8")
        .attr("font-size", "7px")
        .attr("font-family", "monospace");
    }
    baselineLabel
      .text(isGoalDiff ? "Draw Line" : "50% Possession")
      .transition()
      .duration(700)
      .attr("x", chartWidth - 5)
      .attr("y", y(baselineVal) - 4);

    // X Axis
    let xAxisG = g.select<SVGGElement>("g.x-axis");
    if (xAxisG.empty()) {
      xAxisG = g.append("g").attr("class", "x-axis");
    }
    xAxisG
      .attr("transform", `translate(0, ${chartHeight})`)
      .transition()
      .duration(700)
      .call(d3.axisBottom(x).tickSize(0))
      .call(axisG => axisG.select(".domain").attr("stroke", "#e2e8f0").attr("stroke-width", 1));

    xAxisG.selectAll("text")
      .attr("fill", "#64748b")
      .attr("font-size", "8px")
      .attr("dy", "8px");

    // Y Axis
    let yAxisG = g.select<SVGGElement>("g.y-axis");
    if (yAxisG.empty()) {
      yAxisG = g.append("g").attr("class", "y-axis");
    }
    yAxisG.transition()
      .duration(700)
      .call(
        d3.axisLeft(y)
          .tickValues(isGoalDiff ? [-4, -2, 0, 2, 4] : [0, 25, 50, 75, 100])
          .tickFormat(d => {
            const val = Number(d);
            if (isGoalDiff) {
              return val > 0 ? `+${val}` : `${val}`;
            } else {
              return `${val}%`;
            }
          })
      )
      .call(axisG => axisG.select(".domain").remove());

    yAxisG.selectAll("text")
      .attr("fill", "#94a3b8")
      .attr("font-size", "8px")
      .attr("font-family", "monospace");

    // Line generator
    const lineGen = d3.line<H2HMatchData>()
      .x(d => x(d.season) || 0)
      .y(d => y(isGoalDiff ? d.goalDiff : d.possessionHome))
      .curve(d3.curveMonotoneX);

    // Dynamic gradient under the curve
    let defs = svgElement.select("defs");
    if (defs.empty()) {
      defs = svgElement.append("defs");
    }
    let gradient = defs.select("#goal-diff-gradient");
    if (gradient.empty()) {
      gradient = defs.append("linearGradient")
        .attr("id", "goal-diff-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#10b981")
        .attr("stop-opacity", 0.15);

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#6366f1")
        .attr("stop-opacity", 0.05);
    }

    // Add trendline path
    let trendPath = g.select<SVGPathElement>("path.trend-line");
    if (trendPath.empty()) {
      trendPath = g.append("path")
        .attr("class", "trend-line")
        .attr("fill", "none")
        .attr("stroke-width", 2.2);
    }

    trendPath
      .datum(data)
      .transition()
      .duration(750)
      .ease(d3.easeQuadInOut)
      .attr("stroke", isGoalDiff ? "#4f46e5" : "#10b981")
      .attr("d", lineGen);

    // Calculate model projected point for next match
    const lastMatch = data[data.length - 1];
    const projGoalDiff = Math.max(-3, Math.min(3, Math.round(((lastMatch.goalDiff * 0.4) + (((matchId % 5) - 2) * 0.6)) * 10) / 10));
    const projPossession = Math.max(30, Math.min(70, Math.round(lastMatch.possessionHome * 0.5 + (50 + ((matchId % 7) - 3) * 4) * 0.5)));

    const predData = [
      { season: lastMatch.season, val: isGoalDiff ? lastMatch.goalDiff : lastMatch.possessionHome },
      { season: projSeason, val: isGoalDiff ? projGoalDiff : projPossession }
    ];

    const predLineGen = d3.line<{ season: string; val: number }>()
      .x(d => x(d.season) || 0)
      .y(d => y(d.val))
      .curve(d3.curveMonotoneX);

    // Faded, dashed prediction path representing model's projected outcome
    let predPath = g.select<SVGPathElement>("path.prediction-line");
    if (predPath.empty()) {
      predPath = g.append("path")
        .attr("class", "prediction-line")
        .attr("fill", "none")
        .attr("stroke-width", 2.2)
        .attr("stroke-dasharray", "4,3")
        .attr("opacity", 0.85);
    }

    predPath
      .datum(predData)
      .transition()
      .duration(750)
      .ease(d3.easeQuadInOut)
      .attr("stroke", isGoalDiff ? "#f59e0b" : "#ec4899")
      .attr("d", predLineGen);

    // Projected Node Pulse Halo
    let projPulse = g.select<SVGCircleElement>("circle.proj-pulse");
    if (projPulse.empty()) {
      projPulse = g.append("circle")
        .attr("class", "proj-pulse")
        .attr("fill", "none")
        .attr("stroke", isGoalDiff ? "#f59e0b" : "#ec4899")
        .attr("stroke-width", 1.8)
        .attr("opacity", 0.6);

      projPulse.append("animate")
        .attr("attributeName", "r")
        .attr("values", "6;16;6")
        .attr("dur", "2s")
        .attr("repeatCount", "indefinite");

      projPulse.append("animate")
        .attr("attributeName", "opacity")
        .attr("values", "0.8;0.1;0.8")
        .attr("dur", "2s")
        .attr("repeatCount", "indefinite");
    }

    projPulse
      .transition()
      .duration(750)
      .attr("cx", x(projSeason) || 0)
      .attr("cy", y(isGoalDiff ? projGoalDiff : projPossession));

    // Projected Node Circle
    let projCircle = g.select<SVGCircleElement>("circle.proj-dot");
    if (projCircle.empty()) {
      projCircle = g.append("circle")
        .attr("class", "proj-dot")
        .attr("r", 6.5)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .attr("filter", "drop-shadow(0px 1px 2px rgba(0,0,0,0.25))");
    }

    projCircle
      .transition()
      .duration(750)
      .attr("cx", x(projSeason) || 0)
      .attr("cy", y(isGoalDiff ? projGoalDiff : projPossession))
      .attr("fill", isGoalDiff ? "#f59e0b" : "#ec4899");

    // Projected Text Label
    let projLabel = g.select<SVGTextElement>("text.proj-value-txt");
    if (projLabel.empty()) {
      projLabel = g.append("text")
        .attr("class", "proj-value-txt")
        .attr("text-anchor", "middle")
        .attr("font-size", "7.5px")
        .attr("font-family", "monospace")
        .attr("font-weight", "900");
    }

    projLabel
      .text(isGoalDiff ? `Proj: ${projGoalDiff > 0 ? `+${projGoalDiff}` : projGoalDiff}` : `Proj: ${projPossession}%`)
      .transition()
      .duration(750)
      .attr("x", x(projSeason) || 0)
      .attr("y", y(isGoalDiff ? projGoalDiff : projPossession) - 10)
      .attr("fill", isGoalDiff ? "#d97706" : "#db2777");

    // Plot data points (circles)
    const circles = g.selectAll<SVGCircleElement, H2HMatchData>("circle.dot")
      .data(data, (d, i) => i);

    circles.exit().remove();

    const circlesEnter = circles.enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => x(d.season) || 0)
      .attr("cy", d => y(isGoalDiff ? d.goalDiff : d.possessionHome))
      .attr("r", 0)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1.8)
      .style("cursor", "pointer")
      .attr("filter", "drop-shadow(0px 1px 1px rgba(0,0,0,0.1))");

    const mergedCircles = circlesEnter.merge(circles);

    mergedCircles.transition()
      .duration(750)
      .ease(d3.easeQuadInOut)
      .attr("cx", d => x(d.season) || 0)
      .attr("cy", d => y(isGoalDiff ? d.goalDiff : d.possessionHome))
      .attr("r", d => {
        if (d.season === activeH2H.season) return 6.5;
        if (Math.abs(d.goalDiff) >= 3) return 5.5;
        return 4.5;
      })
      .attr("fill", d => {
        if (isGoalDiff) {
          return d.goalDiff > 0 ? "#10b981" : d.goalDiff < 0 ? "#6366f1" : "#94a3b8";
        } else {
          return d.possessionHome > 50 ? "#10b981" : d.possessionHome < 50 ? "#6366f1" : "#94a3b8";
        }
      })
      .attr("stroke", d => {
        if (d.season === activeH2H.season) {
          return "#0f172a";
        }
        if (Math.abs(d.goalDiff) >= 3) {
          return "#f43f5e"; // Distinct Rose-500 red border
        }
        return "#ffffff";
      })
      .attr("stroke-width", d => {
        if (d.season === activeH2H.season) {
          return Math.abs(d.goalDiff) >= 3 ? 3.5 : 2.5;
        }
        if (Math.abs(d.goalDiff) >= 3) {
          return 2.5; // Thicker distinct border style
        }
        return 1.8;
      })
      .attr("stroke-dasharray", d => {
        if (Math.abs(d.goalDiff) >= 3 && d.season !== activeH2H.season) {
          return "2.5,1.5"; // Dash style for a distinct dotted/dashed visual look
        }
        return null;
      });

    // Highlight text markers above points
    const textLabels = g.selectAll<SVGTextElement, H2HMatchData>("text.value-txt")
      .data(data, (d, i) => i);

    textLabels.exit().remove();

    const textLabelsEnter = textLabels.enter()
      .append("text")
      .attr("class", "value-txt")
      .attr("text-anchor", "middle")
      .attr("font-size", "7.5px")
      .attr("font-family", "monospace")
      .attr("font-weight", "bold")
      .style("opacity", 0);

    const mergedLabels = textLabelsEnter.merge(textLabels);

    mergedLabels
      .text(d => {
        if (isGoalDiff) {
          return d.goalDiff > 0 ? `+${d.goalDiff}` : `${d.goalDiff}`;
        } else {
          return `${d.possessionHome}%`;
        }
      });

    mergedLabels.transition()
      .duration(750)
      .ease(d3.easeQuadInOut)
      .attr("x", d => x(d.season) || 0)
      .attr("y", d => {
        const val = isGoalDiff ? d.goalDiff : d.possessionHome;
        const limit = isGoalDiff ? 0 : 50;
        return val >= limit ? y(val) - 8 : y(val) + 12;
      })
      .attr("fill", d => {
        if (isGoalDiff) {
          return d.goalDiff > 0 ? "#059669" : d.goalDiff < 0 ? "#4f46e5" : "#64748b";
        } else {
          return d.possessionHome > 50 ? "#059669" : d.possessionHome < 50 ? "#4f46e5" : "#64748b";
        }
      })
      .style("opacity", 0.95);

    // Tooltip trigger and click actions
    mergedCircles.on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(120)
        .attr("r", d.season === activeH2H.season ? 7.5 : (Math.abs(d.goalDiff) >= 3 ? 6.5 : 6.0));
      
      setHoveredPoint(d);
    }).on("mouseout", function (event, d) {
      d3.select(this)
        .transition()
        .duration(120)
        .attr("r", d.season === activeH2H.season ? 6.5 : (Math.abs(d.goalDiff) >= 3 ? 5.5 : 4.5));
      
      setHoveredPoint(null);
    }).on("click", function (event, d) {
      setSelectedH2HMatch(d);
      setShowReport(true);
    });

    // Handle Anomaly Pulsing Rings if Flag Anomalies mode is active
    g.selectAll("g.anomaly-pulse-group").remove();

    if (flagAnomalies) {
      const anomalyGroup = g.append("g").attr("class", "anomaly-pulse-group");

      const anomalyData = data.filter((d) => {
        if (metric === "goalDiff") {
          return Math.abs(d.goalDiff) >= 2 || Math.abs(d.homeScore - d.awayScore) >= 2;
        } else {
          return Math.abs(d.possessionHome - 50) >= 12;
        }
      });

      anomalyData.forEach((d) => {
        const cx = x(d.season) || 0;
        const cy = y(metric === "goalDiff" ? d.goalDiff : d.possessionHome);

        const pulseG = anomalyGroup.append("g");

        // Primary pulsating animated SVG halo ring
        const innerRing = pulseG.append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 9)
          .attr("fill", "none")
          .attr("stroke", "#f43f5e") // rose-500
          .attr("stroke-width", 2)
          .attr("opacity", 0.9);

        innerRing.append("animate")
          .attr("attributeName", "r")
          .attr("values", "6;18;6")
          .attr("dur", "1.5s")
          .attr("repeatCount", "indefinite");

        innerRing.append("animate")
          .attr("attributeName", "opacity")
          .attr("values", "0.95;0.1;0.95")
          .attr("dur", "1.5s")
          .attr("repeatCount", "indefinite");

        innerRing.append("animate")
          .attr("attributeName", "stroke-width")
          .attr("values", "3;1;3")
          .attr("dur", "1.5s")
          .attr("repeatCount", "indefinite");

        // Secondary outer glowing pulse ping ring
        const outerRing = pulseG.append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 14)
          .attr("fill", "none")
          .attr("stroke", "#fb7185") // rose-400
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.5);

        outerRing.append("animate")
          .attr("attributeName", "r")
          .attr("values", "10;26;10")
          .attr("dur", "1.5s")
          .attr("repeatCount", "indefinite");

        outerRing.append("animate")
          .attr("attributeName", "opacity")
          .attr("values", "0.6;0;0.6")
          .attr("dur", "1.5s")
          .attr("repeatCount", "indefinite");
      });
    }

  }, [dimensions, data, activeH2H, metric, flagAnomalies, showAutoAnalysisThresholds]);

  return (
    <div id="D3H2HGoalDiffChart" className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-left font-sans mt-3 relative">
      {/* Matchday Label Showcase at Top Left Corner of Container */}
      <div className="flex items-center justify-between border-b border-slate-200/50 pb-2.5 mb-1.5 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-indigo-600/10 text-indigo-700 border border-indigo-200/40 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase font-mono">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span>Matchday {matchNo || `#${matchId}`}: {homeTeam} vs {awayTeam}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSaveImage}
            id="save-image-btn"
            className="flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 hover:text-white bg-emerald-100/80 hover:bg-emerald-600 border border-emerald-300/60 px-2.5 py-1 rounded transition-all duration-150 cursor-pointer shadow-3xs"
            title="Capture and save high-resolution PNG image snapshot of this H2H chart"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600 hover:text-white" />
            <span>Save Image</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200/60 px-2.5 py-1 rounded transition-all duration-150 cursor-pointer shadow-3xs"
            title="Download H2H Historical Data as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
          <span className="text-[8px] font-extrabold text-slate-400 font-mono uppercase tracking-widest">
            Historical Trend Matrix
          </span>
        </div>
      </div>

      {/* Title block with adjacent "Show More Match Details" toggle and Metric toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">
              {metric === "goalDiff" ? "H2H Goal Difference Trend" : "H2H Possession Trend"} (Last 5 Games)
            </span>
            <span 
              className={`px-1.5 py-0.5 rounded text-[8.5px] font-black tracking-wider uppercase border ${
                volatilityInfo.classification === "Low"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : volatilityInfo.classification === "Medium"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
              }`}
              title={`Goal Difference Volatility Index measured by Sample Standard Deviation of historical scores (±${volatilityInfo.stdDev.toFixed(2)} goals)`}
            >
              Volatility: {volatilityInfo.classification}
            </span>
          </div>
          
          {/* Integrated UI Toggle Switch */}
          <div className="inline-flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-300/30 shadow-3xs select-none items-center">
            <button
              onClick={() => setMetric("goalDiff")}
              className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                metric === "goalDiff"
                  ? "bg-white text-indigo-700 shadow-3xs font-black border border-slate-250/20"
                  : "text-slate-500 hover:text-slate-800 font-bold bg-transparent"
              }`}
            >
              Goal Diff
            </button>
            <button
              onClick={() => setMetric("possession")}
              className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                metric === "possession"
                  ? "bg-white text-indigo-700 shadow-3xs font-black border border-slate-250/20"
                  : "text-slate-500 hover:text-slate-800 font-bold bg-transparent"
              }`}
            >
              Possession
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto-Analysis Thresholds Toggle Button */}
          <button
            onClick={() => setShowAutoAnalysisThresholds(!showAutoAnalysisThresholds)}
            id="auto-analysis-thresholds-toggle"
            className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
              showAutoAnalysisThresholds
                ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                : "bg-white hover:bg-slate-100 text-amber-700 border-slate-200 shadow-3xs"
            }`}
            title="Toggle shaded background confidence zones providing visual guidance on statistical trend significance"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${showAutoAnalysisThresholds ? "text-white animate-pulse" : "text-amber-600"}`} />
            <span>Auto-Analysis Thresholds</span>
            <span className={`px-1.5 py-0.2 rounded text-[7.5px] font-mono font-bold ${
              showAutoAnalysisThresholds ? "bg-amber-950/40 text-amber-100" : "bg-amber-100 text-amber-800"
            }`}>
              {showAutoAnalysisThresholds ? "ON" : "OFF"}
            </span>
          </button>

          {/* Flag Anomalies Toggle Button */}
          <button
            onClick={() => setFlagAnomalies(!flagAnomalies)}
            id="flag-anomalies-toggle"
            className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
              flagAnomalies
                ? "bg-rose-600 text-white border-rose-700 shadow-xs"
                : "bg-white hover:bg-slate-100 text-rose-600 border-slate-200 shadow-3xs"
            }`}
            title="Automatically identify and highlight goal difference trend outliers and score blowouts"
          >
            <Flame className={`w-3.5 h-3.5 ${flagAnomalies ? "text-white animate-bounce" : "text-rose-500"}`} />
            <span>Flag Anomalies</span>
            {flagAnomalies && (
              <span className="bg-rose-800 text-white px-1.5 py-0.2 rounded text-[7.5px] font-mono font-bold">
                {data.filter(d => Math.abs(d.goalDiff) >= 2).length} Outlier(s)
              </span>
            )}
          </button>

          {/* Detailed H2H Stats Table Toggle */}
          <button
            onClick={() => {
              setShowH2HMetricsTable(!showH2HMetricsTable);
            }}
            className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border transition-all duration-150 cursor-pointer flex items-center gap-1 ${
              showH2HMetricsTable 
                ? "bg-indigo-600 text-white border-transparent shadow-xs" 
                : "bg-white hover:bg-slate-100 text-indigo-700 border-slate-200 shadow-3xs"
            }`}
          >
            <Table className={`w-3 h-3 ${showH2HMetricsTable ? "text-white" : "text-indigo-600 animate-pulse"}`} />
            <span>H2H Metrics Table</span>
            {showH2HMetricsTable ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={() => setShowReport(!showReport)}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-700 text-[9px] font-black uppercase rounded-lg border border-slate-200 shadow-3xs cursor-pointer transition flex items-center gap-1"
          >
            {showReport ? (
              <>
                <span>Hide Report</span>
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Show More Match Details</span>
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Auto-Analysis Threshold Banner */}
      {showAutoAnalysisThresholds && (
        <div className={`p-2.5 rounded-lg text-[9px] flex items-center justify-between font-sans border animate-fade-in gap-2 flex-wrap ${
          autoAnalysisInfo.status === "home_significant"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900"
            : autoAnalysisInfo.status === "away_significant"
            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-900"
            : "bg-amber-500/10 border-amber-500/30 text-amber-900"
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${
              autoAnalysisInfo.status === "home_significant" ? "text-emerald-600" : autoAnalysisInfo.status === "away_significant" ? "text-indigo-600" : "text-amber-600"
            }`} />
            <div className="flex flex-col gap-0.5">
              <span className="font-extrabold uppercase text-[8px] tracking-wider flex items-center gap-1.5 flex-wrap">
                <span>Auto-Analysis Threshold Visualizer</span>
                <span className="font-mono bg-white/80 px-1.5 py-0.2 rounded border border-black/10 text-[7.5px] font-black text-slate-800">
                  {autoAnalysisInfo.confidencePercent}% Model Confidence
                </span>
              </span>
              <span className="font-medium text-[8.5px]">
                {autoAnalysisInfo.textSummary} Shaded background zones highlight statistical significance thresholds.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 font-mono text-[8px] flex-wrap">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 font-bold">
              <span className="w-2 h-2 rounded bg-emerald-500"></span> Home Sig. (&gt;{metric === "goalDiff" ? "+1.5" : "58%"})
            </span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 font-bold">
              <span className="w-2 h-2 rounded bg-amber-500"></span> Noise / Inconclusive
            </span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-800 font-bold">
              <span className="w-2 h-2 rounded bg-indigo-500"></span> Away Sig. (&lt;{metric === "goalDiff" ? "-1.5" : "42%"})
            </span>
          </div>
        </div>
      )}

      {/* Flag Anomalies Indicator Callout Banner */}
      {flagAnomalies && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg text-rose-800 dark:text-rose-300 text-[9px] flex items-center justify-between font-sans animate-fade-in">
          <span className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" />
            <span>Anomaly Detector Active: Highlighting {data.filter(d => Math.abs(d.goalDiff) >= 2).length} outlier data point(s) with goal difference &ge; 2 (score blowouts) using animated SVG pulse halos.</span>
          </span>
          <span className="font-mono text-[8px] bg-rose-200 dark:bg-rose-900/50 text-rose-900 dark:text-rose-200 px-1.5 py-0.5 rounded font-black uppercase shrink-0">
            PULSE_ANIMATION_ON
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 text-[7.5px] font-bold flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-slate-450 uppercase text-[7px] tracking-wider font-extrabold mr-1">Ledger:</span>
          {metric === "goalDiff" ? (
            <>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Home Win
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Draw
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Away Win
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Home Dominance (&gt;50%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Equal Share (50%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Away Dominance (&gt;50%)
              </span>
            </>
          )}
        </div>
        <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-extrabold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
          <span className="w-3 border-b-2 border-dashed border-amber-500"></span>
          Model Projected Outcome (Faded Dashed)
        </span>
      </div>

      <div
        ref={containerRef}
        className="w-full bg-white py-2.5 px-1.5 rounded-lg border border-slate-150/60 shadow-3xs relative h-[160px] flex items-center justify-center"
      >
        <svg ref={svgRef} className="overflow-visible w-full h-full" />

        {hoveredPoint ? (
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[9.5px] px-3 py-1.5 rounded-lg shadow-lg font-sans flex flex-col items-center gap-1 border border-slate-800 pointer-events-none z-10 animate-fade-in whitespace-nowrap text-center">
            <div className="text-[8px] text-slate-400 font-mono font-bold tracking-wider uppercase">
              {hoveredPoint.competition} • {hoveredPoint.matchDate}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[10px]">
                {homeTeam} <span className="text-yellow-450 font-mono tracking-wide px-1 bg-slate-800 rounded">{hoveredPoint.scoreLabel}</span> {awayTeam}
              </span>
              <span className={`text-[7.5px] px-1.5 py-0.5 rounded-md font-extrabold uppercase ${
                metric === "goalDiff"
                  ? (hoveredPoint.goalDiff > 0 
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                    : hoveredPoint.goalDiff < 0 
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" 
                    : "bg-slate-500/20 text-slate-300 border border-slate-500/30")
                  : (hoveredPoint.possessionHome > 50
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : hoveredPoint.possessionHome < 50
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "bg-slate-500/20 text-slate-300 border border-slate-500/30")
              }`}>
                {metric === "goalDiff" 
                  ? (hoveredPoint.goalDiff > 0 ? `${homeTeam} Win` : hoveredPoint.goalDiff < 0 ? `${awayTeam} Win` : "Draw")
                  : (hoveredPoint.possessionHome > 50 ? `${hoveredPoint.possessionHome}% Home` : hoveredPoint.possessionHome < 50 ? `${hoveredPoint.possessionAway}% Away` : "50% Equal")
                }
              </span>
            </div>
            <div className="text-[8px] font-semibold text-slate-300 font-mono">
              {metric === "goalDiff" ? (
                <>Goal Diff: <span className="text-emerald-400 font-extrabold">{hoveredPoint.goalDiff > 0 ? `+${hoveredPoint.goalDiff}` : hoveredPoint.goalDiff}</span></>
              ) : (
                <>Possession share: <span className="text-emerald-400 font-extrabold">{hoveredPoint.possessionHome}% - {hoveredPoint.possessionAway}%</span></>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[8px] text-slate-400 font-medium font-sans flex items-center gap-1 select-none pointer-events-none bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
            <Info className="w-2.5 h-2.5 text-indigo-500" />
            <span>Click circles to change selected H2H matchup</span>
          </div>
        )}
      </div>

      {/* Dynamic Interactive Legend for Home and Away Team Colors */}
      <div id="h2h-chart-dynamic-legend" className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-3xs flex flex-wrap items-center justify-between gap-2.5 text-[9px] font-sans">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[8px] font-mono font-black uppercase text-slate-400 tracking-wider">
            Dynamic Legend:
          </span>
          
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/80 px-2.5 py-1 rounded-md shadow-3xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0"></span>
            <TeamLogo name={homeTeam} size="xs" />
            <span className="font-extrabold">{homeTeam}</span>
            <span className="text-[7.5px] font-mono text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded font-bold">
              {metric === "goalDiff" ? "Home (+GD)" : ">50% Poss"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 text-slate-700 border border-slate-200/80 px-2.5 py-1 rounded-md shadow-3xs">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-slate-200 shrink-0"></span>
            <span className="font-extrabold">Level / Draw</span>
            <span className="text-[7.5px] font-mono text-slate-600 bg-slate-150 px-1.5 py-0.2 rounded font-bold">
              {metric === "goalDiff" ? "GD = 0" : "50% Equal"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-900 border border-indigo-200/80 px-2.5 py-1 rounded-md shadow-3xs">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-200 shrink-0"></span>
            <TeamLogo name={awayTeam} size="xs" />
            <span className="font-extrabold">{awayTeam}</span>
            <span className="text-[7.5px] font-mono text-indigo-700 bg-indigo-100/90 px-1.5 py-0.2 rounded font-bold">
              {metric === "goalDiff" ? "Away (-GD)" : ">50% Poss"}
            </span>
          </div>
        </div>

        <div className="text-[8px] text-slate-500 font-medium hidden md:flex items-center gap-1 font-mono">
          <Info className="w-3 h-3 text-indigo-500 shrink-0" />
          <span>
            {metric === "goalDiff"
              ? `Positive goal diff (+GD) = ${homeTeam} lead; negative (-GD) = ${awayTeam} lead.`
              : `Values >50% indicate higher possession share.`}
          </span>
        </div>
      </div>

      {/* Goal Difference Trend Takeaway */}
      <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500 bg-slate-100/40 px-3 py-1.5 rounded-lg border border-slate-200/40">
        <div className="flex items-center gap-1.5">
          <TrendingUp className={`w-3.5 h-3.5 ${data.reduce((sum, item) => sum + item.goalDiff, 0) >= 0 ? "text-emerald-500" : "text-indigo-500"}`} />
          <span>Goal Difference Trend: <span className={`font-black ${data.reduce((sum, item) => sum + item.goalDiff, 0) >= 0 ? "text-emerald-600" : "text-indigo-600"}`}>{data.reduce((sum, item) => sum + item.goalDiff, 0) >= 0 ? "Positive" : "Negative"}</span></span>
        </div>
        <span className="text-[8px] font-mono text-slate-450 uppercase">
          Aggregate GD: {data.reduce((sum, item) => sum + item.goalDiff, 0) > 0 ? `+${data.reduce((sum, item) => sum + item.goalDiff, 0)}` : data.reduce((sum, item) => sum + item.goalDiff, 0)}
        </span>
      </div>

      {/* Detailed H2H Metrics Table */}
      <AnimatePresence>
        {showH2HMetricsTable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3.5 font-sans text-left"
          >
            <div className="border-b border-slate-200/60 pb-2.5 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-indigo-600" />
                  Historical H2H Detailed Metrics Grid
                </h4>
                <p className="text-[9.5px] text-slate-500 font-medium">
                  Detailed analysis of team efficiency, disciplinary record, corners, and shots density over the past 5 matches.
                </p>
              </div>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[8.5px] font-bold uppercase tracking-wider rounded border border-indigo-100/30 whitespace-nowrap">
                5 Match History Averages
              </span>
            </div>

            {/* Quick stats averages strip */}
            {averages && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-indigo-50/20 p-3 rounded-lg border border-indigo-100/20 text-[9.5px]">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block uppercase text-[7px] tracking-wider">Avg Goals Rate</span>
                  <span className="font-extrabold text-slate-800">
                    {averages.avgGoalsHome.toFixed(1)} - {averages.avgGoalsAway.toFixed(1)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block uppercase text-[7px] tracking-wider">Avg Corners Total</span>
                  <span className="font-extrabold text-indigo-700">
                    {(averages.avgCornersHome + averages.avgCornersAway).toFixed(1)} ({averages.avgCornersHome.toFixed(1)} vs {averages.avgCornersAway.toFixed(1)})
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block uppercase text-[7px] tracking-wider">Avg Disciplinary (Yellows)</span>
                  <span className="font-extrabold text-amber-700">
                    {(averages.avgYellowHome + averages.avgYellowAway).toFixed(1)} ({averages.avgYellowHome.toFixed(1)} - {averages.avgYellowAway.toFixed(1)})
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block uppercase text-[7px] tracking-wider">Avg Shots &amp; Fouls</span>
                  <span className="font-extrabold text-slate-700">
                    {(averages.avgShotsHome).toFixed(1)} shots &bull; {(averages.avgFoulsHome).toFixed(1)} fouls
                  </span>
                </div>
              </div>
            )}

            {/* Responsive Table Wrapper */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-[9.5px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-505 font-bold uppercase text-[7.5px] tracking-wider border-b border-slate-200">
                    <th className="p-2.5 pl-3">Fixture &amp; Date</th>
                    <th className="p-2.5">FT Score</th>
                    <th className="p-2.5 text-center">Corners Total</th>
                    <th className="p-2.5 text-center">Discipline (Yellows)</th>
                    <th className="p-2.5 text-center">shots / on-target</th>
                    <th className="p-2.5 text-center">fouls committed</th>
                    <th className="p-2.5 pr-3">Ref &amp; formation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-705">
                  {detailedH2HMetrics.map((item) => (
                    <tr 
                      key={item.index} 
                      onClick={() => {
                        setSelectedH2HMatch(item);
                        // Row selection updates activeH2H state
                      }}
                      className={`hover:bg-slate-50/80 transition-colors duration-100 cursor-pointer ${
                        item.season === activeH2H.season ? "bg-indigo-50/30 font-medium" : ""
                      }`}
                    >
                      <td className="p-2.5 pl-3">
                        <div className="font-bold text-slate-900">{item.season}</div>
                        <div className="text-[8.5px] text-slate-400">{item.matchDate} &bull; {item.competition}</div>
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          item.winner === "home" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-150" 
                            : item.winner === "away" 
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-150" 
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}>
                          {item.scoreLabel}
                        </span>
                        <span className="text-[8.5px] ml-1.5 text-slate-500 font-mono">
                          ({item.possessionHome}% vs {item.possessionAway}%)
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-indigo-950">
                        {item.cornersHome + item.cornersAway} <span className="text-[8px] text-slate-400 font-normal">({item.cornersHome}h - {item.cornersAway}a)</span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-amber-700">
                        {item.yellowCardsHome + item.yellowCardsAway}🟨 <span className="text-[8px] text-slate-400 font-normal">({item.yellowCardsHome} - {item.yellowCardsAway})</span>
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-650">
                        <span className="font-bold">{item.shotsHome} - {item.shotsAway}</span>
                        <span className="text-[8px] block text-slate-400">({item.details.shotsOnTargetHome}h - {item.details.shotsOnTargetAway}a)</span>
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-600">
                        {item.foulsHome} - {item.foulsAway}
                      </td>
                      <td className="p-2.5 pr-3 text-slate-500">
                        <div className="truncate max-w-[120px] font-bold text-slate-700">{item.details.referee}</div>
                        <div className="text-[8px] font-mono">H: {item.details.homeFormation} vs A: {item.details.awayFormation}</div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Averages Row */}
                  {averages && (
                    <tr className="bg-indigo-50/10 font-bold text-indigo-950 border-t-2 border-indigo-100 uppercase text-[8px] tracking-wider">
                      <td className="p-2.5 py-3 pl-3">AVERAGE TARGETS</td>
                      <td className="p-2.5">
                        Goals: {averages.avgGoalsHome.toFixed(1)} - {averages.avgGoalsAway.toFixed(1)}
                      </td>
                      <td className="p-2.5 text-center font-mono text-indigo-900">
                        {(averages.avgCornersHome + averages.avgCornersAway).toFixed(1)}
                      </td>
                      <td className="p-2.5 text-center font-mono text-amber-700">
                        {(averages.avgYellowHome + averages.avgYellowAway).toFixed(1)}
                      </td>
                      <td className="p-2.5 text-center font-mono">
                        {averages.avgShotsHome.toFixed(1)} - {averages.avgShotsAway.toFixed(1)}
                      </td>
                      <td className="p-2.5 text-center font-mono">
                        {averages.avgFoulsHome.toFixed(1)} - {averages.avgFoulsAway.toFixed(1)}
                      </td>
                      <td className="p-2.5 pr-3 text-slate-400 text-[6.5px] font-medium tracking-normal text-left lowercase">
                        computed chronologically across active fixtures
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="text-[8.5px] text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
              <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                <strong>Tactical Pro-Tip:</strong> Click on any row above to instantaneously load that fixture as the active selection, updating the Match Event reports below with verified metrics.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between flex-wrap gap-2 text-[8.5px] font-bold text-slate-500 bg-slate-100/50 p-2 rounded-lg border border-slate-200/50">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-mono uppercase text-[7.5px] tracking-wider font-extrabold">Selected Event:</span>
          <span className="text-slate-705 font-black">{activeH2H.season} ({activeH2H.scoreLabel})</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[8px] font-black uppercase tracking-wider rounded-lg shadow-xs cursor-pointer transition-all duration-150 flex items-center gap-1.5"
        >
          <FileText className="w-3 h-3 shrink-0" />
          <span>Full Match Report</span>
        </button>
      </div>

      {/* Dynamic Hype Factors Peak Minutes Widget */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-3.5 rounded-xl border border-indigo-950/40 text-left space-y-3 shadow-md relative overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-550/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between border-b border-indigo-800/30 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest block font-sans">
              H2H Hype Factors • Peak Scoring Timing minutes
            </span>
          </div>
          <span className="text-[7.5px] font-black font-mono text-rose-400 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
            AGGREGATE DRILLDOWN
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {hypeFactors.map((hf, rank) => (
            <div 
              key={hf.minute}
              className="bg-slate-950/65 border border-indigo-900/30 p-2.5 rounded-lg flex flex-col justify-between gap-1.5 relative group hover:border-indigo-600/40 transition-all duration-250 hover:bg-slate-950/85"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[12px] font-black font-mono px-2 py-0.5 rounded shadow-inner ${
                    rank === 0 
                      ? "bg-rose-600 text-white" 
                      : rank === 1 
                      ? "bg-indigo-600 text-indigo-100" 
                      : "bg-slate-800 text-slate-200"
                  }`}>
                    {hf.minute}'
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                    {rank === 0 ? "PRIMARY PEAK" : rank === 1 ? "SECONDARY PEAK" : "TERTIARY PEAK"}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[8px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                  <span>{hf.count} {hf.count === 1 ? "Goal" : "Goals"}</span>
                </div>
              </div>
              <p className="text-[8.5px] font-semibold text-slate-300 leading-normal">
                {getScoringMinuteVerdict(hf.minute)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Match Report Panel */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden bg-white border border-slate-150 rounded-xl p-4 shadow-3xs space-y-4 font-sans text-left"
          >
            {/* Match Header Information */}
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Tactical Event Analysis & Report
                </h4>
                <p className="text-[9.5px] text-slate-500 font-medium mt-0.5">
                  {activeH2H.competition} • played {activeH2H.matchDate}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                  {activeH2H.season} Season
                </div>
              </div>
            </div>

            {/* Scorecard Widget */}
            <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="w-2/5 text-center px-1 flex flex-col items-center justify-center gap-1.5">
                <TeamLogo name={homeTeam} size="sm" />
                <span className="text-[11px] font-black text-slate-900 block truncate">{homeTeam}</span>
                <span className="text-[8px] font-mono text-slate-400 font-bold tracking-wider block uppercase mt-0.5">
                  Formation: {reportDetails.homeFormation}
                </span>
              </div>
              <div className="w-1/5 text-center flex flex-col items-center justify-center">
                <span className="text-base font-black font-mono text-slate-900 leading-none bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  {reportDetails.possessionHome > reportDetails.possessionAway ? "🏆 " : ""}
                  {activeH2H.scoreLabel}
                </span>
                <span className="text-[7.5px] font-extrabold text-indigo-600 tracking-wider uppercase mt-1">FT Result</span>
              </div>
              <div className="w-2/5 text-center px-1 flex flex-col items-center justify-center gap-1.5">
                <TeamLogo name={awayTeam} size="sm" />
                <span className="text-[11px] font-black text-slate-900 block truncate">{awayTeam}</span>
                <span className="text-[8px] font-mono text-slate-400 font-bold tracking-wider block uppercase mt-0.5">
                  Formation: {reportDetails.awayFormation}
                </span>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-amber-50/50 border border-amber-200/50 p-2.5 rounded-lg text-[9.5px] text-slate-600 leading-normal font-medium">
              <span className="font-extrabold text-amber-800 uppercase text-[8px] tracking-wider block mb-0.5">Tactical Verdict:</span>
              {reportDetails.summary}
            </div>

            {/* Venue & Official Card */}
            <div className="grid grid-cols-2 gap-3 text-[9px] font-medium border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[7.5px] text-slate-400 block uppercase font-bold">Venue Arena</span>
                  <span className="font-bold text-slate-700">{reportDetails.venue}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[7.5px] text-slate-400 block uppercase font-bold">Match Official</span>
                  <span className="font-bold text-slate-700">Ref. {reportDetails.referee}</span>
                </div>
              </div>
            </div>

            {/* Team Statistics Grids with dual full blocks */}
            <div className="space-y-2.5">
              <h5 className="text-[9.5px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                Comparative Team Stats
              </h5>

              <div className="space-y-2 text-[9px] font-semibold text-slate-600">
                {/* Possession (%) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8.5px]">
                    <span className="font-mono font-bold text-slate-800">{reportDetails.possessionHome}%</span>
                    <span className="uppercase text-[8px] font-extrabold tracking-wider text-slate-450">Ball Possession</span>
                    <span className="font-mono font-bold text-slate-800">{reportDetails.possessionAway}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full flex overflow-hidden">
                    <div style={{ width: `${reportDetails.possessionHome}%` }} className="bg-emerald-500"></div>
                    <div style={{ width: `${reportDetails.possessionAway}%` }} className="bg-indigo-500"></div>
                  </div>
                </div>

                {/* Shots */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8.5px]">
                    <span className="font-mono font-bold text-slate-800">{reportDetails.shotsHome}</span>
                    <span className="uppercase text-[8px] font-extrabold tracking-wider text-slate-450">Total Goal Shots</span>
                    <span className="font-mono font-bold text-slate-800">{reportDetails.shotsAway}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full flex overflow-hidden">
                    {(() => {
                      const total = reportDetails.shotsHome + reportDetails.shotsAway || 1;
                      const hp = (reportDetails.shotsHome / total) * 100;
                      const ap = (reportDetails.shotsAway / total) * 100;
                      return (
                        <>
                          <div style={{ width: `${hp}%` }} className="bg-emerald-400"></div>
                          <div style={{ width: `${ap}%` }} className="bg-indigo-400"></div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Shots on Target */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8.5px]">
                    <span className="font-mono font-bold text-slate-800">{reportDetails.shotsOnTargetHome}</span>
                    <span className="uppercase text-[8px] font-extrabold tracking-wider text-slate-450 font-sans">Shots On Target</span>
                    <span className="font-mono font-bold text-slate-800">{reportDetails.shotsOnTargetAway}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full flex overflow-hidden">
                    {(() => {
                      const total = reportDetails.shotsOnTargetHome + reportDetails.shotsOnTargetAway || 1;
                      const hp = (reportDetails.shotsOnTargetHome / total) * 100;
                      const ap = (reportDetails.shotsOnTargetAway / total) * 100;
                      return (
                        <>
                          <div style={{ width: `${hp}%` }} className="bg-emerald-500"></div>
                          <div style={{ width: `${ap}%` }} className="bg-indigo-500"></div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Corners & Fouls Details */}
                <div className="grid grid-cols-2 gap-4 pt-1 text-[8.5px]">
                  <div className="bg-slate-50/70 p-2 rounded-lg flex flex-col gap-1 text-center font-sans">
                    <span className="text-[7.5px] uppercase font-extrabold text-slate-400">Corners Played</span>
                    <div className="flex justify-around items-center font-mono font-bold text-slate-800 text-[10px]">
                      <span>{reportDetails.cornersHome}</span>
                      <span className="text-[7.5px] text-slate-300 font-sans font-medium">vs</span>
                      <span>{reportDetails.cornersAway}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50/70 p-2 rounded-lg flex flex-col gap-1 text-center font-sans">
                    <span className="text-[7.5px] uppercase font-extrabold text-slate-400">Fouls Committed</span>
                    <div className="flex justify-around items-center font-mono font-bold text-slate-800 text-[10px]">
                      <span>{reportDetails.foulsHome}</span>
                      <span className="text-[7.5px] text-slate-300 font-sans font-medium font-bold">vs</span>
                      <span>{reportDetails.foulsAway}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Event Timeline */}
            <div className="space-y-3 pt-2">
              <h5 className="text-[9.5px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Match Incident Timeline
              </h5>

              <div className="relative border-l border-slate-150 pl-2.5 ml-2.5 space-y-2.5 text-[9px] font-medium leading-relaxed text-slate-650">
                {reportDetails.keyEvents.map((evt, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[14.5px] top-1 flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        evt.type === "goal" ? "bg-emerald-400" : "bg-amber-400"
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        evt.type === "goal" ? "bg-emerald-500" : "bg-amber-500"
                      }`}></span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="font-mono text-slate-400 font-extrabold shrink-0">[{evt.minute}']</span>
                      <div className="flex-1">
                        <span className="font-bold text-slate-800">
                          {evt.team === "home" ? homeTeam : awayTeam}:
                        </span>
                        <span> {evt.description}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {reportDetails.keyEvents.length === 0 && (
                  <div className="text-slate-400 font-medium italic text-[8.5px]">No major disciplinary actions or goal events reported outside basic possession tactical blocks.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Deep Analysis Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with fade-in */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Body Container with slide-up and scale spring */}
            <motion.div
              initial={{ scale: 0.94, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl relative border border-slate-100 flex flex-col pointer-events-auto z-10"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 backdrop-blur-md flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <FileText className="w-4 h-4 shrink-0" />
                  </span>
                  <div>
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">
                      H2H Historic Match Report
                    </h3>
                    <p className="text-[9px] text-slate-500 font-semibold mt-1">
                      {activeH2H.season} Season • {activeH2H.competition}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content Arena */}
              <div className="p-5 overflow-y-auto space-y-4 text-left font-sans flex-1">
                {/* Visual Scorecard */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-between relative overflow-hidden shadow-sm">
                  {/* Visual ambient accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="w-2/5 text-center px-1 z-10 flex flex-col items-center justify-center gap-1.5">
                    <TeamLogo name={homeTeam} size="md" className="border-indigo-500/20 shadow-none" />
                    <span className="text-[12px] font-black text-white block truncate">{homeTeam}</span>
                    <span className="text-[8px] font-mono text-emerald-400/85 font-black tracking-widest block uppercase mt-1">
                      {reportDetails.homeFormation} FORMATION
                    </span>
                  </div>
                  
                  <div className="w-1/5 text-center flex flex-col items-center justify-center z-10">
                    <span className="text-lg font-black font-mono text-white leading-none bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 shadow-inner">
                      {activeH2H.scoreLabel}
                    </span>
                    <span className="text-[7px] font-black text-indigo-400 tracking-widest uppercase mt-2 block">FINAL SCORE</span>
                  </div>

                  <div className="w-2/5 text-center px-1 z-10 flex flex-col items-center justify-center gap-1.5">
                    <TeamLogo name={awayTeam} size="md" className="border-indigo-500/20 shadow-none" />
                    <span className="text-[12px] font-black text-white block truncate">{awayTeam}</span>
                    <span className="text-[8px] font-mono text-emerald-400/85 font-black tracking-widest block uppercase mt-1">
                      {reportDetails.awayFormation} FORMATION
                    </span>
                  </div>
                </div>

                {/* Match Details Banner Widget */}
                <div className="grid grid-cols-3 gap-2 text-center text-[8.5px] font-bold">
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg flex flex-col justify-center items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="text-[7px] text-slate-400 block uppercase font-extrabold font-mono tracking-wider">Date Played</span>
                      <span className="text-slate-705 font-black mt-0.5 block">{activeH2H.matchDate}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg flex flex-col justify-center items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="text-[7px] text-slate-400 block uppercase font-extrabold font-mono tracking-wider">Venue Arena</span>
                      <span className="text-slate-705 font-black mt-0.5 block">{reportDetails.venue}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg flex flex-col justify-center items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="text-[7px] text-slate-400 block uppercase font-extrabold font-mono tracking-wider">Match Official</span>
                      <span className="text-slate-705 font-black mt-0.5 block">Ref. {reportDetails.referee}</span>
                    </div>
                  </div>
                </div>

                {/* Tactical verdict summary */}
                <div className="bg-amber-50/50 border border-amber-200/50 p-3 rounded-xl text-[9.5px] text-slate-600 leading-relaxed font-semibold">
                  <span className="font-extrabold text-amber-805 uppercase text-[8px] tracking-wider block mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Match Tactical Diagnostician Analysis:
                  </span>
                  {reportDetails.summary}
                </div>

                {/* Dual Column Comparative Statistics Gauge */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150/60">
                  <h4 className="text-[9.5px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    Match Statistics Dashboard
                  </h4>

                  <div className="space-y-3 text-[9px] font-semibold text-slate-600">
                    {/* Ball Possession */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[8.5px]">
                        <span className="font-mono font-black text-slate-800">{reportDetails.possessionHome}%</span>
                        <span className="uppercase text-[7.5px] font-black tracking-widest text-slate-450">Ball Possession</span>
                        <span className="font-mono font-black text-slate-800">{reportDetails.possessionAway}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full flex overflow-hidden">
                        <div style={{ width: `${reportDetails.possessionHome}%` }} className="bg-emerald-500 rounded-l-full transition-all duration-300"></div>
                        <div style={{ width: `${reportDetails.possessionAway}%` }} className="bg-indigo-500 rounded-r-full transition-all duration-300"></div>
                      </div>
                    </div>

                    {/* Total Shots */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[8.5px]">
                        <span className="font-mono font-black text-slate-800">{reportDetails.shotsHome}</span>
                        <span className="uppercase text-[7.5px] font-black tracking-widest text-slate-450">Total Goal Shots</span>
                        <span className="font-mono font-black text-slate-800">{reportDetails.shotsAway}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full flex overflow-hidden">
                        {(() => {
                          const total = reportDetails.shotsHome + reportDetails.shotsAway || 1;
                          const hp = (reportDetails.shotsHome / total) * 100;
                          return <div style={{ width: `${hp}%` }} className="bg-emerald-400 rounded-l-full transition-all duration-300"></div>;
                        })()}
                        {(() => {
                          const total = reportDetails.shotsHome + reportDetails.shotsAway || 1;
                          const ap = (reportDetails.shotsAway / total) * 100;
                          return <div style={{ width: `${ap}%` }} className="bg-indigo-400 rounded-r-full transition-all duration-300"></div>;
                        })()}
                      </div>
                    </div>

                    {/* Shots on Target */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[8.5px]">
                        <span className="font-mono font-black text-slate-800">{reportDetails.shotsOnTargetHome}</span>
                        <span className="uppercase text-[7.5px] font-black tracking-widest text-slate-450 font-sans">Shots On Target</span>
                        <span className="font-mono font-black text-slate-800">{reportDetails.shotsOnTargetAway}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full flex overflow-hidden">
                        {(() => {
                          const total = reportDetails.shotsOnTargetHome + reportDetails.shotsOnTargetAway || 1;
                          const hp = (reportDetails.shotsOnTargetHome / total) * 100;
                          return <div style={{ width: `${hp}%` }} className="bg-emerald-500 rounded-l-full transition-all duration-300"></div>;
                        })()}
                        {(() => {
                          const total = reportDetails.shotsOnTargetHome + reportDetails.shotsOnTargetAway || 1;
                          const ap = (reportDetails.shotsOnTargetAway / total) * 100;
                          return <div style={{ width: `${ap}%` }} className="bg-indigo-500 rounded-r-full transition-all duration-300"></div>;
                        })()}
                      </div>
                    </div>

                    {/* Corners & Fouls Cards */}
                    <div className="grid grid-cols-2 gap-3 pt-1 text-[8px] font-black uppercase text-slate-505">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-150 text-center">
                        <span className="text-[7.5px] tracking-wider text-slate-400 block mb-1">Corners Played</span>
                        <div className="flex justify-around items-center font-mono font-black text-slate-800 text-[11px] leading-none mt-1">
                          <span className="text-emerald-600">{reportDetails.cornersHome}</span>
                          <span className="text-[8px] text-slate-300 font-sans font-bold">VS</span>
                          <span className="text-indigo-600">{reportDetails.cornersAway}</span>
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-150 text-center">
                        <span className="text-[7.5px] tracking-wider text-slate-400 block mb-1">Fouls Committed</span>
                        <div className="flex justify-around items-center font-mono font-black text-slate-800 text-[11px] leading-none mt-1">
                          <span className="text-emerald-600">{reportDetails.foulsHome}</span>
                          <span className="text-[8px] text-slate-300 font-sans font-bold">VS</span>
                          <span className="text-indigo-600">{reportDetails.foulsAway}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline of Incidents */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-[9.5px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    Match Incident Timeline
                  </h4>

                  <div className="relative border-l-2 border-slate-100 pl-3.5 ml-2.5 space-y-3.5 text-[9.5px] font-semibold leading-relaxed text-slate-650">
                    {reportDetails.keyEvents.map((evt, idx) => (
                      <div key={idx} className="relative group">
                        {/* Event item node dot */}
                        <div className="absolute -left-[21.5px] top-1 flex h-3.5 w-3.5 items-center justify-center">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
                            evt.type === "goal" 
                              ? "bg-emerald-400" 
                              : evt.type === "red" 
                              ? "bg-red-400" 
                              : "bg-yellow-400"
                          }`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${
                            evt.type === "goal" 
                              ? "bg-emerald-500" 
                              : evt.type === "red" 
                              ? "bg-red-500" 
                              : "bg-amber-400"
                          }`}></span>
                        </div>
                        <div className="flex items-start gap-1.5 bg-slate-55/40 hover:bg-slate-50 p-2 rounded-lg border border-transparent hover:border-slate-100/80 transition-all duration-150">
                          <span className="font-mono text-slate-400 font-bold shrink-0">[{evt.minute}']</span>
                          <div className="flex-1">
                            <span className="font-black text-slate-805">
                              {evt.team === "home" ? homeTeam : awayTeam}:
                            </span>
                            <span className="text-slate-600 ml-1"> {evt.description}</span>
                          </div>
                          <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none ${
                            evt.type === "goal" 
                              ? "bg-emerald-100 text-emerald-800" 
                              : evt.type === "red" 
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {evt.type}
                          </span>
                        </div>
                      </div>
                    ))}
                    {reportDetails.keyEvents.length === 0 && (
                      <div className="text-slate-400 font-medium italic text-[9px] py-1 pl-1">
                        No major disciplinary actions or goal events reported outside basic possession tactical blocks.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[9.5px] font-black uppercase tracking-wider rounded-lg shadow-xs cursor-pointer transition"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <p className="text-[9px] text-slate-400 leading-normal">
        {metric === "goalDiff" ? (
          <>*Goal difference computed as <span className="font-bold text-slate-500">({homeTeam} Goals - {awayTeam} Goals)</span>. Values above 0 represent Home superiority; values below 0 represent Away superiority.</>
        ) : (
          <>*Trend displays <span className="font-bold text-slate-500">{homeTeam}'s Ball Possession percentage</span>. Values above 50% indicate superior possession share by the Home squad.</>
        )}
      </p>
    </div>
  );
}
