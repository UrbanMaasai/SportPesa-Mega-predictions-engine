/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from "react";

interface FormSparklineProps {
  formString?: string; // e.g. "W-D-L-W-W" or "WWDWL"
  teamName?: string;
  className?: string;
  width?: number;
  height?: number;
  strokeColor?: string; // e.g. "#10b981" or "#6366f1"
  showSummaryBadge?: boolean;
}

export default function FormSparkline({
  formString = "D-D-D-D-D",
  teamName = "Team",
  className = "",
  width = 68,
  height = 20,
  strokeColor = "#10b981",
  showSummaryBadge = true,
}: FormSparklineProps) {
  const filterId = useId().replace(/:/g, "");

  // Clean form string: split by '-' or individual chars
  const rawResults = formString.includes("-")
    ? formString.split("-")
    : formString.split("");

  const results = rawResults.map((r) => r.trim().toUpperCase()).slice(0, 5);

  // If fewer than 5, pad with "D"
  while (results.length < 5) {
    results.push("D");
  }

  // Convert W/D/L to numerical values
  // W = 3, D = 1, L = 0
  const points = results.map((r) => {
    if (r === "W") return 3;
    if (r === "D") return 1;
    return 0; // L
  });

  const totalPoints = points.reduce((acc, p) => acc + p, 0);

  // Calculate coordinates for SVG
  const paddingX = 5;
  const paddingY = 4;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;
  const stepX = usableWidth / 4; // 5 points -> 4 intervals

  const coordinates = points.map((val, i) => {
    const x = paddingX + i * stepX;
    // val 3 (Win) -> top (paddingY)
    // val 1 (Draw) -> middle (paddingY + usableHeight * 0.6)
    // val 0 (Loss) -> bottom (height - paddingY)
    let y = height - paddingY;
    if (val === 3) y = paddingY;
    else if (val === 1) y = paddingY + usableHeight * 0.55;
    return { x, y, val, result: results[i] };
  });

  // Build SVG path definition with smooth cubic bezier curves
  const pointsString = coordinates.map((c) => `${c.x},${c.y}`).join(" ");

  // Path data for smooth line
  let pathD = `M ${coordinates[0].x} ${coordinates[0].y}`;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const p0 = coordinates[i];
    const p1 = coordinates[i + 1];
    const controlX1 = p0.x + stepX * 0.45;
    const controlY1 = p0.y;
    const controlX2 = p1.x - stepX * 0.45;
    const controlY2 = p1.y;
    pathD += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${p1.x} ${p1.y}`;
  }

  // Area path data for gradient fill
  const areaD = `${pathD} L ${coordinates[4].x} ${height} L ${coordinates[0].x} ${height} Z`;

  // Determine trend indicator emoji or icon
  let trendIcon = "➡️";
  let trendClass = "text-slate-500 bg-slate-100";
  if (totalPoints >= 10) {
    trendIcon = "🔥";
    trendClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
  } else if (totalPoints >= 7) {
    trendIcon = "📈";
    trendClass = "text-emerald-600 bg-emerald-50/70 border-emerald-150";
  } else if (totalPoints <= 3) {
    trendIcon = "📉";
    trendClass = "text-rose-700 bg-rose-50 border-rose-200";
  }

  const tooltipText = `${teamName} last 5 form: ${results.join("-")} (${totalPoints}/15 pts)`;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-slate-50/80 border border-slate-200/60 transition-all hover:bg-slate-100/90 ${className}`}
      title={tooltipText}
    >
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient
              id={`grad-${filterId}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Baseline reference line */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#cbd5e1"
            strokeWidth="0.75"
            strokeDasharray="2 2"
          />

          {/* Area fill */}
          <path d={areaD} fill={`url(#grad-${filterId})`} />

          {/* Smooth trend line */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Color coded data nodes */}
          {coordinates.map((coord, idx) => {
            let dotColor = "#10b981"; // Win - Green
            if (coord.val === 1) dotColor = "#f59e0b"; // Draw - Amber
            if (coord.val === 0) dotColor = "#f43f5e"; // Loss - Rose

            return (
              <g key={idx} className="group/node cursor-pointer">
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="2.5"
                  fill={dotColor}
                  stroke="#ffffff"
                  strokeWidth="1"
                  className="transition-transform duration-150 hover:scale-150"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {showSummaryBadge && (
        <span
          className={`text-[9px] font-mono font-black px-1 py-0.2 rounded border shadow-3xs flex items-center gap-0.5 shrink-0 ${trendClass}`}
          title={`${totalPoints} points accumulated from last 5 fixtures`}
        >
          <span>{trendIcon}</span>
          <span>{totalPoints}p</span>
        </span>
      )}
    </div>
  );
}
