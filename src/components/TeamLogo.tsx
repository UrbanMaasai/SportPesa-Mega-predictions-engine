import React from "react";

interface TeamLogoProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  id?: string;
}

export default function TeamLogo({ name, size = "md", className = "", id }: TeamLogoProps) {
  if (!name) return null;

  // Handle extraction of initials
  const getInitials = (teamName: string): string => {
    // Clean common prefixes or suffixes
    let cleanName = teamName
      .replace(/\b(FC|CF|AC|AS|SC|AFC|United|City|Hotspur|Athletic|Real|Deportivo|Club|Sporting|SV|FK)\b/gi, "")
      .trim();

    if (cleanName.length === 0) {
      cleanName = teamName;
    }

    const words = cleanName.split(/\s+/);
    if (words.length >= 2) {
      const first = words[0][0] || "";
      const second = words[1][0] || "";
      return (first + second).substring(0, 2).toUpperCase();
    }
    
    return cleanName.substring(0, 2).toUpperCase();
  };

  // Determine a stable, beautiful gradient combination based on the team name
  const getTeamColors = (teamName: string) => {
    const nameLower = teamName.toLowerCase();
    
    if (
      nameLower.includes("liverpool") || 
      nameLower.includes("arsenal") || 
      nameLower.includes("manchester united") || 
      nameLower.includes("bayern") || 
      nameLower.includes("milan") ||
      nameLower.includes("benfica") ||
      nameLower.includes("ajax")
    ) {
      return { bg: "from-rose-600 to-red-705", text: "text-white", border: "border-red-500/30" };
    }
    if (nameLower.includes("madrid") || nameLower.includes("tottenham") || nameLower.includes("porto") || nameLower.includes("valencia")) {
      return { bg: "from-slate-600 to-slate-800", text: "text-white", border: "border-slate-500/20" };
    }
    if (nameLower.includes("city") || nameLower.includes("napoli") || nameLower.includes("lazio") || nameLower.includes("marseille")) {
      return { bg: "from-sky-400 to-blue-500", text: "text-white", border: "border-sky-305/30" };
    }
    if (
      nameLower.includes("chelsea") || 
      nameLower.includes("everton") || 
      nameLower.includes("leicester") || 
      nameLower.includes("france") || 
      nameLower.includes("italy") ||
      nameLower.includes("schalke")
    ) {
      return { bg: "from-blue-600 to-indigo-700", text: "text-white", border: "border-blue-500/30" };
    }
    if (nameLower.includes("barcelona") || nameLower.includes("psg") || nameLower.includes("boca") || nameLower.includes("palace")) {
      return { bg: "from-blue-850 to-red-650", text: "text-yellow-300", border: "border-indigo-600/30" };
    }
    if (nameLower.includes("dortmund") || nameLower.includes("villarreal") || nameLower.includes("watford") || nameLower.includes("shakhtar")) {
      return { bg: "from-amber-400 to-yellow-500", text: "text-slate-900 font-black", border: "border-yellow-400/40" };
    }
    if (
      nameLower.includes("celtic") || 
      nameLower.includes("sporting") || 
      nameLower.includes("betis") || 
      nameLower.includes("palmeiras") || 
      nameLower.includes("santos") ||
      nameLower.includes("werder")
    ) {
      return { bg: "from-emerald-500 to-green-650", text: "text-white", border: "border-emerald-400/30" };
    }
    if (nameLower.includes("inter")) {
      return { bg: "from-blue-900 to-slate-950", text: "text-amber-400", border: "border-indigo-800/30" };
    }
    if (nameLower.includes("juventus") || nameLower.includes("newcastle") || nameLower.includes("paok")) {
      return { bg: "from-slate-800 to-neutral-950", text: "text-white", border: "border-slate-700/40" };
    }
    if (nameLower.includes("roma") || nameLower.includes("galatasaray") || nameLower.includes("spain") || nameLower.includes("lens")) {
      return { bg: "from-red-800 to-amber-600", text: "text-yellow-300", border: "border-red-700/30" };
    }
    if (nameLower.includes("atlético") || nameLower.includes("bilbao") || nameLower.includes("psv") || nameLower.includes("feyenoord")) {
      return { bg: "from-red-600 via-rose-500 to-blue-800", text: "text-white", border: "border-rose-500/30" };
    }

    // Stable deterministic hash for procedural styles
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idxPreset = Math.abs(hash) % 6;
    const presets = [
      { bg: "from-slate-700 to-slate-900", text: "text-slate-100", border: "border-slate-600/30" },
      { bg: "from-indigo-600 to-violet-750", text: "text-indigo-100", border: "border-indigo-505/30" },
      { bg: "from-teal-600 to-emerald-700", text: "text-teal-100", border: "border-teal-500/30" },
      { bg: "from-orange-500 to-red-600", text: "text-orange-100", border: "border-orange-400/30" },
      { bg: "from-fuchsia-600 to-pink-700", text: "text-fuchsia-50", border: "border-fuchsia-500/30" },
      { bg: "from-cyan-500 to-blue-600", text: "text-white", border: "border-cyan-400/30" },
    ];
    
    return presets[idxPreset];
  };

  const initials = getInitials(name);
  const colors = getTeamColors(name);

  // Size mapping
  const sizeClasses = {
    xs: "w-5 h-5 text-[8px] font-black tracking-tighter border",
    sm: "w-6 h-6 text-[9px] font-black tracking-tight border",
    md: "w-8 h-8 text-[11px] font-black tracking-normal border shadow-3xs",
    lg: "w-10 h-10 text-[13px] font-black tracking-normal border-2 shadow-2xs",
    xl: "w-12 h-12 text-[15px] font-black tracking-normal border-2 shadow-xs"
  };

  const chosenSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      id={id}
      className={`rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br ${colors.bg} ${colors.text} ${colors.border} select-none overflow-hidden text-center leading-none ${chosenSize} ${className}`}
      title={name}
    >
      <span className="font-sans scale-[0.95] drop-shadow-xs">{initials}</span>
    </div>
  );
}
