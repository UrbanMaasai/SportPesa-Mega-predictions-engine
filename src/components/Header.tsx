/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Trophy, RefreshCw, Layers, DollarSign, Calendar, TrendingUp, Image, Camera, UploadCloud, FileText, LineChart } from "lucide-react";

interface HeaderProps {
  onSync: () => Promise<void>;
  isSyncing: boolean;
  matchCount: number;
  onOpenScreenshotModal?: () => void;
  onOpenPasteModal?: () => void;
  onOpenOddsTracker?: () => void;
}

export default function Header({ onSync, isSyncing, matchCount, onOpenScreenshotModal, onOpenPasteModal, onOpenOddsTracker }: HeaderProps) {
  const [lastSyncTime, setLastSyncTime] = useState<string>("Today, 10:09 AM");

  const handleSyncClick = async () => {
    await onSync();
    const now = new Date();
    setLastSyncTime(
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
        " " +
        now.toLocaleDateString([], { month: "short", day: "numeric" })
    );
  };

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-700/50 mb-8 overflow-hidden relative">
      {/* Background soccer pitch abstract lines */}
      <div className="absolute right-0 top-0 w-1/3 h-full opacity-5 pointer-events-none">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="w-full h-full">
          <circle cx="100" cy="50" r="30" strokeWidth="2" />
          <line x1="100" y1="0" x2="100" y2="100" strokeWidth="2" />
          <rect x="60" y="20" width="40" height="60" strokeWidth="2" />
        </svg>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live SportPesa Portal Connect
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400 shrink-0" />
            <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              Mega Jackpot Predictor
            </span>
            <span className="text-xs bg-slate-700 hover:bg-slate-600 border border-slate-600 px-2 py-1 rounded font-mono text-slate-300 pointer-events-none self-end md:self-center">
              17 MATCH PRO
            </span>
          </h1>
          <p className="mt-2 text-slate-300 text-sm md:text-base max-w-xl leading-relaxed">
            AI-driven stats mapping, dynamic permutation calculations, and tactical intelligence guides designed to optimize SportPesa's 17-match accumulator.
          </p>
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-3 shrink-0">
          <button
            onClick={handleSyncClick}
            disabled={isSyncing}
            id="sync-jackpot-btn"
            className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-4 py-3 rounded-xl text-sm font-bold border border-emerald-500/50 shadow-lg shadow-emerald-950/40 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            title="Refresh and scrape live SportPesa jackpot matches and odds for analysis"
          >
            <RefreshCw className={`w-4 h-4 text-white ${isSyncing ? "animate-spin" : ""}`} />
            <div>
              <div className="text-[10px] text-emerald-100 font-semibold uppercase tracking-wider text-left">Refresh / Scrape Jackpot</div>
              <div className="font-mono text-left text-xs text-white font-black">{isSyncing ? "Scraping Live..." : lastSyncTime}</div>
            </div>
          </button>

          {onOpenOddsTracker && (
            <button
              onClick={onOpenOddsTracker}
              id="odds-tracker-btn"
              className="flex items-center gap-2.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-100 px-3.5 py-3 rounded-xl text-sm font-bold border border-indigo-500/40 shadow-lg transition-all duration-200 cursor-pointer"
              title="Track odds shifts across time from publication date to kickoff"
            >
              <LineChart className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-indigo-200 font-semibold uppercase tracking-wider text-left">Odds Tracker</div>
                <div className="font-mono text-left text-xs text-emerald-300 font-black">Market Flow 📈</div>
              </div>
            </button>
          )}

          {onOpenPasteModal && (
            <button
              onClick={onOpenPasteModal}
              id="paste-coupon-btn"
              className="flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100 px-3.5 py-3 rounded-xl text-sm font-bold border border-slate-600/60 shadow-lg transition-all duration-200 cursor-pointer"
              title="Paste raw text copied from SportPesa portal"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider text-left">Paste Text</div>
                <div className="font-mono text-left text-xs text-amber-300 font-black">Raw Coupon AI</div>
              </div>
            </button>
          )}

          {onOpenScreenshotModal && (
            <button
              onClick={onOpenScreenshotModal}
              id="upload-screenshot-btn"
              className="flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-bold border border-indigo-400/40 shadow-lg shadow-indigo-950/40 transition-all duration-200 cursor-pointer"
              title="Upload a screenshot of current Jackpot coupon to scrape games via Gemini Vision OCR"
            >
              <UploadCloud className="w-4 h-4 text-indigo-200 animate-bounce" />
              <div>
                <div className="text-[10px] text-indigo-100 font-semibold uppercase tracking-wider text-left">Upload Screenshot</div>
                <div className="font-mono text-left text-xs text-white font-black">Scrape via OCR AI</div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Stats Widgets Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-700/50">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-705/30 backdrop-blur-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Current Grand Pool
          </div>
          <div className="text-xl md:text-2xl font-black text-amber-400 font-mono">
            Ksh 354,231,590
          </div>
          <div className="text-[10px] text-slate-400">Guaranteed Progressive Payout</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-705/30 backdrop-blur-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Jackpot Fixtures
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-slate-100 font-mono">
            {matchCount} Matches
          </div>
          <div className="text-[10px] text-slate-400">Standard 17 Selection Board</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-705/30 backdrop-blur-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-blue-400" /> Base Ticket Price
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-slate-100 font-mono">
            Ksh 99.00
          </div>
          <div className="text-[10px] text-slate-400">Per basic single outcome line</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-705/30 backdrop-blur-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-500" /> Closing Deadline
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-slate-100 font-mono">
            Saturday, 15:30
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">Jackpot locks at Match 1 Kickoff</div>
        </div>
      </div>
    </header>
  );
}
