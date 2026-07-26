import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { motion } from "motion/react";

interface OddsPoint {
  day: string;
  "1": number;
  "X": number;
  "2": number;
}

interface D3LineChartProps {
  matchId: number;
  baseOdds: {
    "1": number;
    "X": number;
    "2": number;
  };
  matchNo: string;
}

// Helper to get sharp drops. Matching outcomes will show more than 10% drop in last 24h
export function get24hDrop(matchId: number, outcome: "1" | "X" | "2"): { percent: number; isSharp: boolean } {
  let percent = 0;
  if (matchId === 3 && outcome === "1") percent = 12.5;
  else if (matchId === 6 && outcome === "2") percent = 14.1;
  else if (matchId === 10 && outcome === "X") percent = 11.2;
  else if (matchId === 14 && outcome === "1") percent = 13.4;
  else {
    // Normal noise fluctuation (between -4% and +5%)
    const seed = (matchId * 13 + (outcome === "1" ? 3 : outcome === "X" ? 7 : 17)) % 100;
    percent = (seed % 10) - 4;
  }
  return {
    percent,
    isSharp: percent >= 10.0
  };
}

// Deterministic mock trendline builder to ensure consistent, stable trend per match id
function getHistoricalOddsTrend(matchId: number, baseOdds: { "1": number; "X": number; "2": number }): OddsPoint[] {
  const seedRandom = (seed: number) => {
    let value = seed;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  };

  const rand = seedRandom(matchId + 99);
  const days = ["5d ago", "4d ago", "3d ago", "2d ago", "1d ago", "Today"];
  const points: OddsPoint[] = [];

  let o1 = baseOdds["1"];
  let oX = baseOdds["X"];
  let o2 = baseOdds["2"];

  for (let i = days.length - 1; i >= 0; i--) {
    if (i === days.length - 1) {
      points.push({ day: days[i], "1": o1, "X": oX, "2": o2 });
    } else if (i === days.length - 2) { // 1d ago
      const d1 = get24hDrop(matchId, "1");
      const dX = get24hDrop(matchId, "X");
      const d2 = get24hDrop(matchId, "2");

      const y1 = d1.isSharp 
        ? parseFloat((baseOdds["1"] / (1 - d1.percent / 100)).toFixed(2)) 
        : Math.max(1.10, parseFloat((o1 + (rand() - 0.48) * 0.16).toFixed(2)));

      const yX = dX.isSharp 
        ? parseFloat((baseOdds["X"] / (1 - dX.percent / 100)).toFixed(2)) 
        : Math.max(1.10, parseFloat((oX + (rand() - 0.5) * 0.10).toFixed(2)));

      const y2 = d2.isSharp 
        ? parseFloat((baseOdds["2"] / (1 - d2.percent / 100)).toFixed(2)) 
        : Math.max(1.10, parseFloat((o2 + (rand() - 0.52) * 0.16).toFixed(2)));

      o1 = y1;
      oX = yX;
      o2 = y2;
      points.push({ day: days[i], "1": o1, "X": oX, "2": o2 });
    } else {
      // Deterministic fluctuation with smooth step walk
      const diff1 = (rand() - 0.48) * 0.16; // slight bias
      const diffX = (rand() - 0.5) * 0.10;
      const diff2 = (rand() - 0.52) * 0.16;

      o1 = Math.max(1.10, parseFloat((o1 + diff1).toFixed(2)));
      oX = Math.max(1.10, parseFloat((oX + diffX).toFixed(2)));
      o2 = Math.max(1.10, parseFloat((o2 + diff2).toFixed(2)));

      points.push({ day: days[i], "1": o1, "X": oX, "2": o2 });
    }
  }

  // Back to forward order
  return points.reverse();
}

export default function D3LineChart({ matchId, baseOdds, matchNo }: D3LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 160 });
  const [hoveredPoint, setHoveredPoint] = useState<OddsPoint | null>(null);

  // Responsive resizing observer
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      const height = Math.max(140, Math.min(180, width * 0.55));
      setDimensions({ width: width || 300, height });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const data = getHistoricalOddsTrend(matchId, baseOdds);

  useEffect(() => {
    if (!svgRef.current) return;

    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 15, right: 15, bottom: 25, left: 32 };
    const chartWidth = Math.max(50, width - margin.left - margin.right);
    const chartHeight = Math.max(50, height - margin.top - margin.bottom);

    // Main G Wrapper
    const g = svgElement
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X Scale
    const x = d3.scalePoint()
      .domain(data.map(d => d.day))
      .range([0, chartWidth])
      .padding(0.1);

    // Calculate dynamic range for Odds values
    const allVals = data.flatMap(d => [d["1"], d["X"], d["2"]]);
    const minVal = Math.max(1.0, d3.min(allVals)! - 0.3);
    const maxVal = d3.max(allVals)! + 0.3;

    // Y Scale
    const y = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([chartHeight, 0]);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .call(
        d3.axisLeft(y)
          .ticks(4)
          .tickSize(-chartWidth)
          .tickFormat(() => "")
      )
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line")
        .attr("stroke", "#f1f5f9")
        .attr("stroke-dasharray", "2,2")
      );

    // X Axis
    g.append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => g.select(".domain").attr("stroke", "#e2e8f0").attr("stroke-width", 1))
      .selectAll("text")
      .attr("fill", "#64748b")
      .attr("font-size", "9px")
      .attr("dy", "8px");

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(y).ticks(4).tickFormat(d => `${d}`))
      .call(g => g.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .attr("font-size", "8.5px")
      .attr("font-family", "monospace");

    // Line Generators for 1, X, 2
    const keys: Array<"1" | "X" | "2"> = ["1", "X", "2"];
    const colors = {
      "1": "#10b981", // Emerald
      "X": "#64748b", // Slate
      "2": "#6366f1"  // Indigo
    };

    keys.forEach(key => {
      const lineGen = d3.line<OddsPoint>()
        .x(d => x(d.day) || 0)
        .y(d => y(d[key]))
        .curve(d3.curveMonotoneX); // Smooth curves

      // Add the line path to chart
      const path = g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", colors[key])
        .attr("stroke-width", 2)
        .attr("d", lineGen);

      // Dasharray loading effect for crisp animations
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(800)
        .ease(d3.easeQuadOut)
        .attr("stroke-dashoffset", 0);

      // Add dots at each data point
      const circles = g.selectAll(`.dot-${key}`)
        .data(data)
        .enter()
        .append("circle")
        .attr("class", `dot-${key}`)
        .attr("cx", d => x(d.day) || 0)
        .attr("cy", d => y(d[key]))
        .attr("r", 0) // start small
        .attr("fill", "#ffffff")
        .attr("stroke", colors[key])
        .attr("stroke-width", 1.8)
        .style("cursor", "pointer");

      circles.transition()
        .delay(400)
        .duration(400)
        .attr("r", 3.2);

      // Simple mouse behaviors
      circles.on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("r", 5);
        setHoveredPoint(d);
      }).on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("r", 3.2);
      });
    });

    // Vertical hover overlay line guide
    const guideLine = g.append("line")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 0.8)
      .attr("stroke-dasharray", "3,3")
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .style("opacity", 0);

    // Interactive overlay layer for smoother crosshair tracking
    g.append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mousemove", function (event) {
        const [mouseX] = d3.pointer(event);
        
        // Find nearest point
        const domain = data.map(d => d.day);
        let nearestDay = domain[0];
        let minDist = Infinity;

        domain.forEach(day => {
          const posX = x(day) || 0;
          const dist = Math.abs(mouseX - posX);
          if (dist < minDist) {
            minDist = dist;
            nearestDay = day;
          }
        });

        const nearestData = data.find(d => d.day === nearestDay);
        if (nearestData) {
          const posX = x(nearestDay) || 0;
          guideLine
            .attr("x1", posX)
            .attr("x2", posX)
            .style("opacity", 0.6);
          setHoveredPoint(nearestData);
        }
      })
      .on("mouseleave", function () {
        guideLine.style("opacity", 0);
        setHoveredPoint(null);
      });

  }, [dimensions, data]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
          Market Odds Trend (5d history)
        </span>
        <div className="flex gap-2.5 text-[8px] font-bold">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Home</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>Draw</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>Away</span>
        </div>
      </div>

      <motion.div
        ref={containerRef}
        key={matchNo}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full bg-white py-2.5 px-1.5 rounded-lg border border-slate-150/60 shadow-3xs relative h-[155px] flex items-center justify-center"
      >
        <svg ref={svgRef} className="overflow-visible w-full h-full" />

        {/* Hover statistics detail strip inside chart */}
        {hoveredPoint && (
          <div className="absolute top-1.5 right-2 bg-slate-900/90 text-white text-[9px] px-2 py-1 rounded shadow-xs font-mono flex gap-2 border border-slate-700 pointer-events-none text-2xs z-10 animate-fade-in">
            <span className="font-bold text-slate-300">{hoveredPoint.day}:</span>
            <span className="text-emerald-400 font-extrabold">1: {hoveredPoint["1"]}</span>
            <span className="text-slate-300 font-extrabold">X: {hoveredPoint["X"]}</span>
            <span className="text-indigo-400 font-extrabold">2: {hoveredPoint["2"]}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
