import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { History, Sparkles } from "lucide-react";

interface TeamNameH2HCardProps {
  teamName: string;
  opponentName: string;
  isHome: boolean;
  h2hText?: string;
  rank?: number;
}

export default function TeamNameH2HCard({
  teamName,
  opponentName,
  isHome,
  h2hText,
  rank,
}: TeamNameH2HCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-sm font-bold text-slate-800 font-sans cursor-help hover:text-emerald-700 transition-colors border-b border-dashed border-slate-300 hover:border-emerald-500 pb-0.5">
        {teamName}
      </span>

      <AnimatePresence>
        {isHovered && h2hText && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-full left-0 mb-2.5 w-72 xs:w-80 bg-slate-900 text-slate-100 p-4 rounded-xl shadow-xl border border-slate-800 z-50 text-left pointer-events-none"
          >
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-300 font-mono">
                  H2H Profile
                </span>
              </div>
              <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                isHome ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
              }`}>
                {isHome ? "Home Side" : "Away Side"}
              </span>
            </div>

            {/* Matchup titles */}
            <div className="mb-2.5">
              <span className="text-[11px] text-slate-400 block font-medium">
                {isHome ? `${teamName} vs ${opponentName}` : `${opponentName} vs ${teamName}`}
              </span>
              {rank && (
                <span className="text-[9px] text-slate-500 block font-mono mt-0.5">
                  Current Rank: #{rank}
                </span>
              )}
            </div>

            {/* Content summary */}
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 mb-2">
              <p className="text-[11px] leading-relaxed text-slate-200">
                {h2hText}
              </p>
            </div>

            {/* Footer banner */}
            <div className="flex items-center gap-1 text-[8px] text-emerald-400/80 font-semibold font-mono uppercase tracking-wider mt-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>AI Analysis Available Below</span>
            </div>

            {/* Micro subtle card triangle pointer */}
            <div className="absolute top-full left-5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
