import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { motion } from "motion/react";
import { HISTORICAL_BACKTEST_POOLS, BacktestJackpot } from "../historicalBacktestData";
import { TrendingUp, Award, Calendar, Activity } from "lucide-react";

interface ChartDataPoint {
  id: string;
  date: string;
  correct: number;
  total: number;
  pct: number;
  grandPrize: string;
  bonusText: string;
}

interface AIBacktestTrendChartProps {
  onSelectPool?: (poolId: string) => void;
  selectedPoolId?: string;
}

export default function AIBacktestTrendChart({ onSelectPool, selectedPoolId }: AIBacktestTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 260 });
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  // 1. Compute properties dynamically for the 6 pools chronologically (oldest to newest)
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    // Take last 6 pools and reverse them to display chronological progress (e.g. WK-15 -> WK-20)
    const pools = [...HISTORICAL_BACKTEST_POOLS]
      .slice(0, 6)
      .reverse();

    return pools.map((pool) => {
      let correct = 0;
      pool.matches.forEach((m) => {
        if (m.ai_predictions.balanced === m.actual) {
          correct++;
        }
      });
      const pct = parseFloat(((correct / pool.matches.length) * 100).toFixed(1));
      
      // Determine payout text
      let bonusText = "No Payout";
      if (correct === 17) bonusText = `Winner! (${pool.grandPrize})`;
      else if (correct === 16) bonusText = `16/17 Won (${pool.bonus_16})`;
      else if (correct === 15) bonusText = `15/17 Won (${pool.bonus_15})`;
      else if (correct === 14) bonusText = `14/17 Won (${pool.bonus_14})`;
      else if (correct === 13) bonusText = `13/17 Won (${pool.bonus_13})`;
      else if (correct === 12) bonusText = `12/17 Won (${pool.bonus_12})`;

      return {
        id: pool.id,
        date: pool.date,
        correct,
        total: pool.matches.length,
        pct,
        grandPrize: pool.grandPrize,
        bonusText,
      };
    });
  }, []);

  // 2. Responsive resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      const height = Math.max(220, Math.min(280, width * 0.45));
      setDimensions({ width: width || 500, height });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 3. Render D3 Chart
  useEffect(() => {
    if (!svgRef.current || chartData.length === 0) return;

    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 30, right: 35, bottom: 35, left: 45 };
    const chartWidth = Math.max(50, width - margin.left - margin.right);
    const chartHeight = Math.max(50, height - margin.top - margin.bottom);

    // Filter/Def setup for Gradients
    const defs = svgElement.append("defs");
    
    // Line Gradient
    const lineGradient = defs.append("linearGradient")
      .attr("id", "balanced-line-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
      
    lineGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#6366f1"); // Indigo

    lineGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3b82f6"); // Blue

    // Fill Beneath Area Gradient
    const areaGradient = defs.append("linearGradient")
      .attr("id", "balanced-area-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    areaGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#6366f1")
      .attr("stop-opacity", 0.28);

    areaGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#6366f1")
      .attr("stop-opacity", 0.0);

    // Main Canvas G Wrapper
    const g = svgElement
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X Scale
    const x = d3.scalePoint<string>()
      .domain(chartData.map(d => d.id))
      .range([0, chartWidth])
      .padding(0.25);

    // Y Scale (Accuracy % ranges from min 50% to max 100% to keep view detailed and vertical fluctuation clear)
    const minY = Math.max(0, d3.min(chartData, d => d.pct)! - 12);
    const maxY = Math.min(100, d3.max(chartData, d => d.pct)! + 8);
    const y = d3.scaleLinear()
      .domain([minY, maxY])
      .range([chartHeight, 0]);

    // Horizontal grid lines
    g.append("g")
      .attr("class", "grid")
      .call(
        d3.axisLeft(y)
          .ticks(5)
          .tickSize(-chartWidth)
          .tickFormat(() => "")
      )
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line")
        .attr("stroke", "#f1f5f9") // Light gray grid
        .attr("stroke-dasharray", "3,3")
      );

    // X Axis
    g.append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => g.select(".domain").attr("stroke", "#e2e8f0").attr("stroke-width", 1.2))
      .selectAll("text")
      .attr("fill", "#64748b")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("font-family", "monospace")
      .attr("dy", "10px");

    // Y Axis (Custom ticks expressing percentage)
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .call(g => g.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .attr("font-size", "9px")
      .attr("font-weight", "500")
      .attr("font-family", "monospace");

    // Area path under the curve
    const areaGen = d3.area<ChartDataPoint>()
      .x(d => x(d.id) || 0)
      .y0(chartHeight)
      .y1(d => y(d.pct))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(chartData)
      .attr("fill", "url(#balanced-area-gradient)")
      .attr("d", areaGen)
      .style("opacity", 0)
      .transition()
      .duration(600)
      .style("opacity", 1);

    // Line Path Generator
    const lineGen = d3.line<ChartDataPoint>()
      .x(d => x(d.id) || 0)
      .y(d => y(d.pct))
      .curve(d3.curveMonotoneX);

    const path = g.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "url(#balanced-line-gradient)")
      .attr("stroke-width", 3.2)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", lineGen);

    // Dasharray line animation on load
    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);

    // Vertical hover guide-line tracker
    const guideLine = g.append("line")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1.2)
      .attr("stroke-dasharray", "4,4")
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .style("opacity", 0);

    // Interactive circular nodes (plot points)
    const nodes = g.selectAll(".dot")
      .data(chartData)
      .enter()
      .append("g")
      .attr("class", "dot-group")
      .attr("transform", d => `translate(${x(d.id) || 0}, ${y(d.pct)})`);

    // Pulsing halo wave for the active selected pool node
    nodes.filter(d => d.id === selectedPoolId)
      .append("circle")
      .attr("class", "pulsing-halo")
      .attr("r", 6)
      .attr("fill", "none")
      .attr("stroke", "#4f46e5")
      .attr("stroke-width", 2)
      .style("opacity", 0.8)
      .style("pointer-events", "none")
      .transition()
      .duration(1500)
      .ease(d3.easeSinOut)
      .attr("r", 18)
      .style("opacity", 0)
      .on("end", function repeat() {
        d3.select(this)
          .attr("r", 6)
          .style("opacity", 0.8)
          .transition()
          .duration(1500)
          .ease(d3.easeSinOut)
          .attr("r", 18)
          .style("opacity", 0)
          .on("end", repeat);
      });

    // Inner glowing solid center dot
    nodes.append("circle")
      .attr("class", "data-dot")
      .attr("r", 0)
      .attr("fill", d => d.id === selectedPoolId ? "#4f46e5" : "#ffffff")
      .attr("stroke", d => d.id === selectedPoolId ? "#818cf8" : "#6366f1")
      .attr("stroke-width", d => d.id === selectedPoolId ? 3.5 : 2.5)
      .style("cursor", "pointer")
      .transition()
      .delay((d, i) => i * 100) // Beautiful staggered delay
      .duration(550)
      .ease(d3.easeBackOut)
      .attr("r", d => d.id === selectedPoolId ? 6.5 : 5);

    // Overlay outer hover target circle (invisible, but triggerable)
    nodes.append("circle")
      .attr("r", 14)
      .attr("fill", "transparent")
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this.parentNode as any)
          .select("circle.data-dot")
          .transition()
          .duration(120)
          .attr("r", 8.2)
          .attr("stroke", "#4f46e5")
          .attr("stroke-width", 4);

        guideLine
          .attr("x1", x(d.id) || 0)
          .attr("x2", x(d.id) || 0)
          .style("opacity", 0.5);

        setHoveredPoint(d);
      })
      .on("mouseout", function (event, d) {
        d3.select(this.parentNode as any)
          .select("circle.data-dot")
          .transition()
          .duration(125)
          .attr("r", d.id === selectedPoolId ? 6.5 : 5)
          .attr("stroke", d.id === selectedPoolId ? "#818cf8" : "#6366f1")
          .attr("stroke-width", d.id === selectedPoolId ? 3.5 : 2.5);

        guideLine.style("opacity", 0);
        setHoveredPoint(null);
      })
      .on("click", (event, d) => {
        if (onSelectPool) {
          onSelectPool(d.id);
        }
      });

  }, [dimensions, chartData, selectedPoolId]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-3xs flex flex-col gap-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/50 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              AI Balanced Model Performance Trend
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Accuracy percentages mapped chronologically over the past 6 SportPesa Mega Jackpots.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-black font-mono tracking-tight uppercase">
            Model Layer: Balanced AI
          </span>
        </div>
      </div>

      <div 
        ref={containerRef} 
        className="w-full relative bg-white dark:bg-slate-950/40 p-1.5 rounded-lg border border-slate-150 dark:border-slate-850 h-[260px] flex items-center justify-center overflow-visible"
      >
        <svg ref={svgRef} className="overflow-visible w-full h-full" />

        {/* Hover overlay stats panel */}
        {hoveredPoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute top-3 right-3 max-w-[220px] bg-slate-900/95 dark:bg-slate-950 border border-slate-800 dark:border-slate-800 p-2.5 rounded-xl shadow-lg text-white pointer-events-none z-20 flex flex-col gap-1.5 font-mono text-[10px]"
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-1">
              <span className="font-black text-indigo-300">{hoveredPoint.id}</span>
              <span className="text-slate-400 text-[8.5px] font-medium">{hoveredPoint.date}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center gap-4">
                <span className="text-slate-400">Accuracy:</span>
                <span className="font-bold text-emerald-400 text-xs">{hoveredPoint.pct}%</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-slate-400">Wins:</span>
                <span className="font-bold text-white">{hoveredPoint.correct} / 17 legs</span>
              </div>
              <div className="flex justify-between items-center gap-4 border-t border-slate-850/60 pt-1">
                <span className="text-slate-400">Status:</span>
                <span className="font-medium text-amber-400 text-[9px] truncate">{hoveredPoint.bonusText}</span>
              </div>
            </div>
            <div className="text-[8px] text-center text-slate-500 italic mt-0.5 border-t border-slate-850/40 pt-1">
              Click node to load that Jackpot view
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-6 gap-2 text-center text-[10px] font-bold text-slate-400 font-mono">
        {chartData.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelectPool?.(d.id)}
            className={`p-1.5 rounded border transition-all text-2xs uppercase ${
              d.id === selectedPoolId
                ? "bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-slate-200 dark:border-slate-850 hover:bg-slate-100"
            }`}
          >
            <div>{d.id}</div>
            <div className="text-[11px] font-black text-slate-700 dark:text-slate-300 font-sans mt-0.5">
              {d.pct}%
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
