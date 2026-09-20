import React, { useState, useMemo } from "react";
import { Coins, HelpCircle, Award, Percent, TrendingUp, Info, ShieldCheck, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Match } from "../types";

interface PayoutProbabilityEstimatorProps {
  matches: Match[];
  selections: Record<string, string[]>;
  subJackpotSize: number;
  activeSubJackpotMatches: Record<string, boolean>;
  doubleChanceCount: number;
}

export const PayoutProbabilityEstimator: React.FC<PayoutProbabilityEstimatorProps> = ({
  matches,
  selections,
  subJackpotSize,
  activeSubJackpotMatches,
  doubleChanceCount,
}) => {
  const [targetCorrect, setTargetCorrect] = useState<number>(0);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Filter matches that are part of the active sub-jackpot size subset
  const activeMatches = useMemo(() => {
    // If it's a subset (e.g. MJP 13), filter matches belonging to the active selections or top sorted
    const sorted = [...matches].sort((a, b) => parseInt(a.match_no) - parseInt(b.match_no));
    if (subJackpotSize === 17) return sorted;
    
    // Otherwise, pick matches that have activeSubJackpotMatches flag, up to subJackpotSize
    const filtered = sorted.filter(m => activeSubJackpotMatches[m.match_no]);
    if (filtered.length === subJackpotSize) return filtered;
    return sorted.slice(0, subJackpotSize);
  }, [matches, subJackpotSize, activeSubJackpotMatches]);

  // Compute success probability P_i for each active match based on user selections
  const matchSuccessProbabilities = useMemo(() => {
    return activeMatches.map((m) => {
      const stats = m.predictionStats || { "1": 35, "X": 30, "2": 35 };
      const userChoices = selections[m.match_no] || [];
      
      if (userChoices.length === 0) {
        // Default to a realistic average choice success if not yet selected
        return 0.35; 
      }
      
      // Sum probabilities of chosen outcomes
      let totalProb = 0;
      userChoices.forEach((choice) => {
        if (choice === "1") totalProb += stats["1"];
        else if (choice === "X") totalProb += stats["X"];
        else if (choice === "2") totalProb += stats["2"];
      });
      
      // Return value between 0.01 and 0.99
      return Math.min(Math.max(totalProb / 100, 0.05), 0.99);
    });
  }, [activeMatches, selections]);

  // Calculate the joint distribution using dynamic programming (Poisson-Binomial Distribution)
  // dp[i][j] is the probability of getting exactly j correct out of first i matches
  const distribution = useMemo(() => {
    const N = activeMatches.length;
    if (N === 0) return [];
    
    const dp = Array.from({ length: N + 1 }, () => Array(N + 1).fill(0));
    dp[0][0] = 1.0;
    
    for (let i = 1; i <= N; i++) {
      const p = matchSuccessProbabilities[i - 1];
      const q = 1 - p;
      for (let j = 0; j <= i; j++) {
        // Exactly j correct from first i
        const probSuccess = j > 0 ? dp[i - 1][j - 1] * p : 0;
        const probFailure = dp[i - 1][j] * q;
        dp[i][j] = probSuccess + probFailure;
      }
    }
    
    return dp[N];
  }, [activeMatches, matchSuccessProbabilities]);

  // Cumulative probabilities: at least X correct
  const cumulativeDistribution = useMemo(() => {
    const cum = Array(distribution.length).fill(0);
    let runningSum = 0;
    for (let j = distribution.length - 1; j >= 0; j--) {
      runningSum += distribution[j] || 0;
      cum[j] = runningSum;
    }
    return cum;
  }, [distribution]);

  // Minimum required correct picks for a bonus for each sub-jackpot size configuration
  const minRequiredBonus = useMemo(() => {
    if (subJackpotSize === 17) return 12;
    if (subJackpotSize === 16) return 11;
    if (subJackpotSize === 15) return 10;
    if (subJackpotSize === 14) return 10;
    return 10; // For MJP 13
  }, [subJackpotSize]);

  // Set initial target slider to the minimum bonus threshold on size change
  React.useEffect(() => {
    setTargetCorrect(subJackpotSize);
  }, [subJackpotSize]);

  // Standard estimated payout matrices for various Jackpot sizes
  const estimatedPayout = useMemo(() => {
    const cost = Math.pow(2, doubleChanceCount) * 99;
    
    // Base returns based on target matching Correct size
    let baseReturn = 0;
    let label = "Bonus Tier Unavailable";
    
    if (subJackpotSize === 17) {
      if (targetCorrect === 17) { baseReturn = 129484043; label = "Grand Jackpot Winner 🎉"; }
      else if (targetCorrect === 16) { baseReturn = 2120440; label = "First Tier Bonus (16/17)"; }
      else if (targetCorrect === 15) { baseReturn = 340500; label = "Second Tier Bonus (15/17)"; }
      else if (targetCorrect === 14) { baseReturn = 41200; label = "Third Tier Bonus (14/17)"; }
      else if (targetCorrect === 13) { baseReturn = 3110; label = "Fourth Tier Bonus (13/17)"; }
      else if (targetCorrect === 12) { baseReturn = 640; label = "Fifth Tier Bonus (12/17)"; }
    } else if (subJackpotSize === 16) {
      if (targetCorrect === 16) { baseReturn = 70229013; label = "Grand MJP 16 Pool 🎉"; }
      else if (targetCorrect === 15) { baseReturn = 450000; label = "Bonus Tier 1 (15/16)"; }
      else if (targetCorrect === 14) { baseReturn = 62000; label = "Bonus Tier 2 (14/16)"; }
      else if (targetCorrect === 13) { baseReturn = 8400; label = "Bonus Tier 3 (13/16)"; }
      else if (targetCorrect === 12) { baseReturn = 1200; label = "Bonus Tier 4 (12/16)"; }
      else if (targetCorrect === 11) { baseReturn = 350; label = "Bonus Tier 5 (11/16)"; }
    } else if (subJackpotSize === 15) {
      if (targetCorrect === 15) { baseReturn = 40114865; label = "Grand MJP 15 Pool 🎉"; }
      else if (targetCorrect === 14) { baseReturn = 280000; label = "Bonus Tier 1 (14/15)"; }
      else if (targetCorrect === 13) { baseReturn = 44000; label = "Bonus Tier 2 (13/15)"; }
      else if (targetCorrect === 12) { baseReturn = 5500; label = "Bonus Tier 3 (12/15)"; }
      else if (targetCorrect === 11) { baseReturn = 1100; label = "Bonus Tier 4 (11/15)"; }
      else if (targetCorrect === 10) { baseReturn = 240; label = "Bonus Tier 5 (10/15)"; }
    } else if (subJackpotSize === 14) {
      if (targetCorrect === 14) { baseReturn = 25071791; label = "Grand MJP 14 Pool 🎉"; }
      else if (targetCorrect === 13) { baseReturn = 190000; label = "Bonus Tier 1 (13/14)"; }
      else if (targetCorrect === 12) { baseReturn = 38000; label = "Bonus Tier 2 (12/14)"; }
      else if (targetCorrect === 11) { baseReturn = 4900; label = "Bonus Tier 3 (11/14)"; }
      else if (targetCorrect === 10) { baseReturn = 950; label = "Bonus Tier 4 (10/14)"; }
    } else { // 13
      if (targetCorrect === 13) { baseReturn = 15043075; label = "Grand MJP 13 Pool 🎉"; }
      else if (targetCorrect === 12) { baseReturn = 110000; label = "Bonus Tier 1 (12/13)"; }
      else if (targetCorrect === 11) { baseReturn = 25000; label = "Bonus Tier 2 (11/13)"; }
      else if (targetCorrect === 10) { baseReturn = 3900; label = "Bonus Tier 3 (10/13)"; }
    }

    const netWin = baseReturn > 0 ? baseReturn - cost : -cost;
    const evMultiplier = baseReturn > 0 ? (baseReturn / cost) : 0;
    
    return {
      baseReturn,
      netWin,
      evMultiplier,
      label,
      cost
    };
  }, [targetCorrect, subJackpotSize, doubleChanceCount]);

  const targetProbability = distribution[targetCorrect] || 0;
  const cumulativeProbability = cumulativeDistribution[targetCorrect] || 0;

  // Let's count how many complete selections has been made
  const completedSelectionsCount = useMemo(() => {
    let count = 0;
    activeMatches.forEach(m => {
      if (selections[m.match_no] && selections[m.match_no].length > 0) {
        count++;
      }
    });
    return count;
  }, [activeMatches, selections]);

  return (
    <div id="PayoutProbabilityEstimator" className={`bg-slate-50 border border-slate-200/80 rounded-xl p-4 font-sans transition-all duration-300 ${isCollapsed ? "space-y-0" : "space-y-4"}`}>
      {/* Title */}
      <div 
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block truncate">
            Mathematical Payout & Win Estimator
          </span>
          {isCollapsed && (
            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded font-mono ml-2 animate-fade-in animate-pulse shrink-0">
              {estimatedPayout.baseReturn > 0 ? `Ksh ${estimatedPayout.baseReturn.toLocaleString()}` : "Active"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-slate-400 hover:text-indigo-600 transition p-1"
            title="Learn how probabilities are calculated"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-500 hover:text-indigo-600 transition p-1"
            title={isCollapsed ? "Expand section" : "Collapse section"}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {isCollapsed && (
        <div 
          onClick={() => setIsCollapsed(false)}
          className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200/50 text-[10px] font-mono font-bold animate-fade-in text-slate-500 cursor-pointer hover:bg-slate-100/30 p-1 rounded transition-colors"
        >
          <div className="flex items-center gap-2">
            <span>Prob At Least {targetCorrect}+:</span>
            <span className="text-indigo-600 font-black">{(cumulativeProbability * 100).toFixed(4)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Est. Return:</span>
            <span className="text-emerald-750 font-black">
              {estimatedPayout.baseReturn > 0 ? `Ksh ${estimatedPayout.baseReturn.toLocaleString()}` : "Ksh 0"}
            </span>
          </div>
        </div>
      )}

      {!isCollapsed && (
        <>
          {showExplanation && (
            <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-lg text-[9.5px] text-indigo-950 leading-relaxed space-y-1.5 animate-fade-in text-left">
              <p>
                <strong>Mathematical Engine:</strong> This widget runs a precise <strong>Poisson-Binomial joint probability</strong> equation based on your customized selections and their underlying team analytics (Poisson models, home advantage and ranks).
              </p>
              <p>
                Unlike regular static calculators, playing double-chance combinations or choosing statistically weighted outcomes dynamically adjusts the exact probability calculations across your configuration.
              </p>
            </div>
          )}

          {/* Probability Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Probability Box */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-3xs text-left flex flex-col justify-between">
              <div>
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 font-mono block">
                  Probability Of Exactly {targetCorrect}
                </span>
                <p className="text-sm font-black font-mono text-slate-800 mt-1">
                  {(targetProbability * 100).toFixed(5)}%
                </p>
              </div>
              <span className="text-[7.5px] text-slate-400 mt-0.5 font-mono">
                1 in {(targetProbability > 0 ? Math.round(1 / targetProbability) : 0).toLocaleString()} slips
              </span>
            </div>

            {/* Cumulative Probability Box */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-3xs text-left flex flex-col justify-between">
              <div>
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-indigo-600 font-mono block animate-pulse">
                  Probability Of At Least {targetCorrect}+
                </span>
                <p className="text-sm font-black font-mono text-indigo-600 mt-1">
                  {(cumulativeProbability * 100).toFixed(4)}%
                </p>
              </div>
              <span className="text-[7.5px] text-indigo-400 mt-0.5 font-mono">
                1 in {(cumulativeProbability > 0 ? Math.round(1 / cumulativeProbability) : 0).toLocaleString()} slips
              </span>
            </div>

            {/* Expected returns */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-3xs text-left flex flex-col justify-between">
              <div>
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-emerald-650 font-mono block">
                  Estimated Return (Ksh)
                </span>
                <p className="text-sm font-black font-mono text-emerald-700 mt-1">
                  {estimatedPayout.baseReturn > 0 ? `Ksh ${estimatedPayout.baseReturn.toLocaleString()}` : "No Payout"}
                </p>
              </div>
              <span className="text-[7.5px] text-emerald-500 font-bold mt-0.5 truncate">
                {estimatedPayout.baseReturn > 0 ? `${estimatedPayout.evMultiplier.toFixed(0)}x ROI coverage` : "Below payout minimum threshold"}
              </span>
            </div>
          </div>

          {/* SLIDER FOR TARGETS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-left space-y-3 shadow-3xs">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block font-mono">
                  Target Correct Matches Slider
                </span>
                <span className="text-[10px] font-bold text-slate-600">
                  Select accuracy model: <span className="text-indigo-600 font-black">{targetCorrect} / {subJackpotSize}</span> correct
                </span>
              </div>
              <div className="text-right">
                <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase inline-block ${
                  targetCorrect >= minRequiredBonus ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                }`}>
                  {targetCorrect >= minRequiredBonus ? "Payout Eligible" : "No Bonus Pays"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-slate-400">{minRequiredBonus - 1}</span>
              <input
                type="range"
                min={minRequiredBonus - 2}
                max={subJackpotSize}
                value={targetCorrect}
                onChange={(e) => setTargetCorrect(parseInt(e.target.value))}
                className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] font-mono font-black text-slate-800">{subJackpotSize}</span>
            </div>

            {/* Slip Selection Warning if not fully selected */}
            {completedSelectionsCount < subJackpotSize && (
              <div className="text-[8.5px] font-mono bg-amber-50 text-amber-700 rounded p-1.5 border border-amber-100/70 flex items-center gap-1">
                <span className="font-extrabold animate-pulse">ℹ️</span>
                <span>Slip is incomplete ({completedSelectionsCount}/{subJackpotSize} filled). Probability computed assuming 33% accuracy for empty rows.</span>
              </div>
            )}
          </div>

          {/* Mini Probability Distribution Chart */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-left space-y-2.5 shadow-3xs">
            <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400 font-mono block">
              Jackpot Hits Probability Curve & Bonus Spreads
            </span>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
              {Array.from({ length: subJackpotSize - minRequiredBonus + 2 }).map((_, idx) => {
                const matchesCount = subJackpotSize - idx;
                const prob = distribution[matchesCount] || 0;
                const isTarget = matchesCount === targetCorrect;
                
                // Get typical label payouts
                let payLabel = "";
                if (subJackpotSize === 17) {
                  if (matchesCount === 17) payLabel = "Ksh 129.5M Grand";
                  else if (matchesCount === 16) payLabel = "Ksh 2.1M";
                  else if (matchesCount === 15) payLabel = "Ksh 340k";
                  else if (matchesCount === 14) payLabel = "Ksh 41k";
                  else if (matchesCount === 13) payLabel = "Ksh 3,110";
                  else if (matchesCount === 12) payLabel = "Ksh 640";
                } else if (subJackpotSize === 16) {
                  if (matchesCount === 16) payLabel = "Ksh 70.2M Grand";
                  else if (matchesCount === 15) payLabel = "Ksh 450k";
                  else if (matchesCount === 14) payLabel = "Ksh 62k";
                  else if (matchesCount === 13) payLabel = "Ksh 8,400";
                  else if (matchesCount === 12) payLabel = "Ksh 1,200";
                  else if (matchesCount === 11) payLabel = "Ksh 350";
                } else if (subJackpotSize === 15) {
                  if (matchesCount === 15) payLabel = "Ksh 40.1M Grand";
                  else if (matchesCount === 14) payLabel = "Ksh 280k";
                  else if (matchesCount === 13) payLabel = "Ksh 44k";
                  else if (matchesCount === 12) payLabel = "Ksh 5.5k";
                  else if (matchesCount === 11) payLabel = "Ksh 1,100";
                  else if (matchesCount === 10) payLabel = "Ksh 240";
                } else if (subJackpotSize === 14) {
                  if (matchesCount === 14) payLabel = "Ksh 25.1M Grand";
                  else if (matchesCount === 13) payLabel = "Ksh 190k";
                  else if (matchesCount === 12) payLabel = "Ksh 38k";
                  else if (matchesCount === 11) payLabel = "Ksh 4,900";
                  else if (matchesCount === 10) payLabel = "Ksh 950";
                } else { // 13
                  if (matchesCount === 13) payLabel = "Ksh 15.0M Grand";
                  else if (matchesCount === 12) payLabel = "Ksh 110k";
                  else if (matchesCount === 11) payLabel = "Ksh 25k";
                  else if (matchesCount === 10) payLabel = "Ksh 3,900";
                }

                return (
                  <div 
                    key={matchesCount} 
                    className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                      isTarget ? "bg-indigo-50/70 border border-indigo-100/50" : ""
                    }`}
                  >
                    <span className={`text-[8px] font-mono font-black tracking-wide w-12 text-slate-500 ${
                      isTarget ? "text-indigo-600" : ""
                    }`}>
                      {matchesCount} / {subJackpotSize} {isTarget ? "👉" : ""}
                    </span>
                    <div className="flex-1 h-3 bg-slate-100 rounded overflow-hidden relative border border-slate-150">
                      <div 
                        className={`h-full rounded transition-all duration-300 ${
                          matchesCount === subJackpotSize 
                            ? "bg-amber-400" 
                            : isTarget 
                            ? "bg-indigo-600" 
                            : "bg-emerald-500/80"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0.5, prob * 15000))}%` }} 
                      ></div>
                    </div>
                    <span className="text-[8px] font-mono text-slate-400 font-bold w-12 text-right">
                      {(prob * 100).toFixed(4)}%
                    </span>
                    <span className={`text-[8px] font-mono font-extrabold w-20 text-right ${
                      matchesCount === subJackpotSize ? "text-amber-600" : "text-slate-650"
                    }`}>
                      {payLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
