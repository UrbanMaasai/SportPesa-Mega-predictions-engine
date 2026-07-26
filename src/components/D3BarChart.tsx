import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { motion } from "motion/react";

interface D3BarChartProps {
  stats: {
    "1": number;
    "X": number;
    "2": number;
  };
  labels: {
    "1": string;
    "X": string;
    "2": string;
  };
  matchNo?: string;
}

export default function D3BarChart({ stats, labels, matchNo }: D3BarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 160 });

  // Handle ResizeObserver to make it truly responsive
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Maintain an elegant aspect ratio (width to height ratio of ~1.8)
      const calculatedHeight = Math.max(140, Math.min(200, width * 0.55));
      setDimensions({
        width: width || 300,
        height: calculatedHeight
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any previous chart elements
    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 12, right: 12, bottom: 25, left: 32 };
    const chartWidth = Math.max(50, width - margin.left - margin.right);
    const chartHeight = Math.max(50, height - margin.top - margin.bottom);

    // Create chart data matching the 1X2 outcomes with distinct styling
    const data = [
      { key: "1", label: "1", name: "Home Win", fullName: labels["1"], value: stats["1"], color: "#10b981" },
      { key: "X", label: "X", name: "Draw", fullName: labels["X"], value: stats["X"], color: "#64748b" },
      { key: "2", label: "2", name: "Away Win", fullName: labels["2"], value: stats["2"], color: "#6366f1" }
    ];

    // SVG container setup with margins
    const g = svgElement
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X Scale
    const x = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, chartWidth])
      .padding(0.35);

    // Y Scale
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);

    // Grid lines for reference
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

    // X-axis under the bars
    g.append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => g.select(".domain").attr("stroke", "#e2e8f0").attr("stroke-width", 1.5))
      .selectAll("text")
      .attr("fill", "#475569")
      .attr("font-size", "11px")
      .attr("font-weight", "700")
      .attr("dy", "8px");

    // Y-axis text labels on the left
    g.append("g")
      .call(d3.axisLeft(y).ticks(4).tickFormat(d => `${d}%`))
      .call(g => g.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .attr("font-size", "9px")
      .attr("font-family", "monospace");

    // Add bars
    const barGroups = g.selectAll(".bar-group")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "bar-group");

    // Interactive Bars using rect
    const bars = barGroups.append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.label) || 0)
      .attr("width", x.bandwidth())
      .attr("rx", 4) // Beautiful rounded corners
      .attr("ry", 4)
      .attr("fill", d => d.color)
      .attr("y", chartHeight) // Init bottom-aligned for transition
      .attr("height", 0)
      .attr("cursor", "pointer");

    // Bar transition effect (grows upwards)
    bars.transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr("y", d => y(d.value))
      .attr("height", d => chartHeight - y(d.value));

    // Overlay values inside or on top the bars
    const textLabels = barGroups.append("text")
      .attr("class", "value-label")
      .attr("text-anchor", "middle")
      .attr("x", d => (x(d.label) || 0) + x.bandwidth() / 2)
      .attr("fill", d => d.value > 16 ? "#ffffff" : "#475569")
      .attr("font-weight", "700")
      .attr("font-size", "10px")
      .attr("font-family", "monospace")
      .attr("y", chartHeight - 4)
      .text(d => `${d.value}%`);

    textLabels.transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr("y", d => {
        const barY = y(d.value);
        return d.value > 16 ? barY + 14 : barY - 5;
      });

    // Tooltip hovering effects on bars
    bars.on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr("opacity", 0.85);
    }).on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(150)
        .attr("opacity", 1);
    });

  }, [dimensions, stats, labels]);

  return (
    <motion.div
      ref={containerRef}
      key={matchNo || `${stats["1"]}-${stats["X"]}-${stats["2"]}`}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full relative h-[160px] flex items-center justify-center"
    >
      <svg ref={svgRef} className="overflow-visible w-full h-full" />
    </motion.div>
  );
}
