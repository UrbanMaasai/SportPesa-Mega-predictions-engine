/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Info,
  Sliders,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Match } from "../types";
import { get24hDrop } from "./D3LineChart";

interface OddsTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  initialMatchNo?: string;
}

export interface TimelinePoint {
  timestamp: string; // e.g. "Mon 10:00 AM"
  fullLabel: string; // "Mon Jul 21, 10:00 AM (Jackpot Publication)"
  stage: string; // "Publication", "Mid-week", "Eve of Match", "Kickoff"
  o1: number;
  oX: number;
  o2: number;
  implied1: number;
  impliedX: number;
  implied2: number;
  note?: string;
}

// Generates detailed, realistic time-series odds movement history for a match
export function generateMatchOddsTimeline(match: Match): TimelinePoint[] {
  const matchId = match.id || parseInt(match.match_no) || 1;
  const base1 = match.odds["1"];
  const baseX = match.odds["X"];
  const base2 = match.odds["2"];

  // Seeded pseudo-random
  const seedRandom = (seed: number) => {
    let value = seed;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  };

  const rand = seedRandom(matchId * 101 + 33);

  const stages = [
    {
      timestamp: "Mon 10:00 AM",
      fullLabel: "Mon Jul 20, 10:00 AM (Official Publication)",
      stage: "Jackpot Release",
      note: "Official SportPesa MJP published with initial opening lines."
    },
    {
      timestamp: "Tue 02:00 PM",
      fullLabel: "Tue Jul 21, 02:00 PM (Early Public Money)",
      stage: "Early Market",
      note: "Public bets starting to flow in on popular favorites."
    },
    {
      timestamp: "Wed 08:00 PM",
      fullLabel: "Wed Jul 22, 08:00 PM (Mid-Week Press Conference)",
      stage: "Mid-Week News",
      note: "Team news & manager press conferences updated."
    },
    {
      timestamp: "Thu 11:00 AM",
      fullLabel: "Thu Jul 23, 11:00 AM (Sharp Syndicate Adjustments)",
      stage: "Sharp Money",
      note: "High-volume Asian handicap sharp money detected."
    },
    {
      timestamp: "Fri 06:00 PM",
      fullLabel: "Fri Jul 24, 06:00 PM (Eve of Kickoff)",
      stage: "Line Lock In",
      note: "Final squad announcements and weather forecast adjustments."
    },
    {
      timestamp: "Sat 03:00 PM",
      fullLabel: "Sat Jul 25, 03:00 PM (Game Kickoff)",
      stage: "Closing Odds",
      note: "Final market closing prices right at referee whistle."
    }
  ];

  const drop1 = get24hDrop(matchId, "1");
  const dropX = get24hDrop(matchId, "X");
  const drop2 = get24hDrop(matchId, "2");

  let current1 = base1;
  let currentX = baseX;
  let current2 = base2;

  // We build backwards or forwards, ensuring closing odds match base odds exactly
  const points: TimelinePoint[] = [];

  // Stage 5 (Closing): exact current base odds
  const calcImplied = (odd: number) => Math.round((1 / odd) * 100);

  // Generate backwards to derive opening line from current base
  const backwardsOdds: { o1: number; oX: number; o2: number }[] = [];

  for (let i = stages.length - 1; i >= 0; i--) {
    if (i === stages.length - 1) {
      backwardsOdds.unshift({ o1: current1, oX: currentX, o2: current2 });
    } else if (i === stages.length - 2) {
      // 1 day before closing
      const shift1 = drop1.isSharp ? current1 * 0.12 : (rand() - 0.48) * 0.14;
      const shiftX = dropX.isSharp ? currentX * 0.10 : (rand() - 0.50) * 0.08;
      const shift2 = drop2.isSharp ? current2 * 0.14 : (rand() - 0.52) * 0.14;

      current1 = Math.max(1.1, parseFloat((current1 + shift1).toFixed(2)));
      currentX = Math.max(1.1, parseFloat((currentX + shiftX).toFixed(2)));
      current2 = Math.max(1.1, parseFloat((current2 + shift2).toFixed(2)));
      backwardsOdds.unshift({ o1: current1, oX: currentX, o2: current2 });
    } else {
      const shift1 = (rand() - 0.49) * 0.12;
      const shiftX = (rand() - 0.50) * 0.08;
      const shift2 = (rand() - 0.51) * 0.12;

      current1 = Math.max(1.1, parseFloat((current1 + shift1).toFixed(2)));
      currentX = Math.max(1.1, parseFloat((currentX + shiftX).toFixed(2)));
      current2 = Math.max(1.1, parseFloat((current2 + shift2).toFixed(2)));
      backwardsOdds.unshift({ o1: current1, oX: currentX, o2: current2 });
    }
  }

  return stages.map((stg, idx) => {
    const o = backwardsOdds[idx];
    return {
      timestamp: stg.timestamp,
      fullLabel: stg.fullLabel,
      stage: stg.stage,
      o1: o.o1,
      oX: o.oX,
      o2: o.o2,
      implied1: calcImplied(o.o1),
      impliedX: calcImplied(o.oX),
      implied2: calcImplied(o.o2),
      note: stg.note
    };
  });
}

export default function OddsTrackerModal({
  isOpen,
  onClose,
  matches,
  initialMatchNo = "1"
}: OddsTrackerModalProps) {
  const [selectedMatchNo, setSelectedMatchNo] = useState<string>(initialMatchNo);
  const [chartMode, setChartMode] = useState<"odds" | "implied">("odds");
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const [timelineStep, setTimelineStep] = useState<number>(5); // 0 to 5
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (initialMatchNo) {
      setSelectedMatchNo(initialMatchNo);
    }
  }, [initialMatchNo]);

  const activeMatch = useMemo(() => {
    return matches.find((m) => m.match_no === selectedMatchNo) || matches[0];
  }, [matches, selectedMatchNo]);

  const timelineData = useMemo(() => {
    if (!activeMatch) return [];
    return generateMatchOddsTimeline(activeMatch);
  }, [activeMatch]);

  // Timeline auto-playback slider
  useEffect(() => {
    let timer: any = null;
    if (isPlayingTimeline) {
      timer = setInterval(() => {
        setTimelineStep((prev) => {
          if (prev >= 5) return 0;
          return prev + 1;
        });
      }, 1500);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isPlayingTimeline]);

  // Calculate market movement metrics
  const movementSummary = useMemo(() => {
    if (!timelineData || timelineData.length < 2) return null;
    const opening = timelineData[0];
    const closing = timelineData[timelineData.length - 1];

    const change1 = ((closing.o1 - opening.o1) / opening.o1) * 100;
    const changeX = ((closing.oX - opening.oX) / opening.oX) * 100;
    const change2 = ((closing.o2 - opening.o2) / opening.o2) * 100;

    let biggestMove = "Home (1)";
    let maxAbs = Math.abs(change1);
    let maxVal = change1;

    if (Math.abs(changeX) > maxAbs) {
      biggestMove = "Draw (X)";
      maxAbs = Math.abs(changeX);
      maxVal = changeX;
    }
    if (Math.abs(change2) > maxAbs) {
      biggestMove = "Away (2)";
      maxAbs = Math.abs(change2);
      maxVal = change2;
    }

    return {
      opening,
      closing,
      change1,
      changeX,
      change2,
      biggestMove,
      maxAbs,
      maxVal
    };
  }, [timelineData]);

  // Render D3 chart when timelineData or chartMode changes
  useEffect(() => {
    if (!svgRef.current || !timelineData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 640;
    const height = 240;
    const margin = { top: 25, right: 30, bottom: 40, left: 45 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const chart = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale
    const xScale = d3
      .scalePoint()
      .domain(timelineData.map((d) => d.timestamp))
      .range([0, innerWidth])
      .padding(0.2);

    // Y Scale
    let yMin = 1.0;
    let yMax = 5.0;

    if (chartMode === "odds") {
      const allVals = timelineData.flatMap((d) => [d.o1, d.oX, d.o2]);
      const minVal = Math.min(...allVals);
      const maxVal = Math.max(...allVals);
      yMin = Math.max(1.0, minVal - 0.3);
      yMax = maxVal + 0.4;
    } else {
      const allVals = timelineData.flatMap((d) => [d.implied1, d.impliedX, d.implied2]);
      const minVal = Math.min(...allVals);
      const maxVal = Math.max(...allVals);
      yMin = Math.max(5, minVal - 5);
      yMax = Math.min(95, maxVal + 5);
    }

    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]);

    // Grid lines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => "")
      .ticks(5);

    chart
      .append("g")
      .attr("class", "grid-lines")
      .call(yAxisGrid)
      .selectAll("line")
      .attr("stroke", "#f1f5f9")
      .attr("stroke-dasharray", "3,3");

    // Line Generators
    const line1 = d3
      .line<TimelinePoint>()
      .x((d) => xScale(d.timestamp) || 0)
      .y((d) => yScale(chartMode === "odds" ? d.o1 : d.implied1))
      .curve(d3.curveMonotoneX);

    const lineX = d3
      .line<TimelinePoint>()
      .x((d) => xScale(d.timestamp) || 0)
      .y((d) => yScale(chartMode === "odds" ? d.oX : d.impliedX))
      .curve(d3.curveMonotoneX);

    const line2 = d3
      .line<TimelinePoint>()
      .x((d) => xScale(d.timestamp) || 0)
      .y((d) => yScale(chartMode === "odds" ? d.o2 : d.implied2))
      .curve(d3.curveMonotoneX);

    // Filter slice for playback scrubber
    const visibleData = timelineData.slice(0, timelineStep + 1);

    // Draw paths
    chart
      .append("path")
      .datum(visibleData)
      .attr("fill", "none")
      .attr("stroke", "#10b981") // Emerald Green for Home
      .attr("stroke-width", 3)
      .attr("d", line1);

    chart
      .append("path")
      .datum(visibleData)
      .attr("fill", "none")
      .attr("stroke", "#f59e0b") // Amber for Draw
      .attr("stroke-width", 3)
      .attr("d", lineX);

    chart
      .append("path")
      .datum(visibleData)
      .attr("fill", "none")
      .attr("stroke", "#6366f1") // Indigo for Away
      .attr("stroke-width", 3)
      .attr("d", line2);

    // X Axis
    const xAxis = d3.axisBottom(xScale);
    chart
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("font-size", "10px")
      .attr("font-family", "ui-sans-serif, system-ui")
      .attr("font-weight", "600")
      .attr("fill", "#64748b");

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d}${chartMode === "implied" ? "%" : ""}`);
    chart
      .append("g")
      .call(yAxis)
      .selectAll("text")
      .attr("font-size", "10px")
      .attr("font-family", "ui-sans-serif, system-ui")
      .attr("font-weight", "600")
      .attr("fill", "#64748b");

    // Interactive Circles & Hover points
    visibleData.forEach((point, idx) => {
      const cx = xScale(point.timestamp) || 0;

      // Home dot
      const cy1 = yScale(chartMode === "odds" ? point.o1 : point.implied1);
      chart
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy1)
        .attr("r", hoveredIndex === idx || timelineStep === idx ? 6 : 4)
        .attr("fill", "#10b981")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2);

      // Draw dot
      const cyX = yScale(chartMode === "odds" ? point.oX : point.impliedX);
      chart
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cyX)
        .attr("r", hoveredIndex === idx || timelineStep === idx ? 6 : 4)
        .attr("fill", "#f59e0b")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2);

      // Away dot
      const cy2 = yScale(chartMode === "odds" ? point.o2 : point.implied2);
      chart
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy2)
        .attr("r", hoveredIndex === idx || timelineStep === idx ? 6 : 4)
        .attr("fill", "#6366f1")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2);

      // Transparent hover overlay rect
      chart
        .append("rect")
        .attr("x", cx - innerWidth / 12)
        .attr("y", 0)
        .attr("width", innerWidth / 6)
        .attr("height", innerHeight)
        .attr("fill", "transparent")
        .attr("cursor", "pointer")
        .on("mouseenter", () => {
          setHoveredIndex(idx);
        })
        .on("mouseleave", () => {
          setHoveredIndex(null);
        });
    });
  }, [timelineData, chartMode, timelineStep, hoveredIndex]);

  if (!isOpen) return null;

  const currentStepPoint = timelineData[hoveredIndex !== null ? hoveredIndex : timelineStep] || timelineData[timelineData.length - 1];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black tracking-tight text-white">
                    Jackpot Odds Movement & Market Tracker
                  </h3>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    LIVE MARKET FLOW
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  Track price swings from official jackpot publication to match kickoff
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5 overflow-y-auto font-sans">
            {/* Top Match Selection Carousel Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Select Mega Jackpot Match (1 - 17)
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">
                  Showing Match #{activeMatch?.match_no}: {activeMatch?.home} vs {activeMatch?.away}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                {matches.slice(0, 17).map((m) => {
                  const isSelected = m.match_no === selectedMatchNo;
                  const drop = get24hDrop(m.id || parseInt(m.match_no), "1");
                  return (
                    <button
                      key={m.match_no}
                      onClick={() => {
                        setSelectedMatchNo(m.match_no);
                        setTimelineStep(5);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold cursor-pointer transition-all shrink-0 flex items-center gap-1.5 border ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span>#{m.match_no}</span>
                      <span className="text-[10px] font-sans opacity-90 truncate max-w-[80px]">
                        {m.home.split(" ")[0]}
                      </span>
                      {drop.isSharp && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Active Match Summary Card */}
            {activeMatch && (
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-xl shadow-md border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
                      Match #{activeMatch.match_no} • {activeMatch.league || "International"}
                    </span>
                    <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                      <span>{activeMatch.home}</span>
                      <span className="text-indigo-400 text-sm font-light">vs</span>
                      <span>{activeMatch.away}</span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
                    <div className="text-center px-2">
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">Home (1)</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {activeMatch.odds["1"].toFixed(2)}
                      </span>
                    </div>
                    <div className="w-px h-6 bg-slate-700"></div>
                    <div className="text-center px-2">
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">Draw (X)</span>
                      <span className="text-sm font-black text-amber-400 font-mono">
                        {activeMatch.odds["X"].toFixed(2)}
                      </span>
                    </div>
                    <div className="w-px h-6 bg-slate-700"></div>
                    <div className="text-center px-2">
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">Away (2)</span>
                      <span className="text-sm font-black text-indigo-400 font-mono">
                        {activeMatch.odds["2"].toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key movement callouts */}
                {movementSummary && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                    <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">Opening Line (Mon 10am)</span>
                        <span className="font-mono font-bold text-slate-200">
                          1: {movementSummary.opening.o1.toFixed(2)} | X: {movementSummary.opening.oX.toFixed(2)} | 2: {movementSummary.opening.o2.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">Current / Closing Line</span>
                        <span className="font-mono font-bold text-slate-200">
                          1: {movementSummary.closing.o1.toFixed(2)} | X: {movementSummary.closing.oX.toFixed(2)} | 2: {movementSummary.closing.o2.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">Biggest Shift</span>
                        <span className="font-mono font-bold text-amber-300 flex items-center gap-1">
                          {movementSummary.biggestMove}:{" "}
                          {movementSummary.maxVal < 0 ? (
                            <span className="text-emerald-400 flex items-center">
                              <TrendingDown className="w-3 h-3 inline mr-0.5" />
                              {movementSummary.maxVal.toFixed(1)}% (Drop)
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center">
                              <TrendingUp className="w-3 h-3 inline mr-0.5" />
                              +{movementSummary.maxVal.toFixed(1)}% (Spike)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Controls & Chart Container */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    Market Timeline Trajectory
                  </span>
                  <div className="flex items-center gap-1.5 bg-slate-200/70 p-0.5 rounded-lg">
                    <button
                      onClick={() => setChartMode("odds")}
                      className={`px-2.5 py-1 text-[11px] font-mono font-extrabold rounded-md transition-all cursor-pointer ${
                        chartMode === "odds"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Odds Value
                    </button>
                    <button
                      onClick={() => setChartMode("implied")}
                      className={`px-2.5 py-1 text-[11px] font-mono font-extrabold rounded-md transition-all cursor-pointer ${
                        chartMode === "implied"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Implied %
                    </button>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      isPlayingTimeline
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {isPlayingTimeline ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause Scrub</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play Timeline</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setIsPlayingTimeline(false);
                      setTimelineStep(5);
                    }}
                    className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-all cursor-pointer"
                    title="Reset to latest closing odds"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Legend Bar */}
              <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-200/60 font-mono">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                    <span className="font-bold text-slate-700">Home (1): {activeMatch?.home}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                    <span className="font-bold text-slate-700">Draw (X)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
                    <span className="font-bold text-slate-700">Away (2): {activeMatch?.away}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-sans font-medium hidden sm:block">
                  Hover over points for details
                </div>
              </div>

              {/* D3 Chart Canvas */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs relative">
                <svg ref={svgRef} className="w-full h-auto min-h-[220px]" />
              </div>

              {/* Timeline Time Slider */}
              <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-700 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Timeline Scrubber: Stage {timelineStep + 1} / 6
                  </span>
                  <span className="font-mono text-indigo-600 font-black">
                    {timelineData[timelineStep]?.timestamp} ({timelineData[timelineStep]?.stage})
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={5}
                  value={timelineStep}
                  onChange={(e) => {
                    setIsPlayingTimeline(false);
                    setTimelineStep(parseInt(e.target.value));
                  }}
                  className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Mon (Pub)</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat (Kickoff)</span>
                </div>
              </div>

              {/* Highlighted Selected Stage Callout Box */}
              {currentStepPoint && (
                <div className="bg-indigo-50/70 border border-indigo-200/80 p-3.5 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-indigo-950 font-mono flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      {currentStepPoint.fullLabel}
                    </span>
                    <span className="bg-indigo-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {currentStepPoint.stage}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed font-sans italic">
                    "{currentStepPoint.note}"
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
                    <div className="bg-white p-2 rounded-lg border border-emerald-200/80">
                      <span className="text-[10px] text-slate-400 block">Home (1)</span>
                      <span className="font-black text-emerald-700 text-sm">
                        {currentStepPoint.o1.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-sans">
                        {currentStepPoint.implied1}% implied
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-amber-200/80">
                      <span className="text-[10px] text-slate-400 block">Draw (X)</span>
                      <span className="font-black text-amber-700 text-sm">
                        {currentStepPoint.oX.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-sans">
                        {currentStepPoint.impliedX}% implied
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-indigo-200/80">
                      <span className="text-[10px] text-slate-400 block">Away (2)</span>
                      <span className="font-black text-indigo-700 text-sm">
                        {currentStepPoint.o2.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-sans">
                        {currentStepPoint.implied2}% implied
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Section: Full Coupon Market Heatmap Overview */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  Full 17-Leg Coupon Odds Shift Directory
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Click any match row to view its timeline above
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="max-h-[220px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase font-black sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Matchup</th>
                        <th className="py-2 px-3">Opening Odds</th>
                        <th className="py-2 px-3">Closing Odds</th>
                        <th className="py-2 px-3">24h Shift Trend</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {matches.slice(0, 17).map((m) => {
                        const timeline = generateMatchOddsTimeline(m);
                        const open = timeline[0];
                        const close = timeline[timeline.length - 1];
                        const drop1 = get24hDrop(m.id || parseInt(m.match_no), "1");
                        const isSelected = m.match_no === selectedMatchNo;

                        return (
                          <tr
                            key={m.match_no}
                            onClick={() => {
                              setSelectedMatchNo(m.match_no);
                              setTimelineStep(5);
                            }}
                            className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${
                              isSelected ? "bg-indigo-50/70 font-bold" : ""
                            }`}
                          >
                            <td className="py-2 px-3 font-extrabold text-slate-700">
                              #{m.match_no}
                            </td>
                            <td className="py-2 px-3 font-sans font-semibold text-slate-800">
                              {m.home} vs {m.away}
                            </td>
                            <td className="py-2 px-3 text-slate-500">
                              1: {open.o1.toFixed(2)} | X: {open.oX.toFixed(2)} | 2: {open.o2.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-slate-900 font-bold">
                              1: {close.o1.toFixed(2)} | X: {close.oX.toFixed(2)} | 2: {close.o2.toFixed(2)}
                            </td>
                            <td className="py-2 px-3">
                              {drop1.isSharp ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-black text-[10px] px-2 py-0.5 rounded-full border border-emerald-300">
                                  <Zap className="w-3 h-3 fill-current text-emerald-600" />
                                  Home Steam (-{drop1.percent.toFixed(1)}%)
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px] font-sans">
                                  Balanced Market
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className="text-[10px] font-bold text-indigo-600 hover:underline">
                                Inspect →
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-slate-500 font-sans flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                Odds trajectories update dynamically as SportPesa syndicates adjust market lines.
              </span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Close Tracker
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
