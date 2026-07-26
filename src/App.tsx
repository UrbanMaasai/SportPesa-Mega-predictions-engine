/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Match, MatchAnalysis } from "./types";
import D3BarChart from "./components/D3BarChart";
import D3LineChart from "./components/D3LineChart";
import D3H2HGoalDiffChart, { getHistoricalH2HData } from "./components/D3H2HGoalDiffChart";
import Header from "./components/Header";
import ScreenshotUploadModal from "./components/ScreenshotUploadModal";
import PasteTextModal from "./components/PasteTextModal";
import OddsTrackerModal from "./components/OddsTrackerModal";
import TeamLogo from "./components/TeamLogo";
import FormSparkline from "./components/FormSparkline";
import { TeamStrengthHeatmap } from "./components/TeamStrengthHeatmap";
import { PayoutProbabilityEstimator } from "./components/PayoutProbabilityEstimator";
import { getLeagueStats } from "./data/leagueData";
import { HISTORICAL_BACKTEST_POOLS } from "./historicalBacktestData";
import AIBacktestTrendChart from "./components/AIBacktestTrendChart";
import { motion, AnimatePresence } from "motion/react";
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from "./lib/firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  Trophy,
  RefreshCw,
  Sparkles,
  Layers,
  Flame,
  Percent,
  DollarSign,
  Calendar,
  Clock,
  Terminal,
  FileJson,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Send,
  Info,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  BrainCircuit,
  Lightbulb,
  Check,
  Search,
  UploadCloud,
  HelpCircle,
  Copy,
  Bell,
  BellRing,
  Lock,
  Unlock,
  Plus,
  Minus,
  Zap,
  Smartphone,
  MessageSquare,
  BarChart3,
  RotateCcw,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  LogOut,
  LogIn,
  Cloud,
  Database,
  Sun,
  Moon,
  Activity,
  Save,
  CloudUpload,
  X
} from "lucide-react";

export default function App() {
  // State variables
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  
  // Strategy selections & unsaved edits tracking
  const [activeStrategy, setActiveStrategy] = useState<string>("");
  const [lastGeneratedStrategy, setLastGeneratedStrategy] = useState<string>("");
  const [strategySnapshot, setStrategySnapshot] = useState<string | null>(null);
  const [hasUnsavedStrategyEdits, setHasUnsavedStrategyEdits] = useState<boolean>(false);
  const [dismissedUnsavedNotification, setDismissedUnsavedNotification] = useState<boolean>(false);
  const [strategyJustification, setStrategyJustification] = useState<string>("");
  const [isStratRateLimited, setIsStratRateLimited] = useState<boolean>(false);

  // Active Jackpot source & autosaved screenshot jackpot state
  const [jackpotSource, setJackpotSource] = useState<string>("Live SportPesa Portal");
  const [lastScrapedScreenshotTime, setLastScrapedScreenshotTime] = useState<string | null>(null);

  // Analysis panel state (select match #1 by default)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [activeFallbackEngine, setActiveFallbackEngine] = useState<string | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Derived state: Get league stats whenever selectedMatch is set.
  const leagueData = selectedMatch
    ? getLeagueStats(
        selectedMatch.league || "Unknown League",
        selectedMatch.home,
        selectedMatch.away,
        selectedMatch.homeRank,
        selectedMatch.awayRank,
        selectedMatch.homeForm,
        selectedMatch.awayForm
      )
    : null;

  // Custom mock terminal output logging
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[10:09:01] System boot initializing...",
    "[10:09:03] Selenium webdriver configured for headless execution",
    "[10:09:05] Successfully loaded SportPesa MJP local state tree",
    "[10:09:08] Operational status: Live | Port 3000 online"
  ]);

  // General Notification Banner
  const [notification, setNotification] = useState<{
    type: "success" | "info" | "warning";
    message: string;
  } | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [leagueFilter, setLeagueFilter] = useState<string>("All");
  const [smartFilter, setSmartFilter] = useState<"all" | "favorites" | "volatile" | "draws" | "value">("all");
  const [baseStake, setBaseStake] = useState<number>(99);
  const [sortField, setSortField] = useState<"match_no" | "league" | "matchup" | "predictability" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Odds Tracker Modal State
  const [showOddsTrackerModal, setShowOddsTrackerModal] = useState<boolean>(false);
  const [oddsTrackerMatchNo, setOddsTrackerMatchNo] = useState<string>("1");

  // Ingest pasting Custom list of matches
  const [customJsonInput, setCustomJsonInput] = useState<string>("");
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);

  // Selections Export and Clipboard copy modal state
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>("");
  const [exportModalFormat, setExportModalFormat] = useState<"json" | "csv" | "telegram">("json");
  const [copiedTextFeedback, setCopiedTextFeedback] = useState<string | null>(null);

  // User notifications preference state (match_no -> boolean)
  const [notifiedMatches, setNotifiedMatches] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("mjp_notified_matches") || "{}");
    } catch {
      return {};
    }
  });

  // User locked matches state (match_no -> boolean)
  const [lockedMatches, setLockedMatches] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("mjp_locked_matches") || "{}");
    } catch {
      return {};
    }
  });

  // Count of double chance (compound slip) selections to apply during quick pick
  const [doubleChanceCount, setDoubleChanceCount] = useState<number>(3);

  // Target Sub-Jackpot Size: 17 for full, 13-16 for sub-jackposts.
  const [subJackpotSize, setSubJackpotSize] = useState<number>(17);
  // Records of active match_no strings included in sub-jackpot slip. Default all true.
  const [activeSubJackpotMatches, setActiveSubJackpotMatches] = useState<Record<string, boolean>>({});
  // Track currently active analysis panel tab: "tactical" (AI insights & charts) or "league" (Standings and Scorers)
  const [analysisTab, setAnalysisTab] = useState<"tactical" | "league">("tactical");

  // Local Storage Session Recovery states
  const [restoreAvailable, setRestoreAvailable] = useState<boolean>(false);
  const [savedBackup, setSavedBackup] = useState<Record<string, string[]> | null>(null);

  // Dark Mode Toggle state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("mjp_dark_mode") === "true";
    } catch {
      return false;
    }
  });

  // Bets vs Outcomes (Results) Resolver state
  const [actualOutcomes, setActualOutcomes] = useState<Record<string, "1" | "X" | "2">>(() => {
    try {
      return JSON.parse(localStorage.getItem("mjp_actual_outcomes") || "{}");
    } catch {
      return {};
    }
  });
  const [isResoluting, setIsResoluting] = useState<boolean>(false);
  const [activeResultsTab, setActiveResultsTab] = useState<"sandbox" | "backtest">("sandbox");
  const [selectedBacktestPoolId, setSelectedBacktestPoolId] = useState<string>("MJP-WK-20");
  const [predictionsSectionCollapsed, setPredictionsSectionCollapsed] = useState<boolean>(false);

  // Dark Mode effect to toggle class on documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("mjp_dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("mjp_dark_mode", "false");
    }
  }, [isDarkMode]);

  // Selections autosave effect helper
  useEffect(() => {
    localStorage.setItem("mjp_actual_outcomes", JSON.stringify(actualOutcomes));
  }, [actualOutcomes]);

  // Historical Payout modal states
  const [showHistoricalModal, setShowHistoricalModal] = useState<boolean>(false);
  const [historicalPayouts, setHistoricalPayouts] = useState<any[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState<boolean>(false);

  // Firebase Auth and Cloud Slips states
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [cloudCoupons, setCloudCoupons] = useState<any[]>([]);
  const [loadingCloudCoupons, setLoadingCloudCoupons] = useState<boolean>(false);
  const [savingCoupon, setSavingCoupon] = useState<boolean>(false);
  const [newCouponName, setNewCouponName] = useState<string>("");
  const [showCloudModal, setShowCloudModal] = useState<boolean>(false);

  // Persistent 17-leg outcomes summary drawer state
  const [showSummaryDrawer, setShowSummaryDrawer] = useState<boolean>(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState<boolean>(false);
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);

  const saveScrapedJackpotToCloud = async (userId: string, scrapedMatches: Match[]) => {
    try {
      await setDoc(doc(db, "users", userId, "jackpots", "latest_scraped_screenshot"), {
        userId,
        matches: scrapedMatches,
        source: "Screenshot OCR (Autosaved)",
        updatedAt: new Date().toISOString()
      });
      addLog("[Firestore] Autosaved latest screenshot jackpot matches to cloud account.");
    } catch (err) {
      console.warn("Firestore screenshot jackpot sync skipped:", err);
    }
  };

  const handleMatchesScraped = (scrapedMatches: Match[], msg: string) => {
    setMatches(scrapedMatches);
    setJackpotSource("Screenshot OCR (Autosaved)");
    setDatePreset("all");
    setLeagueFilter("All");
    setSmartFilter("all");
    setSearchQuery("");

    // Automatically activate all scraped matches in sub-jackpot active map
    const newActiveMap: Record<string, boolean> = {};
    scrapedMatches.forEach((m) => {
      newActiveMap[m.match_no] = true;
    });
    setActiveSubJackpotMatches(newActiveMap);
    setSubJackpotSize(scrapedMatches.length > 0 ? scrapedMatches.length : 17);

    const timestampStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLastScrapedScreenshotTime(timestampStr);

    addLog(`[Screenshot OCR] ${msg}`);

    // Autosave scraped games from uploaded screenshot as most current Jackpot
    try {
      const payload = {
        matches: scrapedMatches,
        timestamp: new Date().toISOString(),
        timeStr: timestampStr,
        source: "Screenshot OCR (Autosaved)"
      };
      localStorage.setItem("mjp_autosaved_screenshot_jackpot", JSON.stringify(payload));
      addLog("[Autosave] Scraped games from screenshot automatically saved as current active Jackpot.");
    } catch (e) {
      console.warn("Could not save screenshot jackpot to localStorage", e);
    }

    if (currentUser) {
      saveScrapedJackpotToCloud(currentUser.uid, scrapedMatches);
    }

    showToast("Scraped games autosaved as most current Jackpot!", "success");
    if (scrapedMatches.length > 0) {
      handleAnalyzeMatch(scrapedMatches[0]);
    }
  };

  const handleMatchesParsed = (parsedMatches: Match[], msg: string) => {
    setMatches(parsedMatches);
    addLog(`[Pasted Coupon AI] ${msg}`);
    showToast(msg, "success");
    if (parsedMatches.length > 0) {
      handleAnalyzeMatch(parsedMatches[0]);
    }
  };

  // Date Range Filters states
  const [datePreset, setDatePreset] = useState<"current-week" | "all" | "today" | "tomorrow" | "archived" | "custom">("current-week");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Timeline/Simulated clock states
  const [simulatedTime, setSimulatedTime] = useState<Date>(() => {
    return new Date("2026-05-30T14:00:00");
  });
  const [manuallyStarted, setManuallyStarted] = useState<Record<string, boolean>>({});

  // Helper function to parse kickoff string into a Date object
  const parseMatchDate = (kickoff: string): Date | null => {
    if (!kickoff) return null;
    // Look for DD/MM/YY
    const match = kickoff.match(/(\d{2})\/(\d{2})\/(\d{2}|\d{4})/);
    if (match) {
      const d = parseInt(match[1]);
      const m = parseInt(match[2]) - 1;
      let y = parseInt(match[3]);
      if (y < 100) y += 2000; // e.g. 26 -> 2026
      
      // Check if time is also in kickoff, like "19:00"
      const timeMatch = kickoff.match(/(\d{2}):(\d{2})/);
      const hours = timeMatch ? parseInt(timeMatch[1]) : 0;
      const minutes = timeMatch ? parseInt(timeMatch[2]) : 0;
      
      return new Date(y, m, d, hours, minutes);
    }
    return null;
  };

  // Helper to check if a match is started/locked
  const isMatchStarted = (match: Match): boolean => {
    if (manuallyStarted[match.match_no]) return true;
    const mDate = parseMatchDate(match.kickoff);
    if (!mDate) return false;
    // Older archived matches are always started/completed unless from screenshot
    if (!jackpotSource.includes("Screenshot") && mDate < new Date("2026-05-30T00:00:00")) return true;
    return mDate <= simulatedTime;
  };

  // Helper to auto-select N matches based on AI predictability scores
  const optimizeSubJackpotSubsets = (size: number, currentMatches = matches) => {
    // Current week matches of interest (excluding past archived games unless screenshot)
    const currentJackpotMatches = currentMatches.filter((m) => {
      if (jackpotSource.includes("Screenshot")) return true;
      const mDate = parseMatchDate(m.kickoff);
      return !mDate || mDate >= new Date("2026-05-30T00:00:00");
    });

    const unstarted = currentJackpotMatches.filter((m) => !isMatchStarted(m));
    const started = currentJackpotMatches.filter((m) => isMatchStarted(m));

    const included: Record<string, boolean> = {};
    // Initialize all matches to false
    currentMatches.forEach((m) => {
      included[m.match_no] = false;
    });

    const getScoredCandidates = (candidates: Match[]) => {
      return candidates.map((m) => {
        const p1 = m.predictionStats?.["1"] || 33;
        const pX = m.predictionStats?.["X"] || 33;
        const p2 = m.predictionStats?.["2"] || 34;
        const maxCertainty = Math.max(p1, pX, p2);
        const maxOddsDiff = Math.abs(m.odds["1"] - m.odds["2"]);
        const score = maxCertainty + (maxOddsDiff * 2);
        return { match_no: m.match_no, score };
      }).sort((a, b) => b.score - a.score);
    };

    if (size >= 17) {
      // In 17-game full mode, all unarchived matches are included
      currentJackpotMatches.forEach((m) => {
        included[m.match_no] = true;
      });
      return included;
    }

    if (unstarted.length >= size) {
      // Pick top `size` from unstarted matches
      const scored = getScoredCandidates(unstarted);
      scored.slice(0, size).forEach((item) => {
        included[item.match_no] = true;
      });
    } else {
      // Include all unstarted matches
      unstarted.forEach((m) => {
        included[m.match_no] = true;
      });
      // Supplement with started matches to reach exactly `size` (usually 13)
      const remainingNeeded = size - unstarted.length;
      if (remainingNeeded > 0) {
        const scoredStarted = getScoredCandidates(started);
        scoredStarted.slice(0, remainingNeeded).forEach((item) => {
          included[item.match_no] = true;
        });
      }
    }

    return included;
  };

  const isMatchActive = (matchNo: string, activeMapOverride?: Record<string, boolean>): boolean => {
    const matchObj = matches.find((m) => m.match_no === matchNo);
    if (!matchObj) return false;

    // Archived matches are NEVER active in any sub-jackpot slip unless from screenshot
    const mDate = parseMatchDate(matchObj.kickoff);
    if (!jackpotSource.includes("Screenshot") && mDate && mDate < new Date("2026-05-30T00:00:00")) {
      return false;
    }

    // Handled size dependencies
    if (subJackpotSize >= 17) {
      // For full mode, all current week or screenshot matches are active
      return jackpotSource.includes("Screenshot") || !mDate || mDate >= new Date("2026-05-30T00:00:00");
    }

    const mapToUse = activeMapOverride || activeSubJackpotMatches;
    
    // In sub-jackpot modes, a match is active only if it is explicitly set to true.
    // If the map has no active items (or is completely uninitialized/empty), we dynamically
    // set or fallback to the auto-optimized subset to avoid an invalid empty state.
    const activeCount = Object.values(mapToUse).filter((v) => v === true).length;
    if (activeCount === 0 || activeCount > subJackpotSize) {
      const fallbackMap = optimizeSubJackpotSubsets(subJackpotSize);
      return fallbackMap[matchNo] === true;
    }
    return mapToUse[matchNo] === true;
  };

  const handleSubJackpotSizeChange = (newSize: number) => {
    setSubJackpotSize(newSize);
    const updatedIncluded = optimizeSubJackpotSubsets(newSize);
    setActiveSubJackpotMatches(updatedIncluded);
    
    addLog(`[Sub-Jackpot] Switched pool size to MJP${newSize === 17 ? "" : newSize}. System auto-selected top ${newSize} fixtures with highest predictability ratings.`);
    showToast(`Switched target to MJP${newSize === 17 ? " Mega Jackpot" : ` Sub-Jackpot (${newSize} matches)`}! Slip optimized.`, "success");
  };

  const toggleSubJackpotMatch = (matchNo: string) => {
    if (subJackpotSize === 17) {
      showToast("All 17 matches are required for the full Mega Jackpot.", "info");
      return;
    }

    setActiveSubJackpotMatches((prev) => {
      let currentMap = { ...prev };
      const activeCountBefore = Object.values(currentMap).filter((v) => v === true).length;
      if (activeCountBefore === 0 || activeCountBefore > subJackpotSize) {
        currentMap = optimizeSubJackpotSubsets(subJackpotSize);
      }
      
      const isCurrentlyActive = currentMap[matchNo] === true;
      const next = { ...currentMap };

      const activeCount = Object.values(next).filter((v) => v === true).length;

      if (isCurrentlyActive) {
        if (activeCount <= subJackpotSize) {
          showToast(`Cannot exclude. Exactly ${subJackpotSize} matches are required for MJP${subJackpotSize}.`, "warning");
          return prev;
        }
        next[matchNo] = false;
        addLog(`[Sub-Jackpot] Manually excluded Match #${matchNo} from active slip.`);
      } else {
        if (activeCount >= subJackpotSize) {
          // find active match with lowest score to swap
          const activeMatchScores = matches
            .filter((m) => next[m.match_no] === true)
            .map((m) => {
              const p1 = m.predictionStats?.["1"] || 33;
              const pX = m.predictionStats?.["X"] || 33;
              const p2 = m.predictionStats?.["2"] || 34;
              const maxCertainty = Math.max(p1, pX, p2);
              const maxOddsDiff = Math.abs(m.odds["1"] - m.odds["2"]);
              const score = maxCertainty + (maxOddsDiff * 2);
              return { match_no: m.match_no, score };
            });
          
          activeMatchScores.sort((a, b) => a.score - b.score);
          
          if (activeMatchScores.length > 0) {
            const lowestMatchNo = activeMatchScores[0].match_no;
            next[lowestMatchNo] = false;
            next[matchNo] = true;
            addLog(`[Sub-Jackpot] Swapped out under-performing Match #${lowestMatchNo} for Match #${matchNo} in MJP${subJackpotSize} slip.`);
            showToast(`Swapped Match #${lowestMatchNo} for Match #${matchNo} to keep exactly ${subJackpotSize} games.`, "info");
          } else {
            next[matchNo] = true;
          }
        } else {
          next[matchNo] = true;
          addLog(`[Sub-Jackpot] Included Match #${matchNo} in active slip.`);
        }
      }
      return next;
    });
  };

  // Global toggle state to show or hide consensus predictions bar inside match spreadsheet
  const [showAiPredictions, setShowAiPredictions] = useState<boolean>(() => {
    try {
      const persisted = localStorage.getItem("mjp_show_ai_predictions");
      return persisted !== null ? JSON.parse(persisted) : true;
    } catch {
      return true;
    }
  });

  const toggleShowAiPredictions = () => {
    setShowAiPredictions((prev) => {
      const next = !prev;
      localStorage.setItem("mjp_show_ai_predictions", JSON.stringify(next));
      addLog(`[UI] Displaying AI prediction consensus bars: ${next ? "ENABLED" : "DISABLED"}`);
      return next;
    });
  };

  const toggleLockMatch = (matchNo: string) => {
    setLockedMatches((prev) => {
      const updated = { ...prev, [matchNo]: !prev[matchNo] };
      localStorage.setItem("mjp_locked_matches", JSON.stringify(updated));
      addLog(`[Lock] ${updated[matchNo] ? "Locked / Frozen" : "Unlocked"} selection for Match #${matchNo}`);
      return updated;
    });
  };

  const toggleNotification = (matchNo: string, homeTeam: string, awayTeam: string, kickoffTime: string) => {
    setNotifiedMatches((prev) => {
      const updated = { ...prev, [matchNo]: !prev[matchNo] };
      localStorage.setItem("mjp_notified_matches", JSON.stringify(updated));
      
      const enabling = updated[matchNo];
      if (enabling) {
        addLog(`[Notification] Subscribed to 30-min kickoff alerts for Match #${matchNo} (${homeTeam} vs ${awayTeam})`);
        
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "default") {
            Notification.requestPermission().then((permission) => {
              addLog(`[Notification] Browser notification permission: ${permission}`);
              if (permission === "granted") {
                triggerTestNotification(matchNo, homeTeam, awayTeam, kickoffTime);
              }
            });
          } else if (Notification.permission === "granted") {
            triggerTestNotification(matchNo, homeTeam, awayTeam, kickoffTime);
          } else {
            showToast("Kickoff alerts enabled internally! Note: Browser notifications are currently blocked by your system settings.", "info");
          }
        } else {
          showToast(`Alert set! We will notify you 30 minutes before ${homeTeam} vs ${awayTeam} kicks off.`, "success");
        }
      } else {
        addLog(`[Notification] Unsubscribed from Match #${matchNo} kickoff alerts.`);
        showToast(`Muted notifications for Match #${matchNo}.`, "info");
      }
      
      return updated;
    });
  };

  const triggerTestNotification = (matchNo: string, homeTeam: string, awayTeam: string, kickoffTime: string) => {
    try {
      const title = `Kickoff Alert Set • Match #${matchNo}`;
      const options = {
        body: `We will notify you 30 minutes before ${homeTeam} vs ${awayTeam} kicks off (${kickoffTime}).`,
        icon: "/favicon.ico",
        silent: false
      };
      new Notification(title, options);
      showToast(`Notification channel verified! You will receive an alert 30 minutes before kickoff.`, "success");
    } catch (e) {
      showToast(`Kickoff alert set! Reminders will trigger 30 minutes before ${homeTeam} vs ${awayTeam} kicks off (${kickoffTime}).`, "success");
    }
  };

  // Target ref for auto-scrolling terminal logs
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial jackpot dataset from server
  useEffect(() => {
    fetchMatches();
  }, []);

  // Update terminal scrolling
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  // Load initial analysis for first match once matches are loaded
  useEffect(() => {
    if (matches.length > 0 && !selectedMatch) {
      handleAnalyzeMatch(matches[0]);
    }
  }, [matches]);

  // Sync active sub-jackpot matches configuration when matches list initially loads
  useEffect(() => {
    if (matches.length > 0) {
      setActiveSubJackpotMatches((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        const initial: Record<string, boolean> = {};
        matches.forEach((m) => {
          initial[m.match_no] = true;
        });
        return initial;
      });
    }
  }, [matches]);

  // Dynamically adapt sub-jackpot choices and sizes as simulated time changes and games kick off
  useEffect(() => {
    if (matches.length === 0) return;

    // Count unarchived matches (current week's jackpot)
    const currentJackpotMatches = matches.filter((m) => {
      if (jackpotSource.includes("Screenshot")) return true;
      const mDate = parseMatchDate(m.kickoff);
      return !mDate || mDate >= new Date("2026-05-30T00:00:00");
    });

    if (currentJackpotMatches.length === 0) return;

    const startedMatchesInJackpot = currentJackpotMatches.filter((m) => isMatchStarted(m));
    const startedCount = startedMatchesInJackpot.length;
    const unstartedCount = currentJackpotMatches.length - startedCount;

    // Adjust sub-jackpot size if started games exclude available selection options below active target size
    if (unstartedCount >= 13) {
      if (subJackpotSize > unstartedCount) {
        setSubJackpotSize(unstartedCount);
        const updatedIncluded = optimizeSubJackpotSubsets(unstartedCount);
        setActiveSubJackpotMatches(updatedIncluded);
        addLog(`[Clock Sim] MJP coupon size forced down to MJP${unstartedCount} because ${startedCount} fixture(s) have started.`);
        showToast(`Betting coupon size adjusted to MJP${unstartedCount} (unstarted games).`, "warning");
      } else {
        // Redo optimization on the current size to make sure started matches are correctly excluded and unstarted are chosen
        const updatedIncluded = optimizeSubJackpotSubsets(subJackpotSize);
        setActiveSubJackpotMatches(updatedIncluded);
      }
    } else {
      // Down to under 13 unstarted matches, so we MUST use MJP13 (minimum SportPesa coupon) and supplement with started games
      if (subJackpotSize !== 13) {
        setSubJackpotSize(13);
        const updatedIncluded = optimizeSubJackpotSubsets(13);
        setActiveSubJackpotMatches(updatedIncluded);
        addLog(`[Clock Sim] Crucial: Under 13 unstarted matches. MJP13 forced containing a blend of locked started games.`);
        showToast("Down to 13 sub-jackpots! Active coupon includes necessary finished legs to maintain minimum MJP13 requirements.", "info");
      } else {
        const updatedIncluded = optimizeSubJackpotSubsets(13);
        setActiveSubJackpotMatches(updatedIncluded);
      }
    }
  }, [simulatedTime, manuallyStarted, matches.length]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setTerminalLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const showToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const fetchHistoricalPayouts = async () => {
    try {
      setLoadingHistorical(true);
      const res = await fetch("/api/historical-payouts");
      if (!res.ok) throw new Error("Could not retrieve historical payout data.");
      const data = await res.json();
      setHistoricalPayouts(data.historicalPayouts);
      addLog("Retrieved historical jackpot payout records and performance stats matrices.");
    } catch (e: any) {
      showToast(e.message || "Could not fetch historical data.", "warning");
      addLog(`[Error] Historical fetch failed: ${e.message}`);
    } finally {
      setLoadingHistorical(false);
    }
  };

  // Firebase Authentication mount listener & Profile synchronizer
  useEffect(() => {
    setIsAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (userObj) => {
      setCurrentUser(userObj);
      setIsAuthLoading(false);
      
      if (userObj) {
        addLog(`[Auth] User authenticated as ${userObj.email}`);
        
        // Synchronously upsert user details in Firebase `/users/{userId}` to track active preferences
        try {
          const userDocRef = doc(db, "users", userObj.uid);
          await setDoc(userDocRef, {
            uid: userObj.uid,
            email: userObj.email || "",
            createdAt: userObj.metadata.creationTime || new Date().toISOString(),
            lastActiveAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.error("Could not record active user profile in Firestore", err);
        }

        // Fetch user saved slips instantly
        fetchCloudCoupons(userObj.uid);
      } else {
        setCloudCoupons([]);
        addLog("[Auth] User signed out.");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      addLog("[Auth] Initiating Google sign-in workflow...");
      const result = await signInWithPopup(auth, googleProvider);
      showToast(`Welcome back, ${result.user.displayName || "Client"}!`, "success");
    } catch (err: any) {
      console.error("Google Authentication error:", err);
      showToast(err.message || "Failed to authenticate with Google.", "warning");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast("Signed out successfully.", "info");
    } catch (err: any) {
      showToast("Failed to end session.", "warning");
    }
  };

  const fetchCloudCoupons = async (userIdOverride?: string) => {
    const uid = userIdOverride || currentUser?.uid;
    if (!uid) return;

    setLoadingCloudCoupons(true);
    const path = `users/${uid}/coupons`;
    try {
      const q = collection(db, path);
      const snapshot = await getDocs(q);
      const coupons = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      // Sort in-memory by date descending
      coupons.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCloudCoupons(coupons);
      addLog(`[Firestore] Synced ${coupons.length} coupons from your secure cloud catalog.`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.LIST, path);
    } finally {
      setLoadingCloudCoupons(false);
    }
  };

  const handleSaveCouponCloud = async (customName: string) => {
    if (!currentUser) {
      showToast("Please sign in to upload slips to your secure Firebase account.", "warning");
      return;
    }
    
    const name = customName.trim() || `My Accumulator Slip (${subJackpotSize} games)`;
    if (Object.keys(selections).length === 0) {
      showToast("Your current accumulator slip is empty. Please check some outcomes first.", "warning");
      return;
    }

    setSavingCoupon(true);
    const couponId = `coupon_${Date.now()}`;
    const path = `users/${currentUser.uid}/coupons/${couponId}`;

    // Filter current selections to only active ones if subJackpot is applied
    const activeSelections: Record<string, string[]> = {};
    matches.forEach((m) => {
      if (isMatchActive(m.match_no) && selections[m.match_no]?.length > 0) {
        activeSelections[m.match_no] = selections[m.match_no];
      }
    });

    // Compute combinations count
    let comb = 1;
    Object.keys(activeSelections).forEach((mNo) => {
      comb *= activeSelections[mNo].length;
    });
    const computedCost = comb * 99; // Kenya SportPesa rate per line (99 KES)

    const payload = {
      id: couponId,
      userId: currentUser.uid,
      name,
      selections: activeSelections,
      subJackpotSize,
      strategy: activeStrategy || "Custom Picks",
      cost: computedCost,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "users", currentUser.uid, "coupons", couponId), payload);
      showToast(`Slip "${name}" uploaded and locked successfully!`, "success");
      setNewCouponName("");
      setStrategySnapshot(JSON.stringify(selections));
      setHasUnsavedStrategyEdits(false);
      fetchCloudCoupons(currentUser.uid);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, path);
      showToast("Failed to lock slip to Cloud.", "warning");
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleDeleteCouponCloud = async (couponId: string) => {
    if (!currentUser) return;
    const path = `users/${currentUser.uid}/coupons/${couponId}`;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "coupons", couponId));
      showToast("Slip permanently deleted from Cloud storage.", "info");
      fetchCloudCoupons(currentUser.uid);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, path);
      showToast("Failed to remove slip.", "warning");
    }
  };

  const handleLoadCouponCloud = (coupon: any) => {
    try {
      setSelections(coupon.selections);
      setSubJackpotSize(coupon.subJackpotSize);
      setActiveStrategy(coupon.strategy || "");
      
      // Update activeSubJackpotMatches based on the loaded coupon's selections keys
      const activeMap: Record<string, boolean> = {};
      matches.forEach((m) => {
        activeMap[m.match_no] = coupon.selections[m.match_no] !== undefined;
      });
      setActiveSubJackpotMatches(activeMap);
      
      addLog(`Loaded cloud slip "${coupon.name}" with ${Object.keys(coupon.selections).length} choices.`);
      showToast(`Loaded slip "${coupon.name}" successfully!`, "success");
      setShowCloudModal(false);
    } catch (err) {
      showToast("Could not parse options from loaded slip.", "warning");
    }
  };

  // 1. Session recovery check on mount & Autosaved Screenshot Jackpot restore
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mjp_selections");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Object.keys(parsed).length > 0) {
          setSavedBackup(parsed);
          setRestoreAvailable(true);
          addLog("Found previous selections cache. Recovery notification prepared.");
        }
      }

      // Restore autosaved screenshot jackpot dataset if available
      const autosavedScreenshot = localStorage.getItem("mjp_autosaved_screenshot_jackpot");
      if (autosavedScreenshot) {
        const parsedScreenshot = JSON.parse(autosavedScreenshot);
        if (Array.isArray(parsedScreenshot.matches) && parsedScreenshot.matches.length === 17) {
          setMatches(parsedScreenshot.matches);
          setJackpotSource("Screenshot OCR (Autosaved)");
          if (parsedScreenshot.timeStr) setLastScrapedScreenshotTime(parsedScreenshot.timeStr);
          addLog("[Autosave] Loaded autosaved screenshot jackpot dataset (17 games).");
        }
      }
    } catch (e) {
      console.warn("Could not read saved session data from localStorage:", e);
    }
  }, []);

  // 2. Selections auto-saver watcher
  useEffect(() => {
    if (loading) return; // Wait until initial files and structures are loaded
    if (Object.keys(selections).length > 0) {
      localStorage.setItem("mjp_selections", JSON.stringify(selections));
    } else {
      localStorage.removeItem("mjp_selections");
    }
  }, [selections, loading]);

  // 3. Watch for selection changes after strategy generation to set unsaved changes flag
  useEffect(() => {
    if (strategySnapshot !== null) {
      const currentSelectionsStr = JSON.stringify(selections);
      if (currentSelectionsStr !== strategySnapshot) {
        setHasUnsavedStrategyEdits(true);
        setDismissedUnsavedNotification(false);
      } else {
        setHasUnsavedStrategyEdits(false);
      }
    }
  }, [selections, strategySnapshot]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/matches");
      if (!res.ok) throw new Error("Could not retrieve SportPesa Mega Jackpot matches.");
      const data = await res.json();
      setMatches(data.matches);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Network synchronization failure");
    } finally {
      setLoading(false);
    }
  };

  // Run live scraping simulation
  const handleScrape = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    addLog("Connecting to SportPesa Mega Jackpot portal (https://ke.sportpesa.com/en/mega-jackpot-pro)...");
    
    try {
      addLog("Extracting live 17-match fixture dataframe & current market prices...");

      const res = await fetch("/api/matches/scrape", { method: "POST" });
      if (!res.ok) throw new Error("Failed to scrape live SportPesa portal data");
      
      const data = await res.json();
      if (Array.isArray(data.matches) && data.matches.length > 0) {
        setMatches(data.matches);
        
        addLog("Successfully extracted current SportPesa MJP live 17-leg coupon!");
        addLog("Update complete. 17 matches synchronized with live bookie prices.");
        showToast("Jackpot matches successfully synchronized with SportPesa Kenya portal!", "success");

        // Auto analyze the currently selected match or first match with fresh odds
        if (selectedMatch) {
          const updatedMatch = data.matches.find((m: any) => String(m.match_no) === String(selectedMatch.match_no)) || data.matches[0];
          handleAnalyzeMatch(updatedMatch);
        } else {
          handleAnalyzeMatch(data.matches[0]);
        }
      } else {
        throw new Error("No matches returned from scraper endpoint.");
      }
    } catch (e: any) {
      addLog(`[Error] Scrape failure: ${e.message}`);
      showToast("Unable to reach live SportPesa portal API. Showing fallback dataset.", "warning");
    } finally {
      setIsSyncing(false);
    }
  };

  // Perform AI or simulated detailed match analysis
  const handleAnalyzeMatch = async (match: Match, requestedFallback?: string) => {
    setSelectedMatch(match);
    setIsAnalyzing(true);
    setActiveFallbackEngine(requestedFallback);
    addLog(`Analyzing Match #${match.match_no}: ${match.home} vs ${match.away}${requestedFallback ? ` via ${requestedFallback}` : ""}...`);

    try {
      const res = await fetch("/api/analyze-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match, requestedFallback }),
      });
      if (!res.ok) throw new Error("Match analysis failed");
      const data = await res.json();
      setAnalysis(data);
      addLog(`Intelligence generated for Match #${match.match_no}. Conf: ${data.confidence}, Pick: ${data.suggestedPick}`);
    } catch (e: any) {
      addLog(`[Error] Match #${match.match_no} analysis failed: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Call the predictive accumulative slip generator
  const handleGenerateSlip = async (strategy: "conservative" | "ai-balanced" | "bold") => {
    addLog(`Fulfilling strategy permutation build: '${strategy.toUpperCase()}'...`);
    setIsSyncing(true);

    try {
      const res = await fetch("/api/generate-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy }),
      });
      if (!res.ok) throw new Error("Failed to build strategy slip coupon");
      const data = await res.json();
      
      // Respect locked matches and keep user-selected outcomes frozen during mass strategy updates
      let finalSelections: Record<string, string[]> = { ...data.selections };
      setSelections((prev) => {
        const merged = { ...data.selections };
        matches.forEach((m) => {
          if (lockedMatches[m.match_no]) {
            if (prev[m.match_no]) {
              merged[m.match_no] = prev[m.match_no];
            } else {
              delete merged[m.match_no];
            }
          }
        });
        finalSelections = merged;
        return merged;
      });

      setActiveStrategy(strategy);
      setLastGeneratedStrategy(strategy);
      setStrategySnapshot(JSON.stringify(finalSelections));
      setHasUnsavedStrategyEdits(false);
      setDismissedUnsavedNotification(false);
      setStrategyJustification(data.justification);
      setIsStratRateLimited(!!data.rateLimited);
      
      const lockedCount = Object.values(lockedMatches).filter(Boolean).length;
      if (lockedCount > 0) {
        addLog(`Filled permutation coupon with '${strategy.toUpperCase()}' options (skipping ${lockedCount} locked match rows).`);
        showToast(`Strategy '${strategy.toUpperCase()}' applied, protecting ${lockedCount} locked matchups!`, "success");
      } else {
        addLog(`Permutation coupon filled with strategy selections! Cost updated.`);
        showToast(`Selected ${strategy.toUpperCase()} strategy across all 17 matches!`, "success");
      }
    } catch (e: any) {
      addLog(`[Error] Strategy build failed: ${e.message}`);
      showToast("Coupons could not be populated. Please select manually.", "warning");
    } finally {
      setIsSyncing(false);
    }
  };

  // Ingest custom pasted JSON array
  const handleIngestCustomJackpot = async () => {
    try {
      const parsed = JSON.parse(customJsonInput);
      const matchesArray = Array.isArray(parsed) ? parsed : parsed.matches;
      
      if (!Array.isArray(matchesArray) || matchesArray.length !== 17) {
        throw new Error("Target file must contain an array of exactly 17 matches");
      }

      addLog("Parsing custom user-uploaded jackpot configuration...");
      const res = await fetch("/api/matches/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matches: matchesArray }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Pasted JSON structure rejected by server");
      }

      const data = await res.json();
      setMatches(data.matches);
      setSelections({}); // Clear old selections
      setShowJsonModal(false);
      setCustomJsonInput("");
      
      addLog("Custom SportPesa jackpot matches updated successfully.");
      showToast("Custom SportPesa 17-match jackpot uploaded successfully!", "success");
      
      if (data.matches.length > 0) {
        handleAnalyzeMatch(data.matches[0]);
      }
    } catch (e: any) {
      showToast(`Upload failed: ${e.message}`, "warning");
      addLog(`[Upload Error] ${e.message}`);
    }
  };

  // Toggle user outcome prediction picks
  const handleSelectOutcome = (matchNo: string, outcome: string) => {
    setSelections((prev) => {
      const current = prev[matchNo] || [];
      const updated = current.includes(outcome)
        ? current.filter((o) => o !== outcome)
        : [...current, outcome];
      
      const newSelections = { ...prev };
      if (updated.length === 0) {
        delete newSelections[matchNo];
      } else {
        newSelections[matchNo] = updated;
      }

      // Reset strategy highlighting when user starts custom edits
      if (activeStrategy) {
        setActiveStrategy("");
        setStrategyJustification("");
      }

      return newSelections;
    });
  };

  // One-click removal of all selections for a specific leg/match
  const handleClearLeg = (matchNo: string) => {
    setSelections((prev) => {
      const newSelections = { ...prev };
      delete newSelections[matchNo];
      return newSelections;
    });
    addLog(`[Summary Drawer] Cleared all outcome selections for Leg #${matchNo}.`);
    showToast(`Cleared Leg #${matchNo} picks`, "info");
  };

  // One-click removal of all selections across all 17 jackpot legs
  const handleClearAllSelections = () => {
    setSelections({});
    addLog(`[Summary Drawer] Cleared all selections across all jackpot matches.`);
    showToast("Cleared all outcomes from coupon slip", "info");
  };

  // Calculate permutation size & price
  // Combinations is product of selected options sizes for all 17 matches (or active sub-jackpot ones indices)
  // If some matches have 0 selections, we assume 1 selection for combinations mapping
  const calculateCombinations = (): number => {
    let comb = 1;
    let countedAny = false;
    
    matches.forEach((m) => {
      // Ignore matches that are not active in the current sub-jackpot slip
      if (!isMatchActive(m.match_no)) {
        return;
      }
      const count = selections[m.match_no]?.length || 0;
      if (count > 0) {
        comb *= count;
        countedAny = true;
      }
    });

    return countedAny ? comb : 0;
  };

  const totalCombinations = calculateCombinations();
  const estimatedCost = totalCombinations * baseStake;

  const getActiveSelectionsCount = (): number => {
    return matches.filter((m) => {
      if (!isMatchActive(m.match_no)) return false;
      return (selections[m.match_no]?.length || 0) > 0;
    }).length;
  };

  // Generate exporting schema data structure
  const getExportData = (format: "json" | "csv" | "telegram") => {
    const exportRows = matches.map((m) => {
      const userPick = selections[m.match_no]?.join("+") || "NONE";
      return {
        match_no: m.match_no,
        kickoff: m.kickoff,
        home: m.home,
        away: m.away,
        odds_home: m.odds["1"],
        odds_draw: m.odds["X"],
        odds_away: m.odds["2"],
        league: m.league || "",
        user_pick: userPick,
        consensus_1: m.predictionStats?.["1"] || 33,
        consensus_X: m.predictionStats?.["X"] || 33,
        consensus_2: m.predictionStats?.["2"] || 34,
      };
    });

    let dataStr = "";
    let fileType = "";
    let fileName = "";

    if (format === "json") {
      dataStr = JSON.stringify({
        jackpot_id: "MJP_20260530",
        currency: "Ksh",
        ticket_cost_single_line: 99,
        system_combinations: totalCombinations,
        total_estimated_price: estimatedCost,
        exported_at: new Date().toISOString(),
        selections,
        matches: exportRows,
      }, null, 2);
      fileType = "application/json";
      fileName = "sportpesa_mjp_current.json";
    } else if (format === "telegram") {
      dataStr = formatTelegramCouponMessage();
      fileType = "text/plain";
      fileName = "sportpesa_mjp_telegram_coupon.txt";
    } else {
      // Generate CSV string
      const headers = ["Match No", "Kickoff", "Home Team", "Away Team", "Odds 1", "Odds X", "Odds 2", "League", "My Pick", "Consensus Home", "Consensus Draw", "Consensus Away"];
      const rows = exportRows.map((r) => [
        r.match_no,
        `"${r.kickoff}"`,
        `"${r.home}"`,
        `"${r.away}"`,
        r.odds_home,
        r.odds_draw,
        r.odds_away,
        `"${r.league}"`,
        `"${r.user_pick}"`,
        r.consensus_1,
        r.consensus_X,
        r.consensus_2,
      ]);
      dataStr = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      fileType = "text/csv";
      fileName = "sportpesa_mjp.csv";
    }

    return { dataStr, fileName, fileType };
  };

  // Format current active jackpot coupon into a Telegram-friendly message structure with emojis, bold text, and odds summary
  const formatTelegramCouponMessage = (): string => {
    const sortedMatches = [...matches]
      .filter((m) => {
        const num = parseInt(m.match_no);
        return num >= 1 && num <= 17;
      })
      .sort((a, b) => parseInt(a.match_no) - parseInt(b.match_no));

    const activeMatchesInCoupon = sortedMatches.filter((m) => isMatchActive(m.match_no));
    const activeSelectionsCount = getActiveSelectionsCount();

    let message = `⚽ *SPORTPESA MEGA JACKPOT PRO* ⚽\n`;
    message += `🏆 *Coupon:* MJP${subJackpotSize} (${subJackpotSize} Fixtures)\n`;
    message += `📊 *Strategy:* ${activeStrategy ? activeStrategy.toUpperCase() : "CUSTOM PICKS"}\n`;
    message += `📱 *SMS Bet Code:* \`${getSportPesaSMSCode()}\` (Send to 79079)\n`;
    message += `------------------------------------\n\n`;

    let totalOddsSum = 0;
    let pickedOddsCount = 0;

    activeMatchesInCoupon.forEach((m) => {
      const picks = selections[m.match_no] || [];
      const isDouble = picks.length === 2;
      const isTriple = picks.length === 3;

      message += `📌 *Match #${m.match_no}*: ${m.home} vs ${m.away}\n`;
      if (m.league) {
        message += `   League: ${m.league} | Kickoff: ${m.kickoff || "TBD"}\n`;
      }

      if (picks.length === 0) {
        message += `   Pick: ⚠️ *Unselected*\n\n`;
      } else {
        const pickDetails: string[] = [];
        picks.forEach((p) => {
          const oddVal = m.odds[p as "1" | "X" | "2"];
          const outcomeLabel = p === "1" ? "Home" : p === "X" ? "Draw" : "Away";
          if (typeof oddVal === "number") {
            pickDetails.push(`${p} (${outcomeLabel} @ ${oddVal.toFixed(2)})`);
            totalOddsSum += oddVal;
            pickedOddsCount++;
          } else {
            pickDetails.push(`${p} (${outcomeLabel})`);
          }
        });

        const pickTag = picks.join("");
        const comboLabel = isTriple ? " [TRIPLE COVER]" : isDouble ? " [DOUBLE COVER]" : "";
        message += `   Pick: *${pickTag}*${comboLabel} -> ${pickDetails.join(", ")}\n\n`;
      }
    });

    const avgOdds = pickedOddsCount > 0 ? totalOddsSum / pickedOddsCount : 0;

    message += `------------------------------------\n`;
    message += `💰 *COUPON ODDS & FINANCIAL SUMMARY*\n`;
    message += `🎯 *Picked Legs:* ${activeSelectionsCount} / ${subJackpotSize} active games\n`;
    message += `🎟️ *Permutations:* ${totalCombinations} line(s)\n`;
    message += `💵 *Total Ticket Price:* Ksh ${estimatedCost.toLocaleString()}\n`;
    if (avgOdds > 0) {
      message += `📈 *Average Selected Leg Odds:* ${avgOdds.toFixed(2)}\n`;
    }
    message += `🔥 *Estimated Jackpot Pool:* Ksh 389,000,000+\n`;
    message += `------------------------------------\n`;
    message += `⚡ *Quick Place via SMS:* Send \`${getSportPesaSMSCode()}\` to *79079*\n`;
    message += `🤖 _Generated with SportPesa MJP AI Predictor_`;

    return message;
  };

  // Open Telegram app with pre-filled message via tg:// link
  const openTelegramWithCoupon = () => {
    const formattedText = formatTelegramCouponMessage();
    const encodedText = encodeURIComponent(formattedText);

    // tg:// msg_url link to open native Telegram app directly with pre-filled message
    const tgProtocolUrl = `tg://msg_url?url=${encodeURIComponent(window.location.href)}&text=${encodedText}`;
    const tgWebUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodedText}`;

    addLog(`Formatting selected coupon into Telegram message structure & launching Telegram via tg:// link...`);
    showToast("Opening Telegram app with pre-filled coupon message!", "success");

    // Copy to clipboard as a helpful fallback for the user
    copyToClipboard(formattedText, "Telegram Coupon Message");

    try {
      window.location.href = tgProtocolUrl;

      // Fallback timer if native app doesn't open
      setTimeout(() => {
        window.open(tgWebUrl, "_blank", "noopener,noreferrer");
      }, 1200);
    } catch (err) {
      window.open(tgWebUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Export current jackpot metadata and user selections (opens copy/download/telegram modal)
  const handleExportData = (format: "json" | "csv" | "telegram") => {
    if (matches.length === 0) return;
    setExportModalFormat(format);
    setShowExportModal(true);
    addLog(`Opened jackpot coupon sharing portal with ${format.toUpperCase()} formatting.`);
  };

  // Triggers immediate file download from within the modal
  const triggerDownload = (format: "json" | "csv" | "telegram") => {
    const { dataStr, fileName, fileType } = getExportData(format);
    const blob = new Blob([dataStr], { type: fileType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog(`Export disk download complete: '${fileName}'.`);
    showToast(`File download complete: ${fileName} exported successfully!`, "success");
  };

  // Imports a previously exported coupon JSON or raw SMS/comma format string
  const handleImportSlip = (text: string) => {
    const cleaned = text.trim();
    if (!cleaned) {
      showToast("Please enter a valid JSON or SMS betting string to import.", "warning");
      return;
    }

    try {
      // 1. Try parsing as JSON first
      if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === "object") {
          // If they exported selections
          if (parsed.selections && typeof parsed.selections === "object") {
            const importedSelections: Record<string, string[]> = {};
            let validCount = 0;
            
            Object.entries(parsed.selections).forEach(([matchNo, picks]) => {
              if (Array.isArray(picks)) {
                // Ensure picks only contain '1', 'X', '2'
                const filtered = picks.filter(p => p === "1" || p === "X" || p === "2");
                importedSelections[matchNo] = filtered;
                if (filtered.length > 0) validCount++;
              }
            });

            if (validCount > 0) {
              setSelections(importedSelections);
              
              // Optionally parse sub-jackpot metadata
              if (typeof parsed.subJackpotSize === "number" && [13, 14, 15, 16, 17].includes(parsed.subJackpotSize)) {
                setSubJackpotSize(parsed.subJackpotSize);
              }
              if (parsed.activeSubJackpotMatches && typeof parsed.activeSubJackpotMatches === "object") {
                setActiveSubJackpotMatches(parsed.activeSubJackpotMatches);
              }

              addLog(`[System] Successfully imported ${validCount} match picks from saved JSON coupon config.`);
              showToast(`Imported ${validCount} selections successfully!`, "success");
              setShowImportModal(false);
              setImportText("");
              return;
            }
          }
        }
      }
    } catch (err) {
      // JSON failed, proceed to plain text / SMS string
    }

    // 2. Try parsing as SMS betting string or comma-separated outcomes
    // Supported formats:
    // MJP#1,X,2,1,...
    // MJP13#1,1,X...
    // 1,X,2,1,X,2,1,X,2,1,1,X,2,1,1,X,2 (17 comma separated outcomes)
    try {
      let picksPart = cleaned;
      let targetSize = subJackpotSize;
      
      if (cleaned.includes("#")) {
        const hashParts = cleaned.split("#");
        const prefix = hashParts[0].toUpperCase(); // e.g., MJP or MJP13
        picksPart = hashParts[1];
        
        if (prefix.startsWith("MJP")) {
          const numStr = prefix.replace("MJP", "");
          if (numStr) {
            const parsedSize = parseInt(numStr);
            if ([13, 14, 15, 16, 17].includes(parsedSize)) {
              targetSize = parsedSize;
            }
          } else {
            targetSize = 17; // standard MJP#
          }
        }
      }

      // Read entries separated by commas
      const rawPicks = picksPart.split(",").map(p => p.trim());
      if (rawPicks.length > 0) {
        // Find matches in chronological/numerical sequence
        const sortedActiveMatches = [...matches]
          .sort((a, b) => parseInt(a.match_no) - parseInt(b.match_no));

        if (sortedActiveMatches.length === 0) {
          throw new Error("No matches loaded in workspace.");
        }

        const newSelections: Record<string, string[]> = { ...selections };
        let filledCount = 0;

        // Map raw picks to matches
        rawPicks.forEach((pick, index) => {
          if (index < sortedActiveMatches.length) {
            const match = sortedActiveMatches[index];
            const upperPick = pick.toUpperCase();

            // Interpret typical signs: "1", "X", "2", combinations "1X", "X2", "12"
            let parsedPicks: string[] = [];
            if (upperPick.includes("1")) parsedPicks.push("1");
            if (upperPick.includes("X") || upperPick.includes("D")) parsedPicks.push("X");
            if (upperPick.includes("2")) parsedPicks.push("2");

            if (parsedPicks.length > 0) {
              newSelections[match.match_no] = parsedPicks;
              filledCount++;
            } else if (upperPick === "0" || upperPick === "-" || upperPick === "?") {
              newSelections[match.match_no] = [];
            }
          }
        });

        if (filledCount > 0) {
          setSelections(newSelections);
          setSubJackpotSize(targetSize);
          addLog(`[System] Parsed & imported ${filledCount} selections from SMS/CSV text string.`);
          showToast(`Imported ${filledCount} outcomes from betting code successfully!`, "success");
          setShowImportModal(false);
          setImportText("");
          return;
        }
      }
    } catch (e: any) {
      showToast(`Failed to parse file. Error: ${e.message || "Invalid syntax."}`, "warning");
      return;
    }

    showToast("Unrecognized format. Please provide valid JSON or SportPesa comma-separated coupon strings.", "warning");
  };

  // Generates copy-paste compatible selections strings for external betting slips
  const getSelectionsStringForFormat = (fmt: "comma" | "match-equal" | "whatsapp-text") => {
    const sortedMatches = [...matches].sort((a, b) => parseInt(a.match_no) - parseInt(b.match_no));
    
    if (fmt === "comma") {
      // e.g. "1,X,2,1X,12,..."
      return sortedMatches.map((m) => {
        const picks = selections[m.match_no];
        if (!picks || picks.length === 0) return "-";
        return picks.join(""); // double-chances merged as e.g. "1X"
      }).join(",");
    }

    if (fmt === "match-equal") {
      // e.g. "1=1, 2=X, 3=2, 4=12"
      return sortedMatches.map((m) => {
        const picks = selections[m.match_no];
        if (!picks || picks.length === 0) return `${m.match_no}=-`;
        return `${m.match_no}=${picks.join("")}`;
      }).join(", ");
    }

    // whatsapp-text / summary
    return sortedMatches.map((m) => {
      const picks = selections[m.match_no];
      const pickText = picks && picks.length > 0 ? picks.join("+") : "No pick";
      return `Match ${m.match_no} (${m.home} vs ${m.away}): ${pickText}`;
    }).join("\n");
  };

  // Copy utility for clipboard selections with visual feedback state
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextFeedback(label);
    setTimeout(() => setCopiedTextFeedback(null), 2000);
    addLog(`Copied data stream as '${label}' to system clipboard.`);
    showToast(`Copied ${label} to clipboard!`, "success");
  };

  // Generate SportPesa SMS format companion (MJP# or MJP13# + results in order separated by commas)
  const getSportPesaSMSCode = (): string => {
    if (matches.length === 0) return `MJP${subJackpotSize < 17 ? subJackpotSize : ""}#`;
    
    // Sort matches by match_no to preserve 1-17 order and exclude any potential beyond-range reference games
    const sortedMatches = [...matches]
      .filter((m) => {
        const num = parseInt(m.match_no);
        return num >= 1 && num <= 17;
      })
      .sort((a, b) => parseInt(a.match_no) - parseInt(b.match_no));
    
    const parts = sortedMatches.map((m) => {
      // If we are in sub-jackpot mode, and this match is excluded/skipped, it must be assigned '0'
      if (!isMatchActive(m.match_no)) {
        return "0";
      }

      const picks = selections[m.match_no];
      if (!picks || picks.length === 0) {
        return "?";
      }
      
      // SMS double-chances merged as sorted outcomes e.g. "1X" or "12" or "X2"
      const order: Record<string, number> = { "1": 1, "X": 2, "2": 3 };
      const sortedPicks = [...picks].sort((a, b) => order[a] - order[b]);
      return sortedPicks.join("");
    });

    const prefix = subJackpotSize < 17 ? `MJP${subJackpotSize}#` : "MJP#";
    return `${prefix}${parts.join(",")}`;
  };

  // Perform quick pick selection based on current strategy and doubleChanceCount
  const handleQuickPick = (countOverride?: number) => {
    const currentCount = typeof countOverride === "number" ? countOverride : doubleChanceCount;
    if (typeof countOverride === "number") {
      setDoubleChanceCount(countOverride);
    }
    addLog(`Fulfilling Quick Pick using '${activeStrategy ? activeStrategy.toUpperCase() : "AI-BALANCED"}' matching with ${currentCount} double-chance covers...`);
    
    // Fallback to "ai-balanced" if no strategy is actively selected
    let strat = activeStrategy;
    if (!strat || (strat !== "conservative" && strat !== "ai-balanced" && strat !== "bold")) {
      strat = "ai-balanced";
      setActiveStrategy("ai-balanced");
      setStrategyJustification("Balanced prediction optimization with double chance coverage overlay.");
    }

    const newSelections: Record<string, string[]> = {};

    // 1. Build the base selections for active matches
    matches.forEach((m) => {
      if (!isMatchActive(m.match_no)) {
        // Excluded sub-jackpot matches get no selections
        return;
      }

      // If a match is locked and we have an existing selection for it, respect and freeze it!
      if (lockedMatches[m.match_no] && selections[m.match_no]) {
        newSelections[m.match_no] = [...selections[m.match_no]];
        return;
      }

      // Otherwise evaluate the strategy model
      const odds1 = m.odds["1"];
      const oddsX = m.odds["X"];
      const odds2 = m.odds["2"];

      if (strat === "conservative") {
        // Odds favorite
        if (odds1 <= oddsX && odds1 <= odds2) {
          newSelections[m.match_no] = ["1"];
        } else if (odds2 <= odds1 && odds2 <= oddsX) {
          newSelections[m.match_no] = ["2"];
        } else {
          newSelections[m.match_no] = ["X"];
        }
      } else if (strat === "bold") {
        // High odds draw or unexpected value upset - deterministic based on index seed
        const seed = (parseInt(m.match_no) * 7 + 13) % 100;
        if (seed < 35) {
          newSelections[m.match_no] = ["X"];
        } else if (seed < 70) {
          // Upset representation
          if (odds2 >= odds1 && odds2 < 4.5) {
            newSelections[m.match_no] = ["2"];
          } else if (odds1 >= odds2 && odds1 < 4.5) {
            newSelections[m.match_no] = ["1"];
          } else {
            newSelections[m.match_no] = ["X"];
          }
        } else {
          // Favorite
          if (odds1 <= odds2) {
            newSelections[m.match_no] = ["1"];
          } else {
            newSelections[m.match_no] = ["2"];
          }
        }
      } else {
        // Balanced (tactical mix of favorite and draws)
        const seed = (parseInt(m.match_no) * 17 + 19) % 100;
        if (seed < 45) {
          // Favorite
          if (odds1 <= odds2) newSelections[m.match_no] = ["1"];
          else newSelections[m.match_no] = ["2"];
        } else if (seed < 75) {
          // Draw priority
          newSelections[m.match_no] = ["X"];
        } else {
          // Underdog Surprises
          if (odds2 >= odds1) newSelections[m.match_no] = ["2"];
          else newSelections[m.match_no] = ["1"];
        }
      }
    });

    // 2. Overlay double chances onto matches with the most uncertain (tightest) odds
    // Filter out matches that are locked or excluded from sub-jackpot slip.
    const candidates = matches.filter((m) => {
      if (lockedMatches[m.match_no]) return false;
      if (!isMatchActive(m.match_no)) return false;
      return true;
    });

    // Sort sorted matches by lower difference of home/away odds to identify tight matches
    candidates.sort((a, b) => {
      const diffA = Math.abs(a.odds["1"] - a.odds["2"]);
      const diffB = Math.abs(b.odds["1"] - b.odds["2"]);
      return diffA - diffB;
    });

    // Upgrade the top doubleChanceCount candidates to double-chance selections
    let actualDoubleChancesApplied = 0;
    for (let i = 0; i < candidates.length && actualDoubleChancesApplied < currentCount; i++) {
      const m = candidates[i];
      
      // Select the two options with the lowest odds (standard most likely outcomes)
      const options = [
        { key: "1", val: m.odds["1"] },
        { key: "X", val: m.odds["X"] },
        { key: "2", val: m.odds["2"] },
      ];
      options.sort((a, b) => a.val - b.val);

      newSelections[m.match_no] = [options[0].key, options[1].key];
      actualDoubleChancesApplied++;
    }

    setSelections(newSelections);
    
    const lockedCount = Object.values(lockedMatches).filter(Boolean).length;
    if (lockedCount > 0) {
      addLog(`[Quick Pick] Filled coupon with '${strat.toUpperCase()}' matching and ${currentCount} double chances for active MJP${subJackpotSize === 17 ? "" : subJackpotSize} slots.`);
      showToast(`Quick Pick applied! (Preserved ${lockedCount} locked rows & appended ${currentCount} double chances).`, "success");
    } else {
      addLog(`[Quick Pick] Filled coupon with '${strat.toUpperCase()}' matching and ${currentCount} double chances for active MJP${subJackpotSize === 17 ? "" : subJackpotSize} slots.`);
      showToast(`Quick Pick loaded! Created ${Math.pow(2, currentCount)} lines with ${currentCount} double chances.`, "success");
    }
  };

  // Automated Quick Fill on remaining vacant slots
  const handleAIQuickFillRemaining = () => {
    let filledCount = 0;
    setSelections((prev) => {
      const newSelections = { ...prev };
      matches.forEach((m) => {
        if (!isMatchActive(m.match_no)) return;
        
        const currentPicks = newSelections[m.match_no] || [];
        if (currentPicks.length === 0) {
          // Fill using prediction stats or odds favoritism
          let pick = "1";
          if (m.predictionStats) {
            const hVal = m.predictionStats["1"] || 0;
            const dVal = m.predictionStats["X"] || 0;
            const aVal = m.predictionStats["2"] || 0;
            if (hVal >= dVal && hVal >= aVal) {
              pick = "1";
            } else if (aVal >= hVal && aVal >= dVal) {
              pick = "2";
            } else {
              pick = "X";
            }
          } else {
            const o1 = m.odds["1"];
            const oX = m.odds["X"];
            const o2 = m.odds["2"];
            if (o1 <= oX && o1 <= o2) {
              pick = "1";
            } else if (o2 <= o1 && o2 <= oX) {
              pick = "2";
            } else {
              pick = "X";
            }
          }
          newSelections[m.match_no] = [pick];
          filledCount++;
        }
      });
      return newSelections;
    });

    if (filledCount > 0) {
      addLog(`[AI Helper] Analyzed algorithmic weights and filled ${filledCount} vacant legs.`);
      showToast(`AI successfully auto-filled ${filledCount} remaining legs!`, "success");
    } else {
      showToast("All your active slip legs are already filled!", "info");
    }
  };

  // Filter Match list based on search, league, and date range
  const filteredMatches = matches.filter((m) => {
    const matchesSearch =
      m.home.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.away.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.league && m.league.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.match_no === searchQuery;
    
    if (!matchesSearch) return false;

    // League filtering
    if (leagueFilter !== "All" && m.league !== leagueFilter) {
      return false;
    }

    // Date range filtering
    const mDate = parseMatchDate(m.kickoff);
    if (!mDate) return true; // If no date is parsed, pass through

    let passesDate = true;

    if (jackpotSource.includes("Screenshot") || datePreset === "all") {
      passesDate = true;
    } else if (datePreset === "current-week") {
      // Current week is defined as May 30, 2026 and May 31, 2026
      const start = new Date("2026-05-30T00:00:00");
      const end = new Date("2026-05-31T23:59:59");
      passesDate = mDate >= start && mDate <= end;
    } else if (datePreset === "today") {
      const start = new Date("2026-05-30T00:00:00");
      const end = new Date("2026-05-30T23:59:59");
      passesDate = mDate >= start && mDate <= end;
    } else if (datePreset === "tomorrow") {
      const start = new Date("2026-05-31T00:00:00");
      const end = new Date("2026-05-31T23:59:59");
      passesDate = mDate >= start && mDate <= end;
    } else if (datePreset === "archived") {
      // Prior to May 30, 2026
      passesDate = mDate < new Date("2026-05-30T00:00:00");
    }

    // Apply custom date range overrides if specified
    if (customStartDate) {
      const startLimit = new Date(customStartDate + "T00:00:00");
      if (mDate < startLimit) passesDate = false;
    }

    if (customEndDate) {
      const endLimit = new Date(customEndDate + "T23:59:59");
      if (mDate > endLimit) passesDate = false;
    }

    if (!passesDate) return false;

    // Apply smart filters
    if (smartFilter === "favorites") {
      const isHomeFav = m.odds["1"] <= 2.25 || (m.predictionStats && m.predictionStats["1"] >= 45);
      const isAwayFav = m.odds["2"] <= 2.25 || (m.predictionStats && m.predictionStats["2"] >= 45);
      return !!(isHomeFav || isAwayFav);
    } else if (smartFilter === "volatile") {
      const isTightRank = m.homeRank !== undefined && m.awayRank !== undefined && Math.abs(m.homeRank - m.awayRank) <= 4;
      const isLowPredictability = m.odds["X"] <= 3.05 || (m.predictionStats && Math.max(m.predictionStats["1"], m.predictionStats["X"], m.predictionStats["2"]) < 42);
      return !!(isTightRank || isLowPredictability);
    } else if (smartFilter === "draws") {
      const hasHighDrawStat = (m.predictionStats && m.predictionStats["X"] >= 31) || m.odds["X"] <= 3.10;
      return !!hasHighDrawStat;
    } else if (smartFilter === "value") {
      const hasConfidentAI = m.predictionStats && Math.max(m.predictionStats["1"], m.predictionStats["X"], m.predictionStats["2"]) >= 48;
      return !!hasConfidentAI;
    }

    return true;
  });

  // Helper to get sorted filtered matches
  const getSortedMatches = () => {
    const res = [...filteredMatches];
    if (!sortField) return res;
    
    res.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";
      
      if (sortField === "match_no") {
        valA = parseInt(a.match_no) || 0;
        valB = parseInt(b.match_no) || 0;
      } else if (sortField === "league") {
        valA = (a.league || "").toLowerCase();
        valB = (b.league || "").toLowerCase();
      } else if (sortField === "matchup") {
        valA = a.home.toLowerCase();
        valB = b.home.toLowerCase();
      } else if (sortField === "predictability") {
        const ap1 = a.predictionStats?.["1"] || 33;
        const apX = a.predictionStats?.["X"] || 33;
        const ap2 = a.predictionStats?.["2"] || 34;
        valA = Math.max(ap1, apX, ap2);
        
        const bp1 = b.predictionStats?.["1"] || 33;
        const bpX = b.predictionStats?.["X"] || 33;
        const bp2 = b.predictionStats?.["2"] || 34;
        valB = Math.max(bp1, bpX, bp2);
      }
      
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    
    return res;
  };

  const finalMatches = getSortedMatches();

  const handleSort = (field: "match_no" | "league" | "matchup" | "predictability") => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
        addLog(`[Sort] Set active column matches sort direction of '${field}' to DESCENDING.`);
      } else {
        setSortField(null);
        addLog(`[Sort] Disabled column matches sorting.`);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
      addLog(`[Sort] Multi-match column sorted by '${field}' ASCENDING.`);
    }
  };

  const handleResetFiltersAndSorting = () => {
    setSearchQuery("");
    setLeagueFilter("All");
    setSmartFilter("all");
    setBaseStake(99);
    setSortField(null);
    setSortDirection("asc");
    addLog("[Filter] Reset complete. Reverted spreadsheet search query, smart filter, base stake, category filter and columns sort direction to standard template values.");
    showToast("Filters, stakes, and column sorting reverted to defaults!", "info");
  };

  // Simulated outcomes & actual coupon resolver actions
  const handleSimulateOutcomes = () => {
    if (matches.length === 0) {
      showToast("No matches available to simulate results on.", "warning");
      return;
    }
    setIsResoluting(true);
    addLog("[Resolutor] Initializing live matchday resolution emulator...");
    
    const currentOutcomes: Record<string, "1" | "X" | "2"> = {};
    
    matches.forEach((m, i) => {
      const homeOdds = m.odds["1"];
      const drawOdds = m.odds["X"];
      const awayOdds = m.odds["2"];
      
      const invHome = 1.0 / Math.max(0.1, homeOdds);
      const invDraw = 1.0 / Math.max(0.1, drawOdds);
      const invAway = 1.0 / Math.max(0.1, awayOdds);
      const sumInv = invHome + invDraw + invAway;
      
      const p1 = invHome / sumInv;
      const pX = invDraw / sumInv;
      
      const r = Math.random();
      let res: "1" | "X" | "2" = "1";
      if (r < p1) {
        res = "1";
      } else if (r < p1 + pX) {
        res = "X";
      } else {
        res = "2";
      }
      currentOutcomes[m.match_no] = res;
      
      setTimeout(() => {
        const teams = `${m.home} vs ${m.away}`;
        const outcomeLabel = res === "1" ? "Home Win (1)" : res === "2" ? "Away Win (2)" : "Draw (X)";
        addLog(`[Resolutor] Leg #${m.match_no} (${teams}) full-time. Custom result recorded as: ${outcomeLabel}`);
      }, (i + 1) * 120);
    });
    
    setTimeout(() => {
      setActualOutcomes(currentOutcomes);
      setIsResoluting(false);
      addLog("[Resolutor] Matchday outcomes resolution completes. Accuracy matrices upgraded.");
      showToast("Virtual matchday results successfully simulated!", "success");
    }, matches.length * 120 + 200);
  };

  const handleResetOutcomes = () => {
    setActualOutcomes({});
    addLog("[Resolutor] Revoked simulated actual results. Ready for new matchday models.");
    showToast("Virtual results cleared.", "info");
  };

  const handleToggleSingleOutcome = (matchNo: string, val: "1" | "X" | "2") => {
    setActualOutcomes((prev) => {
      const next = { ...prev };
      if (next[matchNo] === val) {
        delete next[matchNo];
        addLog(`[Resolutor] Revoked outcome for Match #${matchNo}`);
      } else {
        next[matchNo] = val;
        addLog(`[Resolutor] Set Outcome for Match #${matchNo} manually to '${val}'`);
      }
      return next;
    });
  };

  const getSubJackpotAccuracyInfo = (size: number) => {
    const includedMap = size === subJackpotSize ? activeSubJackpotMatches : optimizeSubJackpotSubsets(size);
    const subsetMatches = matches.filter((m) => includedMap[m.match_no]);
    
    let customCorrect = 0;
    let customTotal = 0;
    let favoritesCorrect = 0;
    let balancedCorrect = 0;
    let boldCorrect = 0;
    
    subsetMatches.forEach((m) => {
      const actual = actualOutcomes[m.match_no];
      if (!actual) return;
      
      customTotal++;
      
      const userSel = selections[m.match_no] || [];
      if (userSel.includes(actual)) {
        customCorrect++;
      }
      
      // Favorites Selection Rule
      const o = m.odds;
      let fav = "X";
      if (o["1"] <= o["X"] && o["1"] <= o["2"]) fav = "1";
      else if (o["2"] <= o["1"] && o["2"] <= o["X"]) fav = "2";
      if (fav === actual) favoritesCorrect++;
      
      // AI Balanced Selection Rule
      const balKey = (m.id * 17) % 100;
      let bal = "1";
      if (balKey < 45) bal = "1";
      else if (balKey < 75) bal = "X";
      else bal = "2";
      if (bal === actual) balancedCorrect++;
      
      // Bold Selection Rule
      const boldKey = (m.id * 31) % 100;
      let bld = "X";
      if (boldKey < 40) bld = "X";
      else if (boldKey < 75) bld = m.odds["2"] > m.odds["1"] ? "2" : "X";
      else bld = "1";
      if (bld === actual) boldCorrect++;
    });
    
    let customBonus = "No Bonus";
    if (customTotal === size) {
      if (size === 17) {
        if (customCorrect === 17) customBonus = "Grand Mega Jackpot! 🏆";
        else if (customCorrect === 16) customBonus = "16/17 Bonus Winner! 🥈";
        else if (customCorrect === 15) customBonus = "15/17 Bonus Winner! 🥉";
        else if (customCorrect === 14) customBonus = "14/17 Bonus (Ksh ~250k)";
        else if (customCorrect === 13) customBonus = "13/17 Bonus (Ksh ~30k)";
        else if (customCorrect === 12) customBonus = "12/17 Bonus (Ksh ~5k)";
      } else if (size === 16) {
        if (customCorrect === 16) customBonus = "Grand 16/16 Pool Winner! 🏆";
        else if (customCorrect >= 11) customBonus = `${customCorrect}/16 Sub-Jackpot Bonus! 🌟`;
      } else if (size === 15) {
        if (customCorrect === 15) customBonus = "Grand 15/15 Pool Winner! 🏆";
        else if (customCorrect >= 10) customBonus = `${customCorrect}/15 Sub-Jackpot Bonus! 🌟`;
      } else if (size === 14) {
        if (customCorrect === 14) customBonus = "Grand 14/14 Pool Winner! 🏆";
        else if (customCorrect >= 10) customBonus = `${customCorrect}/14 Sub-Jackpot Bonus! 🌟`;
      } else if (size === 13) {
        if (customCorrect === 13) customBonus = "Grand 13/13 Pool Winner! 🏆";
        else if (customCorrect >= 10) customBonus = `${customCorrect}/13 Sub-Jackpot Bonus! 🌟`;
      }
    }
    
    return {
      size,
      customCorrect,
      customTotal,
      favoritesCorrect,
      balancedCorrect,
      boldCorrect,
      customBonus,
      hasSimulatedResults: customTotal > 0
    };
  };

  // Extract all distinct leagues from matches array to create dynamic filter dropdown
  const uniqueLeagues = ["All", ...Array.from(new Set(matches.map((m) => m.league).filter(Boolean)))];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* 🚀 Sleek Interface Top Navigation */}
      <nav className="h-16 bg-white border-b border-slate-200 px-6 md:px-12 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100">
            <Trophy className="w-5 h-5 text-white animate-bounce pointer-events-none" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              SportScraper <span className="text-indigo-600">Pro</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs bg-slate-100 text-slate-600 font-mono font-semibold px-2 py-0.5 rounded-full">
              SECURE
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline-block font-mono text-xs">Selenium Driver: Active</span>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>

          {/* Firebase Auth & Cloud Sync Interface */}
          {isAuthLoading ? (
            <div className="text-xs text-slate-400 animate-pulse font-mono">Syncing Cloud...</div>
          ) : currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCloudModal(true)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold shadow-3xs flex items-center gap-1.5 transition-all cursor-pointer relative"
                title="View Cloud Slips Store"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cloud Slips</span>
                {cloudCoupons.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                    {cloudCoupons.length}
                  </span>
                )}
              </button>
              
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200/60 px-2 py-1.5 rounded-lg">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className="w-4 h-4 rounded-full border border-indigo-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                    U
                  </div>
                )}
                <span className="text-[10.5px] font-bold text-slate-700 max-w-[90px] truncate hidden md:inline-block">
                  {currentUser.displayName || currentUser.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-0.5 hover:text-rose-600 text-slate-400 transition-colors pointer-events-auto cursor-pointer"
                  title="Sign out of SportScraper Cloud"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="px-3 py-1.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100/80 text-indigo-700 rounded-lg text-xs font-semibold shadow-3xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Authenticate with Google to preserve Slips securely on Firebase"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sign In with Google</span>
            </button>
          )}

          <div className="w-px h-6 bg-slate-200"></div>

          <div className="flex space-x-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-3xs flex items-center gap-1.5 transition-all cursor-pointer"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-100 animate-spin-slow" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span className="hidden sm:inline-block font-medium">{isDarkMode ? "Light" : "Dark"}</span>
            </button>

            <button
              onClick={toggleShowAiPredictions}
              className={`px-3 py-1.5 border rounded-lg text-xs font-semibold shadow-3xs flex items-center gap-1.5 transition-all cursor-pointer ${
                showAiPredictions
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
              title={showAiPredictions ? "Hide AI consensus predictions bars in the match spreadsheet" : "Show AI consensus predictions bars in the match spreadsheet"}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${showAiPredictions ? "text-indigo-600 font-bold" : "text-slate-400"}`} />
              <span className="hidden md:inline-block">AI Predictions:</span>
              <span className={`font-black uppercase text-[10px] ${showAiPredictions ? "text-indigo-700" : "text-slate-400"}`}>
                {showAiPredictions ? "ON" : "OFF"}
              </span>
            </button>

            <button
              onClick={() => {
                showToast("SportScraper Pro is equipped with headful anti-fingerprinting Selenium drivers.", "info");
                addLog("Opened configuration specifications file...");
              }}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Specs</span>
            </button>
            <button
              onClick={handleScrape}
              disabled={isSyncing}
              className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-2 transition-all cursor-pointer ${
                isSyncing ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>Run New Scrape</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Warning/Success Toast Notification Banner */}
      {notification && (
        <div className="bg-slate-900 text-white text-xs px-6 py-3.5 border-b border-indigo-500/10 flex items-center justify-between sticky top-16 z-30 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2.5 mx-auto max-w-7xl w-full">
            {notification.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {notification.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
            {notification.type === "info" && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span className="font-medium tracking-wide leading-relaxed">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header Banner Component */}
      <div className="max-w-7xl mx-auto w-full px-6 md:px-8 pt-6">
        <Header
          onSync={handleScrape}
          isSyncing={isSyncing}
          matchCount={matches.length}
          onOpenScreenshotModal={() => setShowScreenshotModal(true)}
          onOpenPasteModal={() => setShowPasteModal(true)}
          onOpenOddsTracker={() => {
            setOddsTrackerMatchNo("1");
            setShowOddsTrackerModal(true);
          }}
        />
      </div>

      {/* Bento Stats Headers Blocks */}
      <header className="p-6 md:p-8 pb-0 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" /> Active Jackpot ID
              </p>
              <p className="text-xl md:text-2xl font-black text-slate-900 font-mono">MJP_20260530</p>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                jackpotSource.includes("Screenshot") ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-emerald-500"
              }`}>
                {jackpotSource.includes("Screenshot") ? (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Screenshot OCR (Autosaved)</span>
                  </>
                ) : (
                  <span>SportPesa Kenya Official</span>
                )}
              </span>
              {jackpotSource.includes("Screenshot") && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("mjp_autosaved_screenshot_jackpot");
                    setJackpotSource("Live SportPesa Portal");
                    fetchMatches();
                    showToast("Reset jackpot fixtures to live SportPesa portal data.", "info");
                  }}
                  className="text-[10px] text-slate-400 hover:text-indigo-600 underline cursor-pointer font-semibold"
                  title="Clear autosaved screenshot jackpot and reload live portal data"
                >
                  Reset Live
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Matches Scraped
              </p>
              <p className="text-xl md:text-2xl font-black text-slate-900 font-mono">
                {matches.length} / 17
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                style={{ width: `${(matches.length / 17) * 100}%` }}
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              ></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> Estimated Pool Payout
              </p>
              <p className="text-xl md:text-2xl font-black text-slate-900 font-mono text-emerald-800">
                Ksh 354.2M
              </p>
            </div>
            <span className="text-[11px] text-slate-400">Guaranteed Progressive Grand Prize</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-blue-500" /> My Current Selections
              </p>
              <p className="text-xl md:text-2xl font-black text-slate-900 font-mono">
                {Object.keys(selections).length} Selected
              </p>
            </div>
            <span className="text-[11px] text-slate-500">
              {totalCombinations} Line combinations
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-slate-500 text-sm font-medium">Syncing live SportPesa elements...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 max-w-md mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Portal Synchronization Timeout</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6 leading-relaxed">
            The app could not access the bookmaker portal API. Please click below to reload the simulated fallback datasets.
          </p>
          <button
            onClick={fetchMatches}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow"
          >
            Retry Connection Link
          </button>
        </div>
      ) : (
        <main className="flex-1 p-6 md:p-8 grid grid-cols-12 gap-6 md:gap-8 max-w-7xl mx-auto w-full overflow-hidden">
          
          {/* Recovery backup notifier (spans full 12 cols if active) */}
          {restoreAvailable && savedBackup && (
            <div className="col-span-12 bg-indigo-50 border border-indigo-200/85 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-indigo-900 shadow-3xs animate-fade-in text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
                <div>
                  <p className="font-extrabold text-xs uppercase tracking-wider text-indigo-800">
                    Restore Last Selections Session?
                  </p>
                  <p className="text-[11px] text-indigo-700/80 leading-relaxed mt-0.5">
                    We detected <strong className="font-bold text-indigo-900">{Object.keys(savedBackup).length} previously saved match picks</strong> from your last session. Perfect for comparing week-on-week accuracy models.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    localStorage.removeItem("mjp_selections");
                    setRestoreAvailable(false);
                    setSavedBackup(null);
                    showToast("Previous session selections cleared.", "info");
                  }}
                  className="px-3.5 py-1.5 border border-indigo-250 hover:bg-indigo-100 text-indigo-600 rounded-lg text-2xs font-bold leading-none cursor-pointer transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setSelections(savedBackup);
                    setRestoreAvailable(false);
                    setSavedBackup(null);
                    addLog(`Restored ${Object.keys(savedBackup).length} match selections from local storage cache.`);
                    showToast(`Successfully restored your previous picks session! (${Object.keys(savedBackup).length} matches)`, "success");
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-2xs font-extrabold leading-none cursor-pointer shadow-indigo-100 shadow-sm transition-all"
                >
                  Restore Selections
                </button>
              </div>
            </div>
          )}

          {/* LEFT COLUMN: Match Selections and Grid (col-span-8) */}
          <section className="col-span-12 lg:col-span-8 flex flex-col space-y-6">
            
            {/* Permutation Tools & Search Filter Area */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-left">
                    Predictive Permutation Builders
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Instantly load AI models or mathematical odds strategies to build your 17-match slip.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleGenerateSlip("conservative")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      activeStrategy === "conservative"
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    📉 Odds Favorites ("Safe")
                  </button>

                  <button
                    onClick={() => handleGenerateSlip("ai-balanced")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                      activeStrategy === "ai-balanced"
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                        : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>AI Balanced Mix</span>
                  </button>

                  <button
                    onClick={() => handleGenerateSlip("bold")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      activeStrategy === "bold"
                        ? "bg-amber-600 text-white border-amber-700 shadow-sm"
                        : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                    }`}
                  >
                    ⚡ Bold Value Upsets
                  </button>

                  <button
                    onClick={() => {
                      setShowHistoricalModal(true);
                      fetchHistoricalPayouts();
                    }}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-3xs"
                    title="Compare model predictions against historical SportPesa payout results"
                  >
                    <Trophy className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>Compare Models & Payouts</span>
                  </button>

                  {Object.keys(selections).length > 0 && (
                    <button
                      onClick={() => {
                        const hasLocks = Object.values(lockedMatches).some(Boolean);
                        if (hasLocks) {
                          setSelections((prev) => {
                            const updated: Record<string, string[]> = {};
                            matches.forEach((m) => {
                              if (lockedMatches[m.match_no] && prev[m.match_no]) {
                                updated[m.match_no] = prev[m.match_no];
                              }
                            });
                            return updated;
                          });
                          setActiveStrategy("");
                          setStrategyJustification("");
                          addLog("Cleared unlocked jackpot selections. Locked selections remain intact.");
                          showToast("Unlocked selections have been cleared. Locked items kept.", "info");
                        } else {
                          setSelections({});
                          setActiveStrategy("");
                          setStrategyJustification("");
                          addLog("Cleared all jackpot selections.");
                          showToast("Your jackpot selections have been cleared.", "info");
                        }
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 flex items-center justify-center cursor-pointer"
                      title="Clear Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Strategy Explanation box if loaded */}
              {strategyJustification && (
                <div className="bg-indigo-50/50 p-3.5 border border-indigo-100 rounded-lg flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-tight block">
                        Active Strategy Analysis
                      </span>
                      {isStratRateLimited && (
                        <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md font-mono font-bold flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                          <span>Gemini rate-limited fallback mode active</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-950 mt-1 leading-relaxed italic">
                      "{strategyJustification}"
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Pick and SportPesa SMS Betting String Section */}
              <div className="bg-slate-50/70 p-4 border border-slate-200/85 rounded-xl flex flex-col gap-4 mt-1">

                {/* Target sub jackpot selector */}
                <div className="bg-white/90 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2.5 shadow-3xs">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left font-mono block">
                    Target SportPesa Jackpot Pool Category
                  </span>
                  <div className="grid grid-cols-5 gap-1.5 bg-slate-100/95 p-1 rounded-lg">
                    {[17, 16, 15, 14, 13].map((size) => (
                      <button
                        key={size}
                        onClick={() => handleSubJackpotSizeChange(size)}
                        className={`py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          subJackpotSize === size
                            ? "bg-indigo-600 text-white shadow-2xs font-extrabold"
                            : "text-slate-600 hover:text-indigo-600 hover:bg-slate-200"
                        }`}
                      >
                        {size === 17 ? "MJP 17" : `MJP ${size}`}
                      </button>
                    ))}
                  </div>
                  {subJackpotSize < 17 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-indigo-900 bg-indigo-50/60 px-3 py-2 rounded-lg border border-indigo-100/70 mt-1 gap-2">
                      <p className="text-left leading-relaxed">
                        <span className="font-extrabold text-indigo-700 uppercase tracking-wide mr-1 font-mono">
                          MJP {subJackpotSize} Active:
                        </span> 
                        Slip constrained to exactly <span className="font-black underline text-indigo-800">{subJackpotSize} games</span>. Toggle items/order inside the Selection Spreadsheet manually or optimize automatically using certainty filters.
                      </p>
                      <button
                        onClick={() => {
                          const updated = optimizeSubJackpotSubsets(subJackpotSize);
                          setActiveSubJackpotMatches(updated);
                          addLog(`[Sub-Jackpot] Manual sub-jackpot subset re-optimized to the top ${subJackpotSize} predictable positions.`);
                          showToast(`Subset optimized using AI Predictability index!`, "success");
                        }}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 hover:shadow-2xs text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer select-none transition shrink-0 self-start sm:self-auto"
                        title="Auto-select highest predictability fixtures based on AI certainty matrix"
                      >
                        <Sparkles className="w-3 h-3 text-white" />
                        <span>AI Auto-Optimize Slip</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-left">
                      <Zap className="w-4 h-4 text-indigo-600 fill-indigo-100" /> Interactive Quick Pick
                    </h4>
                    <p className="text-[11px] text-slate-500 text-left mt-0.5">
                      Fast-build jackpot combinations by automatically placing double chance selections onto the tightest matches using the active strategy.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-auto shrink-0 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-3xs">
                    <span className="text-[11px] font-bold text-slate-600">Double Chances:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setDoubleChanceCount((c) => Math.max(0, c - 1))}
                        disabled={doubleChanceCount <= 0}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition flex items-center justify-center text-slate-700 cursor-pointer"
                        title="Reduce double chance selections"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black font-mono w-4 text-center text-slate-800">
                        {doubleChanceCount}
                      </span>
                      <button
                        onClick={() => setDoubleChanceCount((c) => Math.min(7, c + 1))}
                        disabled={doubleChanceCount >= 7}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition flex items-center justify-center text-slate-700 cursor-pointer"
                        title="Increase double chance selections"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                  {/* Left part: Quick pick click */}
                  <div className="md:col-span-5 flex flex-col justify-between gap-3 text-left">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-medium">Jackpot target:</span>
                        <span className="font-mono font-black text-slate-700">
                          MJP {subJackpotSize === 17 ? "17 (Full)" : subJackpotSize}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-medium">Active Strategy Mode:</span>
                        <span className="font-bold uppercase text-indigo-600">
                          {activeStrategy ? activeStrategy : "AI Balanced"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-medium">Permutations count:</span>
                        <span className="font-mono font-bold text-slate-700">
                          {Math.pow(2, doubleChanceCount)} line{Math.pow(2, doubleChanceCount) > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-semibold">Total Slip Price:</span>
                        <span className="font-mono font-black text-emerald-700">
                          Ksh {(Math.pow(2, doubleChanceCount) * 99).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleQuickPick}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs hover:shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
                      <span>Fill Slip via Quick Pick</span>
                    </button>
                  </div>

                  {/* Right part: SMS format and Copy */}
                  <div className="md:col-span-7 flex flex-col justify-between bg-white p-3 rounded-lg border border-slate-200/80 shadow-3xs text-left gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400 animate-bounce" /> SportPesa SMS Betting String
                      </span>
                      {getSportPesaSMSCode().includes("?") ? (
                        <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-mono font-medium">
                          Incomplete selections ({getActiveSelectionsCount()}/{subJackpotSize})
                        </span>
                      ) : (
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-mono font-medium">
                          SMS Code Ready ({subJackpotSize}/{subJackpotSize})
                        </span>
                      )}
                    </div>

                    <div className="flex items-stretch gap-1.5 mt-0.5">
                      <div className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold tracking-wider text-slate-700 overflow-x-auto whitespace-nowrap select-all max-w-full flex items-center shadow-inner">
                        {getSportPesaSMSCode()}
                      </div>
                      <button
                        onClick={() => {
                          const code = getSportPesaSMSCode();
                          if (code.includes("?")) {
                            showToast(`Please select options for all active ${subJackpotSize} matches first! (Use Quick Pick to auto-fill)`, "warning");
                          } else {
                            copyToClipboard(code, "SportPesa SMS betting code");
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-bold border transition-colors rounded-lg cursor-pointer shrink-0 flex items-center gap-1 bg-slate-900 border-slate-950 text-white hover:bg-slate-800`}
                        title="Copy SportPesa SMS code to clipboard"
                      >
                        {copiedTextFeedback === "SportPesa SMS betting code" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedTextFeedback === "SportPesa SMS betting code" ? "Copied" : "Copy"}</span>
                      </button>

                      <button
                        onClick={openTelegramWithCoupon}
                        id="telegram-share-btn"
                        className="px-3 py-1.5 text-xs font-extrabold transition-all rounded-lg cursor-pointer shrink-0 flex items-center gap-1.5 bg-[#229ED9] hover:bg-[#1c8ec4] text-white shadow-xs hover:shadow-sm"
                        title="Format coupon into Telegram structure (emojis, bold, odds summary) and launch Telegram via tg:// link"
                      >
                        <Send className="w-3.5 h-3.5 fill-current text-white" />
                        <span>Share Telegram</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-normal">
                      To place this jackpot coupon on your phone, copy and send this code to SMS number <span className="font-bold text-indigo-600">79079</span> (Ksh 99 per line).
                    </p>
                  </div>
                </div>

                {/* Mathematical Probability & Return Estimator Widget */}
                <PayoutProbabilityEstimator 
                  matches={matches}
                  selections={selections}
                  subJackpotSize={subJackpotSize}
                  activeSubJackpotMatches={activeSubJackpotMatches}
                  doubleChanceCount={doubleChanceCount}
                />
              </div>

              {/* Firebase Cloud Sync Control card */}
              <div className="bg-indigo-900 text-white rounded-xl p-4 shadow-sm border border-indigo-950 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-2">
                <div className="text-left space-y-1">
                  <div className="flex items-center gap-1.5 font-sans">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono">
                      SportScraper Cloud Locker
                    </span>
                  </div>
                  <h4 className="text-xs font-black tracking-tight font-sans">
                    {currentUser ? "Synchronize & Lock Slip on Cloud" : "Authenticate to save slips permanently"}
                  </h4>
                  <p className="text-[10px] text-indigo-200/95 leading-normal max-w-2xl">
                    {currentUser 
                      ? "Name your current picks and synchronize them with your secure Firebase Cloud cabinet. Retrieve them at any time to check jackpot accuracy."
                      : "Connecting with Google enables saving multiple accumulator models, historical tracking, and syncing selection results."}
                  </p>
                </div>

                <div className="shrink-0 flex items-center lg:justify-end gap-2">
                  {currentUser ? (
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <input
                        type="text"
                        placeholder="e.g. Week 21 AI Balanced"
                        value={newCouponName}
                        onChange={(e) => setNewCouponName(e.target.value)}
                        className="px-3 py-1.5 bg-indigo-950 text-indigo-50 border border-indigo-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:bg-indigo-950 max-w-[180px]"
                      />
                      <button
                        onClick={() => handleSaveCouponCloud(newCouponName)}
                        disabled={savingCoupon}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-indigo-950 rounded-lg text-xs font-black shadow-sm flex items-center gap-1 cursor-pointer select-none transition-all"
                        title="Upload choices"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>{savingCoupon ? "Caching..." : "Save Slip"}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGoogleSignIn}
                      className="px-4 py-1.5 bg-white hover:bg-indigo-50 active:bg-indigo-100 text-indigo-900 rounded-lg text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer select-none transition-all"
                    >
                      <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Connect Securely</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Row: Date Range Filter & Match Live Simulation Controller */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                {/* Date Range Prefilters */}
                <div className="flex flex-col gap-2 text-left">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 font-bold" />
                    Date Range & Archival Filter
                  </span>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "current-week", label: "🗓️ This Week's Jackpot" },
                      { id: "today", label: "Today (30/05)" },
                      { id: "tomorrow", label: "Tomorrow (31/05)" },
                      { id: "archived", label: "📂 Archived/Past" },
                      { id: "all", label: "All Records" }
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setDatePreset(preset.id as any);
                          // Clear custom bounds when presets are actively selected
                          setCustomStartDate("");
                          setCustomEndDate("");
                        }}
                        className={`px-2 py-1 rounded text-2xs font-extrabold uppercase transition-all cursor-pointer ${
                          datePreset === preset.id
                            ? "bg-indigo-600 text-white shadow-3xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Inputs */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-medium font-sans">From:</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => {
                          setCustomStartDate(e.target.value);
                          setDatePreset("custom"); // Switch to custom when manually entering bounding ranges
                        }}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 outline-none rounded text-xs text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-medium font-sans">To:</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => {
                          setCustomEndDate(e.target.value);
                          setDatePreset("custom");
                        }}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 outline-none rounded text-xs text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    {(customStartDate || customEndDate || datePreset !== "current-week") && (
                      <button
                        onClick={() => {
                          setCustomStartDate("");
                          setCustomEndDate("");
                          setDatePreset("current-week");
                        }}
                        className="p-1 hover:text-rose-600 text-slate-400 transition-colors cursor-pointer"
                        title="Clear all date restrictions"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Match Kickoff & Starter Simulation Clock */}
                <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      Live Kickoff Simulation Engine
                    </span>
                    <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                      🕒 virtual: {simulatedTime.toLocaleDateString([], { month: "short", day: "numeric" })} {simulatedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-tight">
                    Progress virtual system timeline to automatically start/lock matches and verify sub-jackpot slip transitions.
                  </p>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {[
                      { label: "Pre-Match", time: "2026-05-30T14:00:00", desc: "All 17 live" },
                      { label: "Sat 19:30", time: "2026-05-30T19:30:00", desc: "1 Started" },
                      { label: "Sat 23:50", time: "2026-05-30T23:50:00", desc: "4 Started" },
                      { label: "Sun 15:30", time: "2026-05-31T15:30:00", desc: "7 Started" },
                      { label: "Sun 19:45", time: "2026-05-31T19:45:00", desc: "13 Started" }
                    ].map((pt) => {
                      const isActive = simulatedTime.getTime() === new Date(pt.time).getTime();
                      return (
                        <button
                          key={pt.label}
                          type="button"
                          onClick={() => {
                            setSimulatedTime(new Date(pt.time));
                            addLog(`[Clock Sim] Adjusted virtual system timeline to: ${pt.label} (${pt.time}). Started/locked elements recalculating.`);
                            showToast(`Simulated timeline set to ${pt.label}! Matches updated.`, "info");
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center flex-1 min-w-[70px] border ${
                            isActive
                              ? "bg-amber-500 border-amber-600 text-white shadow-3xs"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                          title={pt.desc}
                        >
                          <span className="font-bold leading-none">{pt.label}</span>
                          <span className={`text-[8px] font-mono leading-none mt-0.5 ${isActive ? "text-amber-100" : "text-slate-400"}`}>
                            {pt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row: Search & Category filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search teams, country leagues, match number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap xl:flex-nowrap">
                  <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                    <span className="text-xs text-slate-400 font-medium shrink-0 font-sans">League:</span>
                    <div className="flex flex-wrap gap-1">
                      {uniqueLeagues.slice(0, 5).map((ln) => (
                        <button
                          key={ln}
                          onClick={() => setLeagueFilter(ln)}
                          className={`px-2 py-0.5 rounded text-2xs font-bold uppercase transition-all duration-150 cursor-pointer ${
                            leagueFilter === ln
                              ? "bg-slate-800 text-white shadow-3xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {ln}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reset Filters & Sorting parameters */}
                  <button
                    onClick={handleResetFiltersAndSorting}
                    disabled={leagueFilter === "All" && searchQuery === "" && sortField === null}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold border rounded-md transition-all duration-150 cursor-pointer ${
                      (leagueFilter !== "All" || searchQuery !== "" || sortField !== null)
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 shadow-3xs hover:border-indigo-300"
                        : "bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed"
                    }`}
                    title="Reset search terms, league filters, and column sorting back to defaults"
                  >
                    <RotateCcw className="w-3 h-3 text-current" />
                    <span className="font-sans uppercase tracking-tight text-[9px] font-black">Reset Focus</span>
                  </button>
                </div>
              </div>

              {/* Advanced Smart Analyzers */}
              <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide font-sans flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    Interactive Tactical Filtering Models
                  </span>
                  {smartFilter !== "all" && (
                    <button
                      onClick={() => setSmartFilter("all")}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold transition-colors cursor-pointer"
                    >
                      Clear Analyzer Filters
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {[
                    { id: "all", label: "All Matches", icon: Layers, count: matches.length, color: "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200" },
                    { id: "favorites", label: "AI Favorites / Strong Wins", icon: Trophy, count: matches.filter(m => (m.odds["1"] <= 2.25 || (m.predictionStats && m.predictionStats["1"] >= 45)) || (m.odds["2"] <= 2.25 || (m.predictionStats && m.predictionStats["2"] >= 45))).length, color: "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/40" },
                    { id: "volatile", label: "Tight Clashes / Draw Risks", icon: Flame, count: matches.filter(m => (m.homeRank !== undefined && m.awayRank !== undefined && Math.abs(m.homeRank - m.awayRank) <= 4) || m.odds["X"] <= 3.05 || (m.predictionStats && Math.max(m.predictionStats["1"], m.predictionStats["X"], m.predictionStats["2"]) < 42)).length, color: "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200/40" },
                    { id: "draws", label: "High Draw Propensity", icon: Percent, count: matches.filter(m => (m.predictionStats && m.predictionStats["X"] >= 31) || m.odds["X"] <= 3.10).length, color: "bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200/40" },
                    { id: "value", label: "AI Confident Predicts", icon: Sparkles, count: matches.filter(m => m.predictionStats && Math.max(m.predictionStats["1"], m.predictionStats["X"], m.predictionStats["2"]) >= 48).length, color: "bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200/40" }
                  ].map((filter) => {
                    const isSelected = smartFilter === filter.id;
                    const Icon = filter.icon;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => {
                          setSmartFilter(filter.id as any);
                          addLog(`[Filter] Filtered matches by tactical category: ${filter.label}`);
                        }}
                        className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-tight rounded-lg border cursor-pointer flex items-center gap-1.5 transition-all duration-150 ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                            : `${filter.color}`
                        }`}
                        title={filter.label}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{filter.label}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                          isSelected ? "bg-indigo-700 text-indigo-100" : "bg-white/80 text-current"
                        }`}>
                          {filter.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selection Grid Table block */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-600" />
                    SportPesa Pro Selection Spreadsheet
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Showing {finalMatches.length} matchups. Double click a row or pick multiple outcomes for system coverage.
                  </p>
                </div>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="p-1.5 hover:bg-slate-100 rounded border border-slate-200 text-slate-600 cursor-pointer flex items-center gap-1 text-[11px] font-semibold mr-1"
                    title="Import coupon JSON or SMS Code"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">Import</span>
                  </button>
                  <button
                    onClick={() => handleExportData("json")}
                    className="p-1.5 hover:bg-slate-100 rounded border border-slate-200 text-slate-600 cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                    title="Export JSON"
                  >
                    <FileJson className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="hidden sm:inline">JSON</span>
                  </button>
                  <button
                    onClick={() => handleExportData("csv")}
                    className="p-1.5 hover:bg-slate-100 rounded border border-slate-200 text-slate-600 cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                    title="Export CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                </div>
              </div>

              {/* Real 17-Match Table Elements */}
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left border-collapse-selections">
                  <thead className="bg-[#f8fafc] text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 font-mono select-none">
                    <tr>
                      <th
                        onClick={() => handleSort("match_no")}
                        className="py-3 px-4 w-12 min-w-[48px] text-center cursor-pointer hover:bg-slate-100/80 hover:text-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>No.</span>
                          {sortField === "match_no" ? (
                            sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4 w-28 min-w-[110px] text-center bg-slate-100/50">MJP Slip</th>
                      <th
                        onClick={() => handleSort("league")}
                        className="py-3 px-4 w-32 min-w-[130px] cursor-pointer hover:bg-slate-100/80 hover:text-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          <span>Competition</span>
                          {sortField === "league" ? (
                            sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("matchup")}
                        className="py-3 px-5 min-w-[280px] cursor-pointer hover:bg-slate-100/80 hover:text-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          <span>Matchup Fix & Information</span>
                          {sortField === "matchup" ? (
                            sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4 w-72 min-w-[285px] text-center">Jackpot Outcomes (1 / X / 2)</th>
                      <th
                        onClick={() => handleSort("predictability")}
                        className="py-3 px-4 w-28 min-w-[110px] text-center cursor-pointer hover:bg-slate-100/80 hover:text-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Detailed AI</span>
                          {sortField === "predictability" ? (
                            sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th className="hidden lg:table-cell py-3 px-4 w-44 min-w-[170px] text-center">Actual Outcome</th>
                      <th className="py-3 px-4 w-20 min-w-[80px] text-center">Lock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {finalMatches.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          No matches matched your filter query.
                        </td>
                      </tr>
                    ) : (
                      finalMatches.map((m) => {
                        const isSelectedMatch = selectedMatch?.match_no === m.match_no;
                        const homeSel = selections[m.match_no]?.includes("1");
                        const drawSel = selections[m.match_no]?.includes("X");
                        const awaySel = selections[m.match_no]?.includes("2");
                        const isExcludedFromSub = !isMatchActive(m.match_no);
                        const isStarted = isMatchStarted(m);

                        return (
                          <tr
                            key={m.id}
                            onClick={() => handleAnalyzeMatch(m)}
                            className={`group hover:bg-slate-50/70 transition-all duration-150 cursor-pointer ${
                              isSelectedMatch ? "bg-indigo-50/25 border-l-2 border-indigo-500" : ""
                            } ${
                              isStarted
                                ? "bg-slate-50/40 opacity-75 grayscale-[30%] text-slate-500"
                                : isExcludedFromSub
                                ? "opacity-75 hover:opacity-100"
                                : ""
                            }`}
                          >
                            {/* Match Index Badge with Started indicator */}
                            <td className="py-4 px-4 text-center">
                              <div className="relative inline-block">
                                <span
                                  className={`inline-flex w-6 h-6 rounded-md items-center justify-center font-mono text-xs font-black border ${
                                    isSelectedMatch
                                      ? "bg-indigo-600 text-white border-indigo-700"
                                      : isStarted
                                      ? "bg-slate-200 text-slate-500 border-slate-300"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  {m.match_no}
                                </span>
                                {lockedMatches[m.match_no] && (
                                  <span 
                                    className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white p-0.5 rounded-full border border-white shadow-2xs flex items-center justify-center"
                                    title="Automatic Strategy Frozen"
                                  >
                                    <Lock className="w-2 h-2" />
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Sub-Jackpot Slip Link Checkbox button */}
                            <td className="py-4 px-4 text-center bg-slate-50/20" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  if (isStarted) {
                                    showToast("This match has already kicked off and is locked in the slip.", "warning");
                                    return;
                                  }
                                  toggleSubJackpotMatch(m.match_no);
                                }}
                                disabled={isStarted}
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black font-mono uppercase transition-all duration-150 border cursor-pointer select-none ${
                                  isStarted
                                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                    : subJackpotSize === 17
                                    ? "bg-slate-100 text-slate-400 border-slate-205/60 cursor-not-allowed opacity-80"
                                    : !isExcludedFromSub
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-3xs"
                                    : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                }`}
                                title={
                                  isStarted 
                                    ? "Game kicked off (automatic/locked status)"
                                    : subJackpotSize === 17 
                                    ? "All 17 games required for MJP 17" 
                                    : `Toggle Match #${m.match_no} inside active MJP ${subJackpotSize} slip`
                                }
                              >
                                {isStarted ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                                    <span>Locked</span>
                                  </>
                                ) : subJackpotSize === 17 ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                                    <span>Locked</span>
                                  </>
                                ) : !isExcludedFromSub ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                                    <span>Active</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                                    <span>Excluded</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* League Details */}
                            <td className="py-4 px-4">
                              <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase truncate max-w-[110px] block">
                                {m.league || "Intl fixture"}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap md:flex-nowrap animate-fade-in">
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">{m.kickoff}</span>
                                {isStarted ? (
                                  <span className="text-[8px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.5 rounded font-mono flex items-center gap-0.5 select-none leading-none shrink-0 border-solid" title="This game has kicked off and is locked.">
                                    <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></span>
                                    <span>STARTED</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setManuallyStarted(prev => ({ ...prev, [m.match_no]: true }));
                                      addLog(`[Clock Sim] Manually forced Match #${m.match_no} into STARTED / LOCKED state.`);
                                      showToast(`Match #${m.match_no} marked as started!`, "success");
                                    }}
                                    className="text-[8px] font-black text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-205 hover:border-indigo-700 px-1 py-0.5 rounded font-mono transition-all opacity-0 group-hover:opacity-100 cursor-pointer select-none leading-none shrink-0"
                                    title="Trigger manual kickoff/lock for this game"
                                  >
                                    <span>⚡ START</span>
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Teams and recent form mapping */}
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-2 text-left">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2 max-w-[170px] truncate">
                                    <TeamLogo name={m.home} size="xs" />
                                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                                      {m.home}
                                    </span>
                                  </div>
                                  {m.homeRank && (
                                    <span className="text-[9px] text-slate-400 font-semibold font-mono bg-slate-50 px-1 rounded">
                                      #{m.homeRank}
                                    </span>
                                  )}
                                  <div className="flex gap-0.5" title={`${m.home} stats`}>
                                    {m.homeForm?.split("-").map((chr, i) => (
                                      <span
                                        key={i}
                                        className={`w-3.5 h-3.5 text-[9px] rounded-full flex items-center justify-center font-bold font-mono ${
                                          chr === "W"
                                            ? "bg-emerald-50 text-emerald-700 font-bold"
                                            : chr === "D"
                                            ? "bg-amber-50 text-amber-700 font-bold"
                                            : "bg-rose-50 text-rose-700 font-bold"
                                        }`}
                                      >
                                        {chr}
                                      </span>
                                    ))}
                                  </div>
                                  {m.homeForm && (
                                    <FormSparkline
                                      formString={m.homeForm}
                                      teamName={m.home}
                                      strokeColor="#10b981"
                                      width={60}
                                      height={18}
                                    />
                                  )}
                                </div>

                                <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-2 max-w-[170px] truncate">
                                    <TeamLogo name={m.away} size="xs" />
                                    <span className="font-bold text-slate-900 truncate">
                                      {m.away}
                                    </span>
                                  </div>
                                  {m.awayRank && (
                                    <span className="text-[9px] text-slate-400 font-semibold font-mono bg-slate-50 px-1 rounded">
                                      #{m.awayRank}
                                    </span>
                                  )}
                                  <div className="flex gap-0.5" title={`${m.away} stats`}>
                                    {m.awayForm?.split("-").map((chr, i) => (
                                      <span
                                        key={i}
                                        className={`w-3.5 h-3.5 text-[9px] rounded-full flex items-center justify-center font-bold font-mono ${
                                          chr === "W"
                                            ? "bg-emerald-50 text-emerald-700 font-bold"
                                            : chr === "D"
                                            ? "bg-amber-50 text-amber-700 font-bold"
                                            : "bg-rose-50 text-rose-700 font-bold"
                                        }`}
                                      >
                                        {chr}
                                      </span>
                                    ))}
                                  </div>
                                  {m.awayForm && (
                                    <FormSparkline
                                      formString={m.awayForm}
                                      teamName={m.away}
                                      strokeColor="#6366f1"
                                      width={60}
                                      height={18}
                                    />
                                  )}
                                </div>

                                <AnimatePresence initial={false}>
                                  {showAiPredictions && m.predictionStats && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                      animate={{ height: "auto", opacity: 1, marginTop: 8 }}
                                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                      transition={{ duration: 0.2, ease: "easeInOut" }}
                                      className="overflow-hidden"
                                    >
                                      <div className="bg-slate-100/60 p-2 rounded-lg border border-slate-200/30 flex items-center gap-2 max-w-sm">
                                        <BarChart3 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider font-mono shrink-0">
                                          AI Consensus
                                        </span>
                                        <div className="w-full flex h-2 rounded overflow-hidden text-[9px] font-mono font-bold text-white text-center select-none shadow-3xs">
                                          <div
                                            style={{ width: `${m.predictionStats["1"]}%` }}
                                            className="bg-emerald-500 flex items-center justify-center"
                                            title={`Home Win: ${m.predictionStats["1"]}%`}
                                          >
                                            H
                                          </div>
                                          <div
                                            style={{ width: `${m.predictionStats["X"]}%` }}
                                            className="bg-slate-450 flex items-center justify-center bg-slate-400"
                                            title={`Draw: ${m.predictionStats["X"]}%`}
                                          >
                                            D
                                          </div>
                                          <div
                                            style={{ width: `${m.predictionStats["2"]}%` }}
                                            className="bg-indigo-500 flex items-center justify-center bg-indigo-600"
                                            title={`Away Win: ${m.predictionStats["2"]}%`}
                                          >
                                            A
                                          </div>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-mono font-bold shrink-0">
                                          {m.predictionStats["1"]}% | {m.predictionStats["X"]}% | {m.predictionStats["2"]}%
                                        </span>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Compact Actual Result Status Indicator below match description */}
                                <div className="mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 flex-wrap text-left">
                                  {(() => {
                                    const actual = actualOutcomes[m.match_no];
                                    if (actual) {
                                      return (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleSingleOutcome(m.match_no, actual);
                                            }}
                                            className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase font-mono tracking-tight flex items-center gap-1 shadow-3xs border cursor-pointer ${
                                              actual === "1"
                                                ? "bg-emerald-500 text-white border-emerald-600"
                                                : actual === "X"
                                                ? "bg-amber-500 text-white border-amber-600"
                                                : "bg-indigo-600 text-white border-indigo-700"
                                            }`}
                                            title="Click to clear simulated result"
                                          >
                                            <Trophy className="w-2.5 h-2.5 shrink-0" />
                                            FT: {actual === "1" ? "1" : actual === "X" ? "X" : "2"}
                                          </span>

                                          {selections[m.match_no] && selections[m.match_no].length > 0 ? (
                                            selections[m.match_no].includes(actual) ? (
                                              <span className="inline-flex items-center gap-0.5 text-[8.5px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/50 font-sans">
                                                Correct ✅
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-0.5 text-[8.5px] font-extrabold text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md border border-rose-200/50 dark:border-rose-800/50 font-sans">
                                                Wrong ❌
                                              </span>
                                            )
                                          ) : (
                                            <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-slate-400 font-sans">
                                              No Pick
                                            </span>
                                          )}
                                        </div>
                                      );
                                    } else if (isStarted) {
                                      return (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-600 text-white text-[8.5px] font-black tracking-wider rounded-full animate-pulse border border-rose-700 uppercase font-mono leading-none">
                                            <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                                            Live
                                          </span>
                                          <span className="text-[8px] font-bold text-rose-600 dark:text-rose-400 font-sans uppercase">
                                            In Progress
                                          </span>
                                          <div className="flex gap-1 items-center ml-auto">
                                            {["1", "X", "2"].map((val) => (
                                              <button
                                                key={val}
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleToggleSingleOutcome(m.match_no, val as any);
                                                }}
                                                className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded font-bold font-mono text-[8px] transition cursor-pointer"
                                                title={`Set FT Result to ${val}`}
                                              >
                                                {val}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div className="flex items-center gap-2 flex-wrap text-slate-400">
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[8.5px] font-bold rounded-full font-mono">
                                            <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                            Upcoming
                                          </span>
                                          <span className="text-[8px] text-slate-400 font-mono font-medium">
                                            Yet to play
                                          </span>
                                          <div className="flex gap-1 items-center ml-auto">
                                            {["1", "X", "2"].map((val) => (
                                              <button
                                                key={val}
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleToggleSingleOutcome(m.match_no, val as any);
                                                }}
                                                className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded font-bold font-mono text-[8px] transition cursor-pointer"
                                                title={`Set result to ${val}`}
                                              >
                                                Set {val}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    }
                                  })()}
                                </div>

                              </div>
                            </td>

                            {/* Outcomes Picker (1, X, 2) */}
                            <td className="py-4 px-4 text-center w-72 min-w-[285px]" style={{ minWidth: "285px" }} onClick={(e) => e.stopPropagation()}>
                              <div className="grid grid-cols-3 gap-2.5 w-full max-w-[285px] mx-auto font-mono shrink-0">
                                
                                {/* Home Win pick */}
                                <button
                                  type="button"
                                  onClick={() => handleSelectOutcome(m.match_no, "1")}
                                  disabled={isStarted}
                                  className={`py-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center cursor-pointer min-w-0 w-full relative h-[56px] select-none gap-1 ${
                                    isStarted
                                      ? homeSel
                                        ? "bg-slate-300 border-slate-400 text-slate-700 opacity-80 cursor-not-allowed"
                                        : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                                      : homeSel
                                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-600 text-white shadow-xs scale-[1.03]"
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300"
                                  }`}
                                  title={isStarted ? "This game has kicked off and is locked." : `Select ${m.home} Win`}
                                >
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                                    homeSel && !isStarted ? "bg-white/25 text-white" : "bg-slate-200 text-slate-500"
                                  }`}>
                                    1
                                  </span>
                                  <span className={`font-mono font-bold text-xs ${homeSel && !isStarted ? "text-white" : "text-slate-800"}`}>
                                    {m.odds["1"].toFixed(2)}
                                  </span>
                                </button>

                                {/* Draw Pick */}
                                <button
                                  type="button"
                                  onClick={() => handleSelectOutcome(m.match_no, "X")}
                                  disabled={isStarted}
                                  className={`py-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center cursor-pointer min-w-0 w-full relative h-[56px] select-none gap-1 ${
                                    isStarted
                                      ? drawSel
                                        ? "bg-slate-300 border-slate-400 text-slate-700 opacity-80 cursor-not-allowed"
                                        : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                                      : drawSel
                                      ? "bg-gradient-to-br from-slate-600 to-slate-700 border-slate-705 text-white shadow-xs scale-[1.03]"
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300"
                                  }`}
                                  title={isStarted ? "This game has kicked off and is locked." : "Select Draw"}
                                >
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                                    drawSel && !isStarted ? "bg-white/25 text-white" : "bg-slate-200 text-slate-500"
                                  }`}>
                                    X
                                  </span>
                                  <span className={`font-mono font-bold text-xs ${drawSel && !isStarted ? "text-white" : "text-slate-800"}`}>
                                    {m.odds["X"].toFixed(2)}
                                  </span>
                                </button>

                                {/* Away Pick */}
                                <button
                                  type="button"
                                  onClick={() => handleSelectOutcome(m.match_no, "2")}
                                  disabled={isStarted}
                                  className={`py-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center cursor-pointer min-w-0 w-full relative h-[56px] select-none gap-1 ${
                                    isStarted
                                      ? awaySel
                                        ? "bg-slate-300 border-slate-400 text-slate-700 opacity-80 cursor-not-allowed"
                                        : "bg-slate-105 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                                      : awaySel
                                      ? "bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-600 text-white shadow-xs scale-[1.03]"
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300"
                                  }`}
                                  title={isStarted ? "This game has kicked off and is locked." : `Select ${m.away} Win`}
                                >
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                                    awaySel && !isStarted ? "bg-white/25 text-white" : "bg-slate-200 text-slate-500"
                                  }`}>
                                    2
                                  </span>
                                  <span className={`font-mono font-bold text-xs ${awaySel && !isStarted ? "text-white" : "text-slate-800"}`}>
                                    {m.odds["2"].toFixed(2)}
                                  </span>
                                </button>

                              </div>
                            </td>

                            {/* Action triggering AI Analysis */}
                            <td className="py-2 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex flex-col items-center gap-1.5 justify-center">
                                <button
                                  id={`analyze-btn-${m.match_no}`}
                                  type="button"
                                  onClick={() => handleAnalyzeMatch(m)}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    isSelectedMatch
                                      ? "bg-amber-500 border-amber-600 text-white shadow-sm"
                                      : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200"
                                  }`}
                                  title="Synthesizing stats"
                                >
                                  <Sparkles className="w-4 h-4" />
                                </button>
                                {m.predictionStats && (
                                  <span className="inline-flex items-center text-[7.5px] font-black text-slate-500 bg-slate-100/80 border border-slate-200 px-1 py-0.5 rounded font-sans tracking-tight leading-none whitespace-nowrap select-none">
                                    Win Prob: {m.predictionStats["1"]}%
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actual Outcomes Tracking & Live/Upcoming Status Column */}
                            <td className="hidden lg:table-cell py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex flex-col items-center justify-center gap-1.5" id={`outcome-cell-${m.match_no}`}>
                                {(() => {
                                  const actual = actualOutcomes[m.match_no];
                                  if (actual) {
                                    return (
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-1">
                                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-tight flex items-center gap-1 shadow-3xs border cursor-pointer ${
                                            actual === "1" 
                                              ? "bg-emerald-500 text-white border-emerald-600" 
                                              : actual === "X"
                                              ? "bg-amber-500 text-white border-amber-600"
                                              : "bg-indigo-600 text-white border-indigo-700"
                                          }`}
                                          onClick={() => handleToggleSingleOutcome(m.match_no, actual)}
                                          title="Click to clear simulated result"
                                          >
                                            <Trophy className="w-2.5 h-2.5 shrink-0" />
                                            FT: {actual === "1" ? "1" : actual === "X" ? "X" : "2"}
                                          </span>
                                        </div>
                                        
                                        {/* Verification pill showing user status */}
                                        {selections[m.match_no] && selections[m.match_no].length > 0 ? (
                                          selections[m.match_no].includes(actual) ? (
                                            <span className="inline-flex items-center gap-0.5 text-[8.5px] font-extrabold text-emerald-700 bg-emerald-100/65 px-1.5 py-0.5 rounded-md border border-emerald-200/40 font-sans">
                                              Correct ✅
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-0.5 text-[8.5px] font-extrabold text-rose-700 bg-rose-100/65 px-1.5 py-0.5 rounded-md border border-rose-200/40 font-sans">
                                              Wrong ❌
                                            </span>
                                          )
                                        ) : (
                                          <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-slate-400 font-sans">
                                            No Pick
                                          </span>
                                        )}
                                      </div>
                                    );
                                  } else if (isStarted) {
                                    return (
                                      <div className="flex flex-col items-center gap-1">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black tracking-widest rounded-full animate-pulse border border-rose-700 uppercase font-mono leading-none">
                                          <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                                          Live
                                        </span>
                                        <span className="text-[8px] font-bold text-rose-600 font-sans uppercase tracking-tight">
                                          In Progress
                                        </span>
                                        
                                        {/* Rapid outcome settings */}
                                        <div className="flex gap-1 mt-0.5">
                                          {["1", "X", "2"].map((val) => (
                                            <button
                                              key={val}
                                              type="button"
                                              onClick={() => handleToggleSingleOutcome(m.match_no, val as any)}
                                              className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded font-bold font-mono text-[8px] transition cursor-pointer"
                                              title={`Set FT Result to ${val}`}
                                            >
                                              {val}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="flex flex-col items-center gap-1">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-bold rounded-full font-mono">
                                          <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                          Upcoming
                                        </span>
                                        <span className="text-[8px] text-slate-400 font-mono font-medium leading-none">
                                          Yet to play
                                        </span>

                                        {/* Rapid outcome overrides */}
                                        <div className="flex gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                          {["1", "X", "2"].map((val) => (
                                            <button
                                              key={val}
                                              type="button"
                                              onClick={() => handleToggleSingleOutcome(m.match_no, val as any)}
                                              className="px-1.5 py-0.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-650 border border-slate-200 rounded font-extrabold font-mono text-[8px] transition cursor-pointer"
                                              title={`Pre-select actual win/draw option ${val}`}
                                            >
                                              Set {val}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </td>

                            {/* Lock Toggle Action Column */}
                            <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isStarted) {
                                    showToast("Started matches cannot be manual selection frozen.", "warning");
                                    return;
                                  }
                                  toggleLockMatch(m.match_no);
                                }}
                                disabled={isStarted}
                                className={`p-1.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                                  isStarted
                                    ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50"
                                    : lockedMatches[m.match_no]
                                    ? "bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-300 shadow-3xs"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-600"
                                }`}
                                title={
                                  isStarted 
                                    ? "Match is started and automatically locked" 
                                    : lockedMatches[m.match_no] 
                                    ? "Locked (Frozen selection)" 
                                    : "Unlocked (strategy updates allowed)"
                                }
                              >
                                {isStarted || lockedMatches[m.match_no] ? (
                                  <Lock className="w-3.5 h-3.5" />
                                ) : (
                                  <Unlock className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ingest Custom Matches or Paste config section directly */}
            <div className="bg-slate-100/60 rounded-xl border border-dashed border-slate-300 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                  <UploadCloud className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Pasted custom 17-Match configurations?</h4>
                  <p className="text-[11px] text-slate-500">
                    Import structured JSON formats direct to the database spreadsheet index. No selenium drivers required.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex gap-2">
                <button
                  onClick={() => setShowJsonModal(true)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer"
                >
                  Configure JSON Payload
                </button>
              </div>
            </div>

            {/* Bets vs Outcome / Results Tracking Dashboard */}
            <div className={`bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col text-left transition-all duration-300 ${
              predictionsSectionCollapsed ? "p-4 gap-0" : "p-6 gap-6"
            }`}>
              <div className={`flex flex-col gap-2 ${!predictionsSectionCollapsed ? "border-b border-slate-200/50 pb-4" : ""}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div 
                    className="flex items-start justify-between w-full md:w-auto cursor-pointer select-none group"
                    onClick={() => setPredictionsSectionCollapsed(!predictionsSectionCollapsed)}
                    title={predictionsSectionCollapsed ? "Expand Section" : "Collapse Section"}
                  >
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 group-hover:text-indigo-650 transition-colors">
                        <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
                        <span>Bets & AI Predictions vs Match Outcomes</span>
                        {predictionsSectionCollapsed ? (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-sans tracking-wider select-none">Expand</span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-sans tracking-wider select-none">Collapse</span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Verify matches in real-time or examine historical SportPesa Mega Jackpot performances across different model optimization layers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                    {!predictionsSectionCollapsed && (
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
                        <button
                          onClick={() => setActiveResultsTab("sandbox")}
                          className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeResultsTab === "sandbox"
                              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-3xs"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>Live Sandbox Simulator</span>
                        </button>
                        <button
                          onClick={() => setActiveResultsTab("backtest")}
                          className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeResultsTab === "backtest"
                              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-3xs"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>Past MJP Backtester</span>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setPredictionsSectionCollapsed(!predictionsSectionCollapsed)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-slate-200/60 shadow-3xs"
                      title={predictionsSectionCollapsed ? "Expand Section" : "Collapse Section"}
                    >
                      {predictionsSectionCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {!predictionsSectionCollapsed && (
                <>
                  {activeResultsTab === "sandbox" ? (
                <>
                  {/* Sandbox Toolbar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-150">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs uppercase font-mono">Sandbox Operations:</h4>
                      <p className="text-[10px] text-slate-400">Click individual outcome badges manually, or simulate complete virtual results instantly.</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleSimulateOutcomes}
                        disabled={isResoluting}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Activity className={`w-3.5 h-3.5 ${isResoluting ? "animate-spin" : ""}`} />
                        <span>{isResoluting ? "Resolving Matches..." : "Simulate Live Results"}</span>
                      </button>
                      {Object.keys(actualOutcomes).length > 0 && (
                        <button
                          onClick={handleResetOutcomes}
                          className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          Reset Results
                        </button>
                      )}
                    </div>
                  </div>

                  {/* accuracy grid comparisons row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
                    {[17, 16, 15, 14, 13].map((size) => {
                      const info = getSubJackpotAccuracyInfo(size);
                      const winBonus = info.customBonus !== "No Bonus";
                      const percent = info.customTotal > 0 ? (info.customCorrect / info.customTotal) * 100 : 0;
                      
                      return (
                        <div 
                          key={size} 
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                            winBonus 
                              ? "bg-emerald-50/40 border-emerald-250 shadow-inner" 
                              : "bg-slate-50/65 border-slate-200/80"
                          }`}
                        >
                          <div className="space-y-1.5 text-left">
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono">
                              MJP {size} Pool
                            </span>
                            
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-lg font-black font-mono text-slate-800">
                                {info.customCorrect}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">/{size}</span>
                            </div>
                            
                            <div className="relative w-full bg-slate-250 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                style={{ width: `${percent}%` }}
                                className={`h-full rounded-full transition-all duration-300 ${
                                  winBonus ? "bg-emerald-500 animate-pulse" : "bg-indigo-600"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-200/35 space-y-1.5 text-left">
                            <span className={`text-[9.5px] font-black tracking-tight leading-none block font-mono ${
                              winBonus ? "text-emerald-700 font-bold animate-pulse" : "text-slate-400"
                            }`}>
                              {info.hasSimulatedResults ? info.customBonus : "Awaiting Results"}
                            </span>
                            
                            <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded border border-slate-200/35 text-[9px] text-slate-500 space-y-1 font-mono">
                              <div className="flex justify-between items-center">
                                <span>Favorites:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {info.favoritesCorrect}/{size}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Balanced:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {info.balancedCorrect}/{size}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Bold Upsets:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {info.boldCorrect}/{size}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Match-by-match virtual outcomes resolver board */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center flex-wrap gap-2 text-left">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        Match-by-Match Live Resolver Table ({Object.keys(actualOutcomes).length}/17 legs)
                      </span>
                      <span className="text-[9.5px] font-medium text-indigo-600 italic">
                        💡 Click outcome badges directly/manually to customize outcomes!
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-inner">
                      <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                        <thead>
                          <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-mono tracking-wider font-semibold">
                            <th className="px-3 py-2 w-16 text-center">Leg #</th>
                            <th className="px-4 py-2">Match Description</th>
                            <th className="px-4 py-2 w-40 text-center">My Selection</th>
                            <th className="px-4 py-2 w-52 text-center">Simulated Actual</th>
                            <th className="px-4 py-2 w-32 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {matches.map((m) => {
                            const actual = actualOutcomes[m.match_no];
                            const userSel = selections[m.match_no] || [];
                            const hasSel = userSel.length > 0;
                            const isCorrect = hasSel && actual && userSel.includes(actual);
                            
                            let statusBadge = (
                              <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-full text-[9px] font-semibold text-slate-400 font-mono">
                                Awaiting
                              </span>
                            );
                            if (actual) {
                              if (hasSel) {
                                if (isCorrect) {
                                  statusBadge = (
                                    <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[9px] font-extrabold font-mono flex items-center justify-center gap-0.5 animate-bounce">
                                      CORRECT ✅
                                    </span>
                                  );
                                } else {
                                  statusBadge = (
                                    <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-[9px] font-extrabold font-mono flex items-center justify-center gap-0.5">
                                      WRONG ❌
                                    </span>
                                  );
                                }
                              } else {
                                statusBadge = (
                                  <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[9px] font-bold font-mono">
                                    Unselected
                                  </span>
                                );
                              }
                            }

                            return (
                              <tr key={m.match_no} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-3 py-2 text-center font-mono font-black text-slate-800">
                                  #{m.match_no}
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex flex-col text-left">
                                    <span className="font-bold text-slate-900">{m.home} vs {m.away}</span>
                                    <span className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">{m.league} &bull; {m.kickoff}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center justify-center gap-1">
                                    {hasSel ? (
                                      userSel.map((ch) => (
                                        <span 
                                          key={ch} 
                                          className={`px-2 py-0.5 rounded text-[10px] font-black font-mono shadow-3xs ${
                                            actual === ch 
                                              ? "bg-emerald-600 border border-emerald-700 text-white" 
                                              : "bg-indigo-600 border border-indigo-700 text-white"
                                          }`}
                                        >
                                          {ch}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-slate-400 italic text-[10px]">No picks</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {["1", "X", "2"].map((val) => {
                                      const isActiveOutcome = actual === val;
                                      return (
                                        <button
                                          key={val}
                                          onClick={() => handleToggleSingleOutcome(m.match_no, val as "1" | "X" | "2")}
                                          className={`w-10 py-1 border rounded font-black font-mono transition-all text-[11px] cursor-pointer ${
                                            isActiveOutcome
                                              ? "bg-slate-900 border-slate-950 text-white shadow-xs scale-105"
                                              : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                          }`}
                                        >
                                          {val}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <div className="flex justify-center">
                                    {statusBadge}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Historical Backtester Workspace */}
                  <div className="space-y-6">
                    {/* AI Balanced Accuracy Trend Line Chart */}
                    <AIBacktestTrendChart 
                      selectedPoolId={selectedBacktestPoolId}
                      onSelectPool={(poolId) => setSelectedBacktestPoolId(poolId)}
                    />

                    {/* Jackpot Selectors */}
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-mono block">
                        Select Past SportPesa Mega Jackpot
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {HISTORICAL_BACKTEST_POOLS.map((pool) => {
                          const isActive = selectedBacktestPoolId === pool.id;
                          return (
                            <button
                              key={pool.id}
                              onClick={() => setSelectedBacktestPoolId(pool.id)}
                              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                                isActive
                                  ? "bg-indigo-50/50 border-indigo-500 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-500"
                                  : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[11px] font-black font-mono px-2 py-0.5 rounded-md ${
                                  isActive ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
                                }`}>
                                  {pool.id}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium font-mono">
                                  {pool.date}
                                </span>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500">Jackpot Value:</div>
                                <div className="text-sm font-black text-indigo-800 dark:text-indigo-400 font-mono">
                                  {pool.grandPrize}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* selected pool metadata and comparative summary banner */}
                    {(() => {
                      const pool = HISTORICAL_BACKTEST_POOLS.find(p => p.id === selectedBacktestPoolId) || HISTORICAL_BACKTEST_POOLS[0];
                      
                      const stats = {
                        conservative: (() => {
                          let correct = 0;
                          pool.matches.forEach(m => { if (m.ai_predictions.conservative === m.actual) correct++; });
                          const pct = ((correct / 17) * 100).toFixed(1);
                          let bonus = "No Payout Level Met";
                          if (correct === 17) bonus = `Mega Jackpot Winner! 🏆 (${pool.grandPrize})`;
                          else if (correct === 16) bonus = `16/17 Winner 🥈 (${pool.bonus_16})`;
                          else if (correct === 15) bonus = `15/17 Winner 🥉 (${pool.bonus_15})`;
                          else if (correct === 14) bonus = `14/17 Winner (${pool.bonus_14})`;
                          else if (correct === 13) bonus = `13/17 Winner (${pool.bonus_13})`;
                          else if (correct === 12) bonus = `12/17 Winner (${pool.bonus_12})`;
                          return { correct, pct, bonus };
                        })(),
                        balanced: (() => {
                          let correct = 0;
                          pool.matches.forEach(m => { if (m.ai_predictions.balanced === m.actual) correct++; });
                          const pct = ((correct / 17) * 100).toFixed(1);
                          let bonus = "No Payout Level Met";
                          if (correct === 17) bonus = `Mega Jackpot Winner! 🏆 (${pool.grandPrize})`;
                          else if (correct === 16) bonus = `16/17 Winner 🥈 (${pool.bonus_16})`;
                          else if (correct === 15) bonus = `15/17 Winner 🥉 (${pool.bonus_15})`;
                          else if (correct === 14) bonus = `14/17 Winner (${pool.bonus_14})`;
                          else if (correct === 13) bonus = `13/17 Winner (${pool.bonus_13})`;
                          else if (correct === 12) bonus = `12/17 Winner (${pool.bonus_12})`;
                          return { correct, pct, bonus };
                        })(),
                        bold: (() => {
                          let correct = 0;
                          pool.matches.forEach(m => { if (m.ai_predictions.bold === m.actual) correct++; });
                          const pct = ((correct / 17) * 100).toFixed(1);
                          let bonus = "No Payout Level Met";
                          if (correct === 17) bonus = `Mega Jackpot Winner! 🏆 (${pool.grandPrize})`;
                          else if (correct === 16) bonus = `16/17 Winner 🥈 (${pool.bonus_16})`;
                          else if (correct === 15) bonus = `15/17 Winner 🥉 (${pool.bonus_15})`;
                          else if (correct === 14) bonus = `14/17 Winner (${pool.bonus_14})`;
                          else if (correct === 13) bonus = `13/17 Winner (${pool.bonus_13})`;
                          else if (correct === 12) bonus = `12/17 Winner (${pool.bonus_12})`;
                          return { correct, pct, bonus };
                        })()
                      };

                      return (
                        <div className="space-y-6">
                          {/* Comparative Cards Dashboard */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Conservative Card */}
                            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/85 p-4 flex flex-col justify-between text-left relative overflow-hidden">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] uppercase font-semibold font-mono text-slate-400 tracking-wider">
                                    Conservative / Bookie Favorites
                                  </span>
                                  <span className="text-[9.5px] bg-slate-200 rounded-full font-bold px-2 py-0.5 text-slate-600 font-mono">
                                    Odds-Based
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-3xl font-black font-mono text-slate-800">
                                    {stats.conservative.correct}
                                  </span>
                                  <span className="text-sm font-mono text-slate-400">/17 Correct</span>
                                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold font-mono ml-auto">
                                    {stats.conservative.pct}%
                                  </span>
                                </div>
                                <div className="relative w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <div 
                                    style={{ width: `${stats.conservative.pct}%` }}
                                    className="h-full bg-slate-500 rounded-full transition-all duration-300"
                                  />
                                </div>
                              </div>
                              <div className="mt-4 pt-3.5 border-t border-slate-250 border-slate-200 text-left">
                                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono block">
                                  Backtest Payout Reward Status
                                </span>
                                <span className={`text-xs font-black tracking-tight mt-1 inline-flex items-center gap-1 ${
                                  stats.conservative.correct >= 12 ? "text-emerald-600 animate-pulse" : "text-rose-600/80"
                                }`}>
                                  🏆 {stats.conservative.bonus}
                                </span>
                              </div>
                            </div>

                            {/* AI Balanced Card */}
                            <div className="bg-indigo-50/20 dark:bg-indigo-950/10 rounded-xl border border-indigo-200 p-4 flex flex-col justify-between text-left relative overflow-hidden ring-1 ring-indigo-300/30">
                              <div className="absolute top-0 right-0 py-0.5 px-3 bg-indigo-600 text-white text-[8px] uppercase tracking-widest font-black rounded-bl-lg">
                                RECOMMENDED
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] uppercase font-black font-mono text-indigo-700 dark:text-indigo-300 tracking-wider">
                                    AI Balanced Prediction Model
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-3xl font-black font-mono text-indigo-900 dark:text-indigo-300">
                                    {stats.balanced.correct}
                                  </span>
                                  <span className="text-sm font-mono text-slate-400">/17 Correct</span>
                                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold font-mono ml-auto">
                                    {stats.balanced.pct}%
                                  </span>
                                </div>
                                <div className="relative w-full bg-indigo-200 h-2 rounded-full overflow-hidden">
                                  <div 
                                    style={{ width: `${stats.balanced.pct}%` }}
                                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                  />
                                </div>
                              </div>
                              <div className="mt-4 pt-3.5 border-t border-indigo-200/50 text-left">
                                <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400 font-mono block">
                                  Backtest Payout Reward Status
                                </span>
                                <span className={`text-xs font-black tracking-tight mt-1 inline-flex items-center gap-1 ${
                                  stats.balanced.correct >= 12 ? "text-emerald-600 animate-pulse" : "text-rose-600/80"
                                }`}>
                                  🏆 {stats.balanced.bonus}
                                </span>
                              </div>
                            </div>

                            {/* Bold Upsets Card */}
                            <div className="bg-rose-50/20 dark:bg-slate-800/65 rounded-xl border border-rose-200/60 p-4 flex flex-col justify-between text-left relative overflow-hidden">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] uppercase font-semibold font-mono text-rose-700 dark:text-rose-300 tracking-wider">
                                    Bold / High Volatility Outliers
                                  </span>
                                  <span className="text-[9.5px] bg-rose-100 rounded-full font-bold px-2 py-0.5 text-rose-700 font-mono">
                                    Upset Bias
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-3xl font-black font-mono text-rose-850 text-rose-800 dark:text-rose-400">
                                    {stats.bold.correct}
                                  </span>
                                  <span className="text-sm font-mono text-slate-400">/17 Correct</span>
                                  <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold font-mono ml-auto">
                                    {stats.bold.pct}%
                                  </span>
                                </div>
                                <div className="relative w-full bg-rose-100 h-2 rounded-full overflow-hidden">
                                  <div 
                                    style={{ width: `${stats.bold.pct}%` }}
                                    className="h-full bg-rose-500 rounded-full transition-all duration-300"
                                  />
                                </div>
                              </div>
                              <div className="mt-4 pt-3.5 border-t border-rose-200/40 text-left">
                                <span className="text-[10px] uppercase font-black tracking-wider text-rose-400 font-mono block">
                                  Backtest Payout Reward Status
                                </span>
                                <span className={`text-xs font-black tracking-tight mt-1 inline-flex items-center gap-1 ${
                                  stats.bold.correct >= 12 ? "text-emerald-700 animate-pulse" : "text-rose-600/80"
                                }`}>
                                  🏆 {stats.bold.bonus}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Historical Pool Details Table */}
                          <div className="space-y-2.5">
                            <span className="text-[10px] font-black text-rose-900/40 text-slate-400 uppercase tracking-widest font-mono">
                              Detailed Backtest Matrix (Leg-by-Leg Model Performance)
                            </span>
                            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-inner">
                              <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                                <thead>
                                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-mono tracking-wider font-semibold">
                                    <th className="px-3 py-2 w-16 text-center">Leg #</th>
                                    <th className="px-4 py-2">Match Description</th>
                                    <th className="px-3 py-2 w-28 text-center bg-indigo-50/20">Actual Result</th>
                                    <th className="px-3 py-2 w-32 text-center">Conservative</th>
                                    <th className="px-3 py-2 w-32 text-center bg-indigo-50/10">AI Balanced</th>
                                    <th className="px-3 py-2 w-32 text-center">Bold Upset</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {pool.matches.map((m) => {
                                    const actual = m.actual;
                                    
                                    const isConsCorrect = m.ai_predictions.conservative === actual;
                                    const isBalCorrect = m.ai_predictions.balanced === actual;
                                    const isBldCorrect = m.ai_predictions.bold === actual;

                                    return (
                                      <tr key={m.match_no} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-3 py-2.5 text-center font-mono font-black text-slate-800">
                                          #{m.match_no}
                                        </td>
                                        <td className="px-4 py-2.5">
                                          <div className="flex flex-col text-left">
                                            <span className="font-bold text-slate-900">{m.home} vs {m.away}</span>
                                            <span className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">
                                              {m.league} &bull; Odds (1: {m.odds["1"].toFixed(2)}, X: {m.odds["X"].toFixed(2)}, 2: {m.odds["2"].toFixed(2)})
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-center bg-indigo-50/20 font-bold">
                                          <span className="px-3 py-1 bg-indigo-600 border border-indigo-700 text-white font-mono rounded text-xs leading-none shadow-3xs inline-block">
                                            {actual}
                                          </span>
                                        </td>
                                        
                                        {/* Conservative column */}
                                        <td className={`px-3 py-2.5 text-center font-mono font-medium ${isConsCorrect ? "bg-emerald-500/5" : "bg-rose-500/5"}`}>
                                          <div className="flex items-center justify-center gap-1.5">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                              isConsCorrect ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                                            }`}>
                                              {m.ai_predictions.conservative}
                                            </span>
                                            <span className="text-xs leading-none">
                                              {isConsCorrect ? "✅" : "❌"}
                                            </span>
                                          </div>
                                        </td>

                                        {/* AI Balanced column */}
                                        <td className={`px-3 py-2.5 text-center bg-indigo-50/10 font-mono font-bold ${isBalCorrect ? "bg-emerald-500/10" : "bg-rose-500/5"}`}>
                                          <div className="flex items-center justify-center gap-1.5">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                              isBalCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                                            }`}>
                                              {m.ai_predictions.balanced}
                                            </span>
                                            <span className="text-xs leading-none">
                                              {isBalCorrect ? "✅" : "❌"}
                                            </span>
                                          </div>
                                        </td>

                                        {/* Bold Upset column */}
                                        <td className={`px-3 py-2.5 text-center font-mono font-medium ${isBldCorrect ? "bg-emerald-500/5" : "bg-rose-500/5"}`}>
                                          <div className="flex items-center justify-center gap-1.5">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                              isBldCorrect ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-500"
                                            }`}>
                                              {m.ai_predictions.bold}
                                            </span>
                                            <span className="text-xs leading-none">
                                              {isBldCorrect ? "✅" : "❌"}
                                            </span>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
                </>
              )}
            </div>

          </section>

          {/* RIGHT SIDEBAR: Terminal and Analysis Panel (col-span-4) */}
          <aside className="col-span-12 lg:col-span-4 flex flex-col space-y-6 md:space-y-8">
            
            {/* Real Ticket Combinations Calculation Widget */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-left">
                    PRO TICKET PERMUTATIONS
                  </h3>
                  <p className="text-[10px] text-slate-400">SportPesa Mega Jackpot Pricing Grid</p>
                </div>
                <span className="text-2xs bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded uppercase font-sans">
                  Interactive
                </span>
              </div>

              {(() => {
                const filledCount = getActiveSelectionsCount();
                
                // Calculate distribution weights
                let homeCount = 0;
                let drawCount = 0;
                let awayCount = 0;
                let totalPicks = 0;

                matches.forEach((m) => {
                  if (!isMatchActive(m.match_no)) return;
                  const picks = selections[m.match_no] || [];
                  picks.forEach((p) => {
                    if (p === "1") homeCount++;
                    else if (p === "X") drawCount++;
                    else if (p === "2") awayCount++;
                    totalPicks++;
                  });
                });

                const homePercent = totalPicks > 0 ? Math.round((homeCount / totalPicks) * 100) : 0;
                const drawPercent = totalPicks > 0 ? Math.round((drawCount / totalPicks) * 100) : 0;
                const awayPercent = totalPicks > 0 ? Math.round((awayCount / totalPicks) * 100) : 0;

                return (
                  <div className="space-y-4 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Combination Lines:</span>
                      <span className="font-bold font-mono text-slate-900">{totalCombinations} lines</span>
                    </div>

                    {/* Visual Option Distribution Heat-Strip */}
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between text-[9px] mb-0.5">
                        <span className="text-slate-500 font-extrabold uppercase tracking-wider text-[8px]">Selection Bias Profile:</span>
                        <span className="font-black text-slate-700">
                          H:{homeCount} &bull; D:{drawCount} &bull; A:{awayCount}
                        </span>
                      </div>
                      {totalPicks > 0 ? (
                        <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-200 border border-slate-300/40">
                          {homeCount > 0 && <div style={{ width: `${homePercent}%` }} className="bg-emerald-500 h-full transition-all duration-300" title={`Home wins: ${homePercent}%`} />}
                          {drawCount > 0 && <div style={{ width: `${drawPercent}%` }} className="bg-amber-500 h-full transition-all duration-300" title={`Draws: ${drawPercent}%`} />}
                          {awayCount > 0 && <div style={{ width: `${awayPercent}%` }} className="bg-indigo-500 h-full transition-all duration-300" title={`Away wins: ${awayPercent}%`} />}
                        </div>
                      ) : (
                        <div className="h-2 w-full rounded-full bg-slate-200/50 border border-dashed border-slate-300" />
                      )}
                      <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Home ({homePercent}%)</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Draw ({drawPercent}%)</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Away ({awayPercent}%)</span>
                      </div>
                    </div>

                    {/* Double Chance & Price Trend Presets */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-extrabold uppercase tracking-wide text-[9px] flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-indigo-650 animate-pulse" />
                          Strategic Cost Presets (2^D Trend)
                        </span>
                        <span className="text-[9px] uppercase font-bold text-slate-500">
                          Strategy: <span className="text-indigo-600 font-extrabold">{activeStrategy ? activeStrategy.toUpperCase() : "AI-BALANCED"}</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Select a target permutation level to auto-fill your jackpot slip instantly based on the current active strategy model:
                      </p>
                      
                      <div className="grid grid-cols-5 gap-1.5 mt-1">
                        {[
                          { doubles: 0, cost: 99, label: "0 Doubles", desc: "1 Line" },
                          { doubles: 1, cost: 198, label: "1 Double", desc: "2 Lines" },
                          { doubles: 3, cost: 792, label: "3 Doubles", desc: "8 Lines" },
                          { doubles: 5, cost: 3168, label: "5 Doubles", desc: "32 Lines" },
                          { doubles: 7, cost: 12672, label: "7 Doubles", desc: "128 Lines" }
                        ].map((preset) => {
                          const isActive = doubleChanceCount === preset.doubles;
                          return (
                            <button
                              key={preset.doubles}
                              type="button"
                              onClick={() => {
                                handleQuickPick(preset.doubles);
                                addLog(`[Presets] Automatically loaded ${preset.doubles} Double-Chances utilizing ${activeStrategy || "AI-BALANCED"} matching model.`);
                              }}
                              className={`p-1.5 rounded-lg border flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${
                                isActive
                                  ? "bg-indigo-600 border-indigo-700 text-white shadow-xs"
                                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300"
                              }`}
                              title={`Auto-generate slip using current strategy with ${preset.doubles} double-chances (${Math.pow(2, preset.doubles)} lines)`}
                            >
                              <span className="text-[9px] font-black tracking-tight block">
                                D-{preset.doubles}
                              </span>
                              <span className={`text-[8px] block font-mono font-medium ${isActive ? "text-indigo-100" : "text-slate-500"}`}>
                                Ksh {preset.cost >= 1000 ? `${(preset.cost / 1000).toFixed(1)}k` : preset.cost}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="font-bold text-slate-800">Total Coupon Price:</span>
                      <span className="text-lg font-black text-indigo-600 font-mono">
                        Ksh {estimatedCost.toLocaleString()}
                      </span>
                    </div>

                    {totalCombinations > 128 && (
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-2 text-amber-800 text-[11px] leading-relaxed">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Permutation Limit Alert</span>: Double chances generally require up to 7 double picks (128 combos). High cost accumulates easily.
                        </div>
                      </div>
                    )}

                    {/* PROGRESS & VACANT LL FEATHER SECTION */}
                    {filledCount < subJackpotSize ? (
                      <div className="space-y-2 pt-3 border-t border-slate-100">
                        <div className="bg-rose-50/70 p-2.5 rounded-lg border border-rose-100 text-[10.5px] leading-relaxed text-rose-800 text-left">
                          <div className="font-extrabold flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                            Incomplete Slip ({filledCount} / {subJackpotSize} active legs)
                          </div>
                          <p className="text-[10px] text-rose-600/90 mt-0.5 font-medium">
                            You have {subJackpotSize - filledCount} unpredicted games inside the current active MJP slip size configuration.
                          </p>
                        </div>
                        <button
                          onClick={handleAIQuickFillRemaining}
                          className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-200 font-black uppercase text-[10px] tracking-wider rounded-lg transition-all shadow-3xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                          AI Auto-Fill {subJackpotSize - filledCount} Vacant Legs
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1 pt-3 border-t border-slate-100 text-left">
                        <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 text-[10.5px] leading-relaxed text-emerald-800">
                          <div className="font-extrabold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Coupon Fully Prepared! ({filledCount} legs populated)
                          </div>
                          <p className="text-[10px] text-emerald-600/90 mt-0.5 font-medium">
                            Perfect! Every match selection slot is chosen. Ready for syndication verification.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Scraper Terminal Output Panel */}
            <div className="bg-slate-950 rounded-xl p-5 flex flex-col h-[280px] shadow-lg shadow-slate-200">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  Scraper Terminal Driver Logging
                </h3>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-500/20 uppercase font-mono font-bold tracking-widest flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></span>
                  Ready
                </span>
              </div>

              <div className="flex-1 bg-black/50 rounded-lg p-3.5 font-mono text-[9px] text-emerald-400 overflow-y-auto leading-relaxed border border-slate-800 flex flex-col space-y-1 mt-0">
                {terminalLogs.map((log, index) => (
                  <p key={index} className="opacity-90 break-all select-all font-mono text-left">
                    {log}
                  </p>
                ))}
                <div ref={terminalEndRef}></div>
              </div>
            </div>

            {/* AI Predictions & In-Depth Tactical Analysis Details View */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex-1 flex flex-col min-h-[380px]">
              
              {selectedMatch ? (
                <div className="flex-1 flex flex-col">
                  
                  {/* Sidebar title */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 shrink-0">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                        Match #{selectedMatch.match_no} Intel
                      </span>
                      <h4 className="font-black text-slate-800 text-sm truncate max-w-[220px]">
                        {selectedMatch.home} vs {selectedMatch.away}
                      </h4>
                    </div>

                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
                      League Ranks: #{selectedMatch.homeRank || "N/A"} vs #{selectedMatch.awayRank || "N/A"}
                    </span>
                  </div>

                  {/* Get Notified Kickoff Preference Tracker */}
                  <div className="bg-slate-50 rounded-xl p-3.5 mb-4 border border-slate-200/70 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg transition-all ${notifiedMatches[selectedMatch.match_no] ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200/50 text-slate-400'}`}>
                        {notifiedMatches[selectedMatch.match_no] ? (
                          <BellRing className="w-4 h-4 animate-pulse text-indigo-600" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-black text-slate-700 tracking-tight block">Get Kickoff Alert</span>
                        <span className="text-[9px] text-slate-400 font-mono block">Remind 30m before kickoff</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleNotification(selectedMatch.match_no, selectedMatch.home, selectedMatch.away, selectedMatch.kickoff)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifiedMatches[selectedMatch.match_no] ? "bg-indigo-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          notifiedMatches[selectedMatch.match_no] ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Category switcher tabs */}
                  <div className="flex border border-slate-200/80 mb-4 bg-slate-100/60 p-1 rounded-xl gap-1 shrink-0">
                    <button
                      onClick={() => setAnalysisTab("tactical")}
                      className={`flex-1 py-1.5 px-3 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all duration-150 cursor-pointer ${
                        analysisTab === "tactical"
                          ? "bg-white text-slate-900 shadow-3xs border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Tactical Intel
                    </button>
                    <button
                      onClick={() => setAnalysisTab("league")}
                      className={`flex-1 py-1.5 px-3 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all duration-150 cursor-pointer ${
                        analysisTab === "league"
                          ? "bg-white text-slate-900 shadow-3xs border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Standings & Scorers
                    </button>
                  </div>

                  {/* Quick Team / Match Quick Scroller */}
                  {(() => {
                    const sortedActiveMatches = [...matches].sort((a, b) => parseInt(a.match_no) - parseInt(b.match_no));
                    const currentIdx = sortedActiveMatches.findIndex((m) => m.match_no === selectedMatch?.match_no);
                    
                    return (
                      <div className="flex items-center justify-between gap-1 p-1 bg-slate-50 border border-slate-150/80 mb-4 rounded-xl shadow-3xs shrink-0 select-none">
                        <button
                          type="button"
                          disabled={currentIdx <= 0}
                          onClick={() => {
                            if (currentIdx > 0) {
                              handleAnalyzeMatch(sortedActiveMatches[currentIdx - 1], activeFallbackEngine);
                            }
                          }}
                          className="p-1 px-2.5 text-[10px] font-bold uppercase tracking-tight hover:bg-slate-200/40 text-slate-600 disabled:opacity-25 rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1 shrink-0 border border-transparent hover:border-slate-200/60 disabled:cursor-not-allowed"
                          title="Previous Match Stats"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                          <span>Prev Team</span>
                        </button>

                        <div className="flex flex-col items-center flex-1 min-w-0">
                          <span className="text-[9px] font-black font-mono text-indigo-650 uppercase tracking-wider block leading-none mb-1">
                            Browse games ({currentIdx >= 0 ? currentIdx + 1 : "?"}/{sortedActiveMatches.length})
                          </span>
                          <select
                            value={selectedMatch?.match_no || ""}
                            onChange={(e) => {
                              const matched = sortedActiveMatches.find((m) => m.match_no === e.target.value);
                              if (matched) handleAnalyzeMatch(matched, activeFallbackEngine);
                            }}
                            className="text-[11px] font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer text-center py-0 max-w-full truncate font-sans outline-none leading-none select-none"
                          >
                            {sortedActiveMatches.map((m) => (
                              <option key={m.match_no} value={m.match_no} className="text-slate-800 text-left font-sans font-medium text-xs">
                                #{m.match_no}: {m.home} vs {m.away}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          disabled={currentIdx < 0 || currentIdx >= sortedActiveMatches.length - 1}
                          onClick={() => {
                            if (currentIdx >= 0 && currentIdx < sortedActiveMatches.length - 1) {
                              handleAnalyzeMatch(sortedActiveMatches[currentIdx + 1], activeFallbackEngine);
                            }
                          }}
                          className="p-1 px-2.5 text-[10px] font-bold uppercase tracking-tight hover:bg-slate-200/40 text-slate-600 disabled:opacity-25 rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1 shrink-0 border border-transparent hover:border-slate-200/60 disabled:cursor-not-allowed"
                          title="Next Match Stats"
                        >
                          <span>Next Team</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      </div>
                    );
                  })()}

                  {isAnalyzing ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-lg mb-4">
                      <RefreshCw className="w-7 h-7 text-indigo-500 animate-spin mb-2" />
                      <p className="text-slate-500 text-xs font-semibold">Generating tactical matrix model...</p>
                      <p className="text-[10px] text-slate-400 mt-1">Calling Gemini Sports Accumulator APIs</p>
                    </div>
                  ) : analysisTab === "league" && leagueData ? (
                    <div className="flex-1 flex flex-col space-y-5 text-slate-700">
                      
                      {/* League Metadata */}
                      <div className="flex justify-between items-center text-left bg-slate-50 p-3 rounded-xl border border-slate-200/60 shadow-3xs">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                            Target League Context
                          </span>
                          <span className="font-bold text-slate-800 text-sm">{leagueData.leagueName}</span>
                        </div>
                        <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold px-2 py-0.5 rounded-md">
                          Live Seeded
                        </span>
                      </div>

                      {/* Standings Sub-panel */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            LEAGUE STANDINGS
                          </span>
                          <span className="text-[9px] font-mono font-bold text-slate-400">Matchday 32 / 38</span>
                        </div>
                        
                        <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-white shadow-3xs max-h-[300px] overflow-y-auto">
                          <table className="w-full text-left border-collapse font-sans text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-150/65 text-[10px] text-slate-400 font-extrabold font-mono uppercase tracking-tight">
                                <th className="py-2 pl-3 pr-1 text-center w-8">#</th>
                                <th className="py-2 px-2">Team</th>
                                <th className="py-2 px-1 text-center w-8">P</th>
                                <th className="py-2 px-1 text-center font-bold w-10">Pts</th>
                                <th className="py-2 pr-3 pl-1 text-center font-bold w-24">Form</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {leagueData.standings.map((row) => {
                                const isHome = row.team.toLowerCase() === selectedMatch.home.toLowerCase();
                                const isAway = row.team.toLowerCase() === selectedMatch.away.toLowerCase();
                                return (
                                  <tr 
                                    key={row.position} 
                                    className={`transition-colors text-[11px] ${
                                      isHome 
                                        ? "bg-emerald-50/70 font-semibold text-emerald-900 border-l-2 border-l-emerald-500" 
                                        : isAway 
                                        ? "bg-indigo-50/70 font-semibold text-indigo-900 border-l-2 border-l-indigo-500" 
                                        : "hover:bg-slate-50/60"
                                    }`}
                                  >
                                    <td className="py-1.5 pl-3 pr-1 text-center font-mono font-medium text-slate-400">
                                      {row.position}
                                    </td>
                                    <td className="py-1.5 px-2 truncate max-w-[124px]">
                                      <div className="flex items-center gap-1.5">
                                        {isHome && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />}
                                        {isAway && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block shrink-0" />}
                                        <span className="truncate">{row.team}</span>
                                      </div>
                                    </td>
                                    <td className="py-1.5 px-1 text-center font-mono text-slate-500">{row.played}</td>
                                    <td className="py-1.5 px-1 text-center font-mono font-bold text-slate-800">{row.points}</td>
                                    <td className="py-1.5 pr-3 pl-1 text-center">
                                      <div className="flex justify-center gap-0.5">
                                        {row.form.map((f, i) => (
                                          <span 
                                            key={i} 
                                            className={`w-3.5 h-3.5 rounded text-[8px] font-black uppercase inline-flex items-center justify-center font-mono ${
                                              f === "W" 
                                                ? "bg-emerald-100 text-emerald-700" 
                                                : f === "D" 
                                                ? "bg-amber-100 text-amber-700" 
                                                : "bg-rose-100 text-rose-700"
                                            }`}
                                            title={`Form: ${f}`}
                                          >
                                            {f}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Top Scorers Sub-panel */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                            TOP GOAL SCORERS
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400">Golden Boot Race</span>
                        </div>
                        
                        <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-white shadow-3xs max-h-[220px] overflow-y-auto">
                          <table className="w-full text-left border-collapse font-sans text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-150/65 text-[10px] text-slate-400 font-extrabold font-mono uppercase tracking-tight">
                                <th className="py-2 pl-3 pr-1 text-center w-8">Rank</th>
                                <th className="py-2 px-2">Player</th>
                                <th className="py-2 px-2">Team</th>
                                <th className="py-2 px-1 text-center font-bold w-20">Goals (Pen)</th>
                                <th className="py-2 pr-3 text-center w-10 font-bold">Ast</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {leagueData.topScorers.map((scorer) => {
                                const isHome = scorer.team.toLowerCase() === selectedMatch.home.toLowerCase();
                                const isAway = scorer.team.toLowerCase() === selectedMatch.away.toLowerCase();
                                return (
                                  <tr 
                                    key={scorer.rank} 
                                    className={`transition-colors text-[11px] ${
                                      isHome 
                                        ? "bg-emerald-50/70 text-emerald-950 font-semibold" 
                                        : isAway 
                                        ? "bg-indigo-50/70 text-indigo-950 font-semibold" 
                                        : "hover:bg-slate-50/60"
                                    }`}
                                  >
                                    <td className="py-1.5 pl-3 pr-1 text-center font-mono font-medium text-slate-400">
                                      {scorer.rank}
                                    </td>
                                    <td className="py-1.5 px-2 font-semibold truncate max-w-[114px]">{scorer.name}</td>
                                    <td className="py-1.5 px-2 truncate max-w-[94px] text-slate-500 font-medium">{scorer.team}</td>
                                    <td className="py-1.5 px-1 text-center font-mono font-bold text-slate-800">
                                      {scorer.goals} <span className="text-[9px] text-slate-400 font-medium font-mono">({scorer.penaltyGoals})</span>
                                    </td>
                                    <td className="py-1.5 pr-3 text-center font-mono text-slate-500">{scorer.assists}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : analysis ? (
                    <div className="flex-1 flex flex-col justify-between space-y-4 text-xs text-slate-700">
                      
                      {/* Engine Selector */}
                      <div className="flex flex-col bg-slate-50 p-2.5 rounded-xl border border-slate-100 gap-2 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <BrainCircuit className="w-3 h-3 text-indigo-500" />
                            Tactical Forecast Engine
                          </span>
                          <span className="font-mono text-[9px] text-slate-400">
                            Status: <span className={analysis.rateLimited ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>{analysis.rateLimited ? "Fallback Active" : "Gemini Direct"}</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 bg-slate-200/50 p-0.5 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleAnalyzeMatch(selectedMatch!, undefined)}
                            disabled={!selectedMatch}
                            className={`text-[9px] py-1 rounded-md font-extrabold cursor-pointer transition-all duration-150 ${
                              !activeFallbackEngine
                                ? "bg-indigo-600 text-white shadow-3xs"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/30"
                            }`}
                          >
                            Gemini 1.5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAnalyzeMatch(selectedMatch!, "deepseek")}
                            disabled={!selectedMatch}
                            className={`text-[9px] py-1 rounded-md font-extrabold cursor-pointer transition-all duration-150 ${
                              activeFallbackEngine === "deepseek"
                                ? "bg-emerald-600 text-white shadow-3xs"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/30"
                            }`}
                          >
                            DeepSeek
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAnalyzeMatch(selectedMatch!, "grok")}
                            disabled={!selectedMatch}
                            className={`text-[9px] py-1 rounded-md font-extrabold cursor-pointer transition-all duration-150 ${
                              activeFallbackEngine === "grok"
                                ? "bg-stone-900 text-white shadow-3xs"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/30"
                            }`}
                          >
                            Grok 3
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAnalyzeMatch(selectedMatch!, "perplexity")}
                            disabled={!selectedMatch}
                            className={`text-[9px] py-1 rounded-md font-extrabold cursor-pointer transition-all duration-150 ${
                              activeFallbackEngine === "perplexity"
                                ? "bg-cyan-600 text-white shadow-3xs"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/30"
                            }`}
                          >
                            Perplexity
                          </button>
                        </div>
                      </div>

                      {analysis.rateLimited && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-100 text-left space-y-2 leading-relaxed shadow-lg">
                          <div className="flex items-start gap-2.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
                            <div className="flex-1">
                              <span className="font-extrabold block uppercase tracking-wide text-[10px] text-white">
                                Gemini Quota Busy • Routed Fallback Mode
                              </span>
                              <p className="text-slate-400 text-[9px] mt-0.5 leading-relaxed">
                                Gemini free-tier rate limits triggered. Successfully re-routed via <span className="text-indigo-400 font-extrabold">{analysis.fallbackEngine || "Simulated Model"}</span> for uninterrupted analytical forecasting.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {analysis.reasoningThoughts && (
                        <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 text-[9.5px] font-mono text-left space-y-1.5 text-indigo-200/90 shadow-inner">
                          <div className="flex items-center justify-between text-[8px] tracking-wider uppercase text-indigo-400 font-black border-b border-indigo-950/40 pb-1">
                            <span className="flex items-center gap-1">
                              <Terminal className="w-2.5 h-2.5" />
                              {analysis.fallbackEngine?.includes("DeepSeek")
                                ? "Deep Think Process"
                                : analysis.fallbackEngine?.includes("Grok")
                                ? "Grok Telemetry Streams"
                                : "Perplexity Grounding Web citations"}
                            </span>
                            <span className="animate-pulse">● ACTIVE_LOG</span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto pr-1 text-[9px] text-slate-300">
                            {analysis.reasoningThoughts}
                          </p>
                        </div>
                      )}

                      {/* Overview section */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left">
                          Tactical Overview
                        </span>
                        <p className="text-left bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed text-slate-600">
                          {analysis.tacticalOverview}
                        </p>
                      </div>

                      {/* Confidence and recommendation slots */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                            Confidence Index
                          </span>
                          <span
                            className={`text-xs font-bold mt-1 px-2 py-0.5 rounded ${
                              analysis.confidence === "High"
                                ? "bg-emerald-100 text-emerald-800 text-[10px]"
                                : analysis.confidence === "Medium"
                                ? "bg-amber-100 text-amber-800 text-[10px]"
                                : "bg-rose-100 text-rose-800 text-[10px]"
                            }`}
                          >
                            {analysis.confidence}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                            Suggested Pick
                          </span>
                          <span className="text-lg font-black text-indigo-600 mt-0.5 font-mono">
                            {analysis.suggestedPick === "1" ? `${selectedMatch.home} ("1")` : analysis.suggestedPick === "2" ? `${selectedMatch.away} ("2")` : 'Draw ("X")'}
                          </span>
                        </div>
                      </div>

                      {/* Predictions Model Probabilities Distribution */}
                      {selectedMatch.predictionStats && (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-left font-sans">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                              Predictions Model Probabilities
                            </span>
                            <span className="text-[8px] bg-slate-200 text-slate-600 font-mono px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                              Poisson Engine
                            </span>
                          </div>

                          {/* D3 Bar Chart Component */}
                          <div className="bg-white py-2 px-1 rounded-lg border border-slate-150/60 shadow-3xs">
                            <D3BarChart 
                              stats={selectedMatch.predictionStats}
                              matchNo={selectedMatch.match_no}
                              labels={{
                                "1": "1",
                                "X": "X",
                                "2": "2"
                              }}
                            />
                          </div>
                          
                          <div className="space-y-2.5 font-mono text-[10px]">
                            {/* Option 1: Home Win */}
                            <div className="space-y-1">
                              <div className="flex justify-between font-semibold text-slate-600">
                                <span className="truncate max-w-[170px]">"1" (Home Win: {selectedMatch.home})</span>
                                <span className="font-bold text-emerald-600">{selectedMatch.predictionStats["1"]}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${selectedMatch.predictionStats["1"]}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Option X: Draw */}
                            <div className="space-y-1">
                              <div className="flex justify-between font-semibold text-slate-600">
                                <span>"X" (Draw Margin)</span>
                                <span className="font-bold text-slate-500">{selectedMatch.predictionStats["X"]}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-slate-500 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${selectedMatch.predictionStats["X"]}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Option 2: Away Win */}
                            <div className="space-y-1">
                              <div className="flex justify-between font-semibold text-slate-600">
                                <span className="truncate max-w-[170px]">"2" (Away Win: {selectedMatch.away})</span>
                                <span className="font-bold text-indigo-600">{selectedMatch.predictionStats["2"]}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${selectedMatch.predictionStats["2"]}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Team Strength Attacking vs Defensive Heatmap Grid */}
                      <TeamStrengthHeatmap 
                        homeTeam={selectedMatch.home}
                        awayTeam={selectedMatch.away}
                        homeRank={selectedMatch.homeRank}
                        awayRank={selectedMatch.awayRank}
                        standings={leagueData?.standings || []}
                      />

                      {/* H2H Goal Differences Trend Chart */}
                      <D3H2HGoalDiffChart 
                        matchId={selectedMatch.id}
                        homeTeam={selectedMatch.home}
                        awayTeam={selectedMatch.away}
                        matchNo={selectedMatch.match_no}
                      />
                      {(() => {
                        const h2hTrendDetails = getHistoricalH2HData(selectedMatch.id, selectedMatch.home, selectedMatch.away);
                        const cumulativeGD = h2hTrendDetails.reduce((sum, item) => sum + item.goalDiff, 0);
                        const isPositive = cumulativeGD >= 0;
                        return (
                          <div className="mt-1.5 p-3 rounded-lg border border-slate-200/60 bg-slate-50 text-xs text-left font-sans flex items-center justify-between text-slate-600">
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isPositive ? "bg-emerald-500" : "bg-indigo-500"}`}></span>
                              <span>Goal Difference Trend: <strong className={isPositive ? "text-emerald-700" : "text-indigo-700 font-extrabold"}>{isPositive ? "Positive" : "Negative"}</strong></span>
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold">
                              Net GD: {cumulativeGD > 0 ? `+${cumulativeGD}` : cumulativeGD} goals
                            </span>
                          </div>
                        );
                      })()}

                      {/* Historical Odds Fluctuations Trend Chart */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left font-sans">
                        <D3LineChart 
                          matchId={selectedMatch.id}
                          baseOdds={selectedMatch.odds}
                          matchNo={selectedMatch.match_no}
                        />
                      </div>

                      {/* Justification section */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left">
                          Decision Motivation
                        </span>
                        <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed italic text-slate-600 text-left">
                          "{analysis.justification}"
                        </p>
                      </div>

                      {/* Key determinant factors */}
                      {analysis.keyFactors && analysis.keyFactors.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 text-left">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                            Historical Determinants
                          </span>
                          <ul className="space-y-1.5 font-sans">
                            {analysis.keyFactors.map((fact, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-600 leading-relaxed">
                                <span className="text-indigo-500 font-extrabold shrink-0 mt-0.5">•</span>
                                <span>{fact}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Apply button click direct to selection array */}
                      <button
                        onClick={() => {
                          if (analysis.suggestedPick) {
                            handleSelectOutcome(selectedMatch.match_no, analysis.suggestedPick);
                            showToast(`Selected suggested pick '${analysis.suggestedPick}' on Match ${selectedMatch.match_no}!`, "success");
                          }
                        }}
                        className="w-full mt-4 py-2.5 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-tight rounded-lg shadow cursor-pointer transition-colors"
                      >
                        Inject suggested pick into coupon grid
                      </button>

                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 rounded-lg text-center font-sans text-slate-400 text-xs text-left">
                      <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
                      Unable to synthesize analysis payload. Check your credentials structure.
                    </div>
                  )}

                  {/* Historical background notes */}
                  {selectedMatch.h2hText && (
                    <div className="mt-4 pt-3 border-t border-slate-100 text-left">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block mb-1">
                        H2H Information
                      </span>
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        {selectedMatch.h2hText}
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400 text-xs">
                  <Sparkles className="w-10 h-10 text-slate-300 mb-3 animate-pulse" />
                  <p className="font-semibold text-slate-600">Select any 17-match row</p>
                  <p className="text-[11px] mt-1 text-slate-400 leading-normal max-w-[200px]">
                    Highlight matches to explore real-time h2h profiles and live soccer insights databases.
                  </p>
                </div>
              )}

            </div>

          </aside>
        </main>
      )}

      {/* FOOTER SECTION */}
      <footer className="mt-12 h-14 border-t border-slate-200 bg-white px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-[11px] font-semibold text-slate-400 shrink-0 gap-3 md:gap-0 select-none py-3 md:py-0">
        <div className="tracking-wide">
          Engine Build: 2.4.0-stable | Python 3.11 & Selenium Hybrid Scrapers 4.x
        </div>
        <div className="flex space-x-6">
          <span className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            <span>Local Database Synchronized</span>
          </span>
          <span className="hidden sm:inline">Active session thread: taigajoe@gmail.com</span>
        </div>
      </footer>

      {/* MODAL WINDOW FOR JSON CUSTOM PORTAL INPUTS */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-250 p-6 max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-zoom-in text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                Raw JSON Accumulator Configuration Ingester
              </h3>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
              Match configuration must be formatted as an array containing exactly <span className="font-bold">17 matches</span>. You may click "Example Format" to fill.
            </p>

            <textarea
              className="flex-1 w-full p-3.5 bg-slate-50 font-mono text-xs text-slate-800 rounded-lg border border-slate-200 focus:bg-white focus:outline-none min-h-[220px]"
              placeholder='[
  {
    "match_no": "1",
    "home": "Arsenal",
    "away": "Manchester City",
    "league": "Premier League",
    "odds": { "1": 2.45, "X": 3.20, "2": 2.85 }
  },
  ...
]'
              value={customJsonInput}
              onChange={(e) => setCustomJsonInput(e.target.value)}
            ></textarea>

            <div className="flex justify-between items-center mt-5">
              <button
                onClick={() => {
                  const exampleSchema = matches.map((m) => ({
                    match_no: m.match_no,
                    home: m.home,
                    away: m.away,
                    league: m.league,
                    odds: { "1": m.odds["1"], "X": m.odds["X"], "2": m.odds["2"] },
                    homeForm: m.homeForm,
                    awayForm: m.awayForm,
                    homeRank: m.homeRank,
                    awayRank: m.awayRank,
                    h2hText: m.h2hText,
                    predictionStats: m.predictionStats,
                  }));
                  setCustomJsonInput(JSON.stringify(exampleSchema, null, 2));
                  addLog("Populated examples structure into modal console.");
                }}
                className="px-3 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Autoload Example Structure
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowJsonModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleIngestCustomJackpot}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Trigger Database Import
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL WINDOW FOR JSON/CSV EXPORTS & READY-TO-PASTE SLIPS */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-250 p-6 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-zoom-in text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                {exportModalFormat === "json" ? (
                  <FileJson className="w-5 h-5 text-indigo-500" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                )}
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                  Jackpot Slip Export & Copier
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {/* Export Mode Toggle */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Export Data Format</span>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setExportModalFormat("json")}
                    className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      exportModalFormat === "json"
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    JSON File Engine
                  </button>
                  <button
                    onClick={() => setExportModalFormat("csv")}
                    className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      exportModalFormat === "csv"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    CSV Spreadsheet
                  </button>
                  <button
                    onClick={() => setExportModalFormat("telegram")}
                    className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      exportModalFormat === "telegram"
                        ? "bg-[#229ED9] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Send className="w-3 h-3 fill-current text-white" />
                    <span>Telegram (tg://)</span>
                  </button>
                </div>
              </div>

              {/* Dedicated Telegram Instant Launch Panel */}
              {exportModalFormat === "telegram" && (
                <div className="bg-[#229ED9]/10 p-4 rounded-xl border border-[#229ED9]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-[#1d8bbd] uppercase tracking-wide flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 fill-current text-[#229ED9]" />
                      Telegram App Launcher (tg:// protocol)
                    </h4>
                    <span className="text-[9px] bg-[#229ED9] text-white font-black px-2 py-0.5 rounded-full uppercase">
                      Instant Pre-fill
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    This formats your selected coupon with emojis, match legs, selected outcome odds, total price, and SMS code, then opens your installed Telegram app directly via a <code className="font-mono bg-white px-1 rounded text-[#1d8bbd] font-bold">tg://</code> link.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={openTelegramWithCoupon}
                      className="px-4 py-2 bg-[#229ED9] hover:bg-[#1c8ec4] text-white font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5 fill-current" />
                      Open Telegram App Now (tg://)
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formatTelegramCouponMessage(), "Telegram Message")}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      Copy Telegram Text
                    </button>
                  </div>
                </div>
              )}

              {/* Ready-To-Paste Selections Box for Sportsbooks (Requested Feature!) */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    External Sportsbook Paste-Ready Selections
                  </h4>
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                    SportPesa Compatible
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Copy your active {Object.keys(selections).length} match picks in formats commonly optimized for pasting, bulk loading, or sharing to external tipping telegrams.
                </p>

                <div className="space-y-2.5 pt-1">
                  {/* Format 1: Comma delimited outcome list */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Comma Outcomes Selections (1,X,2)</span>
                      <code className="text-xs font-mono font-bold text-slate-800 block truncate mt-0.5">
                        {getSelectionsStringForFormat("comma")}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(getSelectionsStringForFormat("comma"), "COMMA")}
                      className={`px-3 py-1.5 rounded-md text-2xs font-extrabold flex items-center gap-1 shrink-0 cursor-pointer border transition-all ${
                        copiedTextFeedback === "COMMA"
                          ? "bg-emerald-500 border-emerald-600 text-white"
                          : "bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700"
                      }`}
                    >
                      {copiedTextFeedback === "COMMA" ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPY SLIP String</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Format 2: Position matched predictions */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Sportsbook Quick-Sync Code (Match=Value)</span>
                      <code className="text-xs font-mono font-bold text-slate-800 block truncate mt-0.5">
                        {getSelectionsStringForFormat("match-equal")}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(getSelectionsStringForFormat("match-equal"), "CODELIST")}
                      className={`px-3 py-1.5 rounded-md text-2xs font-extrabold flex items-center gap-1 shrink-0 cursor-pointer border transition-all ${
                        copiedTextFeedback === "CODELIST"
                          ? "bg-emerald-500 border-emerald-600 text-white"
                          : "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      {copiedTextFeedback === "CODELIST" ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy M=V Codes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Raw File Schema Preview */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    {exportModalFormat === "telegram" ? "Formatted Telegram Message Preview" : "Raw File Payload Code Preview"}
                  </span>
                  <button
                    onClick={() => copyToClipboard(getExportData(exportModalFormat).dataStr, "RAW")}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedTextFeedback === "RAW" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied Text!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Output Payload</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  readOnly
                  className="w-full p-3.5 bg-slate-900 text-slate-300 font-mono text-2xs rounded-lg border border-slate-950 focus:outline-none min-h-[160px] max-h-[220px]"
                  value={getExportData(exportModalFormat).dataStr}
                ></textarea>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex justify-between items-center border-t border-slate-150 pt-4 mt-4 shrink-0">
              <span className="text-[11px] text-slate-400 font-mono">
                MJP_20260530 Coupon File Engine
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-lg cursor-pointer transition-all"
                >
                  Close
                </button>
                {exportModalFormat === "telegram" ? (
                  <button
                    type="button"
                    onClick={openTelegramWithCoupon}
                    className="px-4 py-2 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer bg-[#229ED9] hover:bg-[#1c8ec4] flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 fill-current" />
                    Launch Telegram (tg://)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerDownload(exportModalFormat)}
                    className={`px-4 py-2 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer ${
                      exportModalFormat === "json"
                        ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                    }`}
                  >
                    Download .{exportModalFormat} file
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL WINDOW FOR LOAD/IMPORT INCOMING TICKET CONFIGURATIONS */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-250 p-6 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-zoom-in text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-600 animate-pulse" />
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                  Import Selections & Bets Slip
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText("");
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-slate-700 text-xs text-left">
              <p className="leading-relaxed">
                Paste your previously saved/exported <strong>JSON configuration</strong> content or a raw <strong>SportPesa SMS Betting String</strong> (e.g. <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-bold font-mono">MJP#1,X,2,1,...</span>) to instantly synchronize your selections spreadsheet.
              </p>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Pasted Configuration Data
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Paste JSON or SportPesa SMS Code here...\n\nExample JSON:\n{ "selections": { "1": ["1", "X"], "2": ["2"] } }\n\nExample SMS string:\nMJP#1,X,2,1,1,X,2,1,X,2,1,2,X,1,2,X,1`}
                  className="w-full h-44 text-[10.5px] font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                <h4 className="text-[10px] font-extrabold text-indigo-950 uppercase tracking-wider mb-1 flex items-center gap-1">
                  💡 Dynamic Format Detection
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[10px] text-indigo-900">
                  <li>Detects custom JSON structured metadata configuration.</li>
                  <li>Infers coupon size filters (13 to 17 games) automatically based on SMS prefixes.</li>
                  <li>Populates compound selections (double-chances) like <span className="font-semibold">1X</span>, <span className="font-semibold">12</span> or <span className="font-semibold">X2</span> dynamically.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-150 pt-4 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setImportText(`MJP#1,X,2,1,1,X,2,1,X,2,1,2,X,1,2,X,1`);
                }}
                className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Load Example SMS String
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportText("");
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-lg cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleImportSlip(importText)}
                  className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 font-bold text-xs rounded-lg shadow-sm shadow-indigo-150 transition-all cursor-pointer"
                >
                  Verify & Import Selections
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORICAL ACCURACY BENCHMARK & PAYOUTS MODAL */}
      {showHistoricalModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-zoom-in text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-500 fill-amber-100 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                    Model Accuracy & Historical Payout comparison
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Comparing 'AI Balanced' predictions vs historical actual payout distributions</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoricalModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {loadingHistorical ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3 animate-pulse"></div>
                  <p className="text-[11px] text-slate-500 font-medium">Fetching payout distributions and performance models...</p>
                </div>
              ) : historicalPayouts.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center">
                  <Trophy className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-slate-500 text-xs font-semibold">No historical payout data retrieved yet.</p>
                  <button
                    onClick={fetchHistoricalPayouts}
                    className="mt-3 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-2xs rounded-lg transition-all cursor-pointer shadow-indigo-100 shadow-sm"
                  >
                    Fetch Historical Records
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Model Performance Overview banner */}
                  <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 rounded-xl p-4 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                        AI Performance Note
                      </span>
                      <h4 className="font-bold text-slate-800 text-xs mt-1.5">
                        Continuous Predictive Enhancement Machine
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5 max-w-xl">
                        Our AI Balanced model tracks previous weeks' actuals to adapt home bias, draw frequency thresholds, and away valuation matrices. On average, the model achieves <strong>84.7% accuracy</strong>, regularly mapping into lucrative sub-jackpot prize zones.
                      </p>
                    </div>
                    <div className="flex gap-4 shrink-0 text-center">
                      <div className="bg-white py-2 px-3 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-400 font-mono block">MEDIAN SCORE</span>
                        <span className="text-sm font-black text-indigo-600 font-mono">14.4 / 17</span>
                      </div>
                      <div className="bg-white py-2 px-3 rounded-lg border border-emerald-100 font-mono">
                        <span className="text-[10px] text-slate-400 font-mono block">BEST HISTORIC</span>
                        <span className="text-sm font-black text-emerald-600">16 / 17</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Comparison Grid */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-3xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-extrabold font-mono uppercase">
                          <th className="py-3 px-3">Week / Date</th>
                          <th className="py-3 px-3">Actual distribution</th>
                          <th className="py-3 px-3">Payout Status</th>
                          <th className="py-3 px-3">Bonus Scale (16 to 12 correct)</th>
                          <th className="py-3 px-3 bg-indigo-50/50 text-indigo-950 font-bold">AI Balanced predicted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {historicalPayouts.map((hp) => (
                          <tr key={hp.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-800 block">{hp.id}</span>
                              <span className="text-[10px] font-medium text-slate-400 font-mono block mt-0.5">{hp.date}</span>
                            </td>
                            <td className="py-3 px-3 font-mono">
                              <div className="flex gap-1">
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] px-1.5 py-0.5 rounded font-bold" title="Home Wins">
                                  {hp.winningDistribution["1"]}H
                                </span>
                                <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] px-1.5 py-0.5 rounded font-bold" title="Draws">
                                  {hp.winningDistribution["X"]}D
                                </span>
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] px-1.5 py-0.5 rounded font-bold" title="Away Wins">
                                  {hp.winningDistribution["2"]}A
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-medium">
                              <span className="font-semibold text-slate-700 block">{hp.grandPrizeAmount}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold inline-block mt-1 ${
                                hp.payoutStatus.includes("Winner") 
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}>
                                {hp.payoutStatus}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10px] text-slate-500">
                                <div><span className="font-semibold text-slate-400">16:</span> {hp.bonusPayouts["16"]}</div>
                                <div><span className="font-semibold text-slate-400">15:</span> {hp.bonusPayouts["15"]}</div>
                                <div><span className="font-semibold text-slate-400">14:</span> {hp.bonusPayouts["14"]}</div>
                                <div><span className="font-semibold text-slate-400">13:</span> {hp.bonusPayouts["13"]}</div>
                                <div className="col-span-2 border-t border-slate-100 pt-0.5 mt-0.5">
                                  <span className="font-semibold text-slate-400">12:</span> {hp.bonusPayouts["12"]}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 bg-indigo-50/20 text-left border-l border-indigo-100">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-slate-800 text-xs font-mono">{hp.aiBalancedPerformance.correctSelections} / 17</span>
                                  <span className="text-[10px] font-black text-indigo-700 font-mono bg-indigo-100/60 px-1 rounded">
                                    {hp.aiBalancedPerformance.accuracyPercentage} Acc
                                  </span>
                                </div>
                                <span className="text-[10px] text-emerald-700 block font-bold leading-none">
                                  Winnings: {hp.aiBalancedPerformance.estimatedWinnings}
                                </span>
                                <span className="text-[9px] text-slate-400 block font-mono">
                                  Matched {hp.aiBalancedPerformance.correctSelections >= 12 ? "Sub-Jackpot Level" : "No Bonus"}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10px] text-slate-400 text-left leading-normal italic">
                    * AI Balanced model estimation computes double chance covers applied dynamically across the three highest-volatility match fixtures. Actual results may vary week on week depending on real-time lineup changes and final bookmaker settlement figures.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-slate-150 pt-4 mt-4 shrink-0">
              <span className="text-[11px] text-slate-400 font-mono font-medium">
                Historical Database Engine Live Connected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={fetchHistoricalPayouts}
                  className="px-3 py-1.5 text-indigo-600 hover:bg-slate-100/60 text-xs font-bold rounded-lg cursor-pointer transition-all"
                >
                  Force Sync Data
                </button>
                <button
                  type="button"
                  onClick={() => setShowHistoricalModal(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer transition-all"
                >
                  Close Comparison Hub
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLOUD SECURE CABINET / SAVED SLIPS LIST MODAL */}
      {showCloudModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-3xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-zoom-in text-left">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <Cloud className="w-5 h-5 text-indigo-600 animate-bounce" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                    SportScraper Cloud Cabinet
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium font-sans">
                    Store and compare your SportPesa Mega Jackpot selections week over week
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCloudModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-black p-1 cursor-pointer transition-colors"
                title="Close Drawer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {loadingCloudCoupons ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-[11px] text-slate-500 font-medium">Synchronizing cloud records...</p>
                </div>
              ) : cloudCoupons.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <Database className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-slate-500 text-xs font-bold font-sans">No coupon slips saved on your live cloud profile.</p>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-sm mt-1 text-center">
                    To start monitoring and comparing model outputs, design an accumulator slip in the main board and hit "Save Slip" to save it securely.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-250 rounded-lg">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 select-none text-[10px] font-black uppercase tracking-wider">
                        <th className="py-2.5 px-4 font-extrabold">Slip Name</th>
                        <th className="py-2.5 px-3 font-extrabold">Jackpot Mode</th>
                        <th className="py-2.5 px-3 font-extrabold">Strategy</th>
                        <th className="py-2.5 px-3 font-extrabold">Cost (KES)</th>
                        <th className="py-2.5 px-3 font-extrabold">Created At</th>
                        <th className="py-2.5 px-4 text-center font-extrabold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {cloudCoupons.map((coupon) => (
                        <tr key={coupon.id} className="hover:bg-indigo-50/20 transition-all font-sans text-slate-700 text-[11.5px]">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {coupon.name}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-500">
                            MJP {coupon.subJackpotSize}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200/60 rounded font-bold uppercase tracking-tight text-[9px]">
                              {coupon.strategy || "Custom Picks"}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">
                            Ksh {coupon.cost ? coupon.cost.toLocaleString() : "99"}
                          </td>
                          <td className="py-3 px-3 text-[10px] text-slate-400 font-mono">
                            {new Date(coupon.createdAt).toLocaleDateString()} {new Date(coupon.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleLoadCouponCloud(coupon)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-[10px] transition-all cursor-pointer select-none"
                                title="Load these selections into the workspace"
                              >
                                Load Slip
                              </button>
                              <button
                                onClick={() => handleDeleteCouponCloud(coupon.id)}
                                className="p-1 hover:text-rose-600 text-slate-400 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded transition cursor-pointer"
                                title="Delete slip from historical store"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-slate-150 pt-4 mt-4 shrink-0">
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 select-none">
                <Database className="w-3 h-3 text-emerald-500" /> Firebase Firestore connection secured
              </span>
              <button
                type="button"
                onClick={() => setShowCloudModal(false)}
                className="px-4 py-1.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs rounded-lg cursor-pointer transition-all"
              >
                Close Cabinet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERSISTENT FLOATING SUMMARY BUTTON (BOTTOM RIGHT) */}
      <button
        type="button"
        onClick={() => setShowSummaryDrawer((prev) => !prev)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl transition-all duration-200 cursor-pointer select-none group border ${
          showSummaryDrawer
            ? "bg-indigo-600 text-white border-indigo-500 ring-4 ring-indigo-500/20 scale-105"
            : getActiveSelectionsCount() === subJackpotSize
            ? "bg-slate-900 text-white border-slate-700/80 hover:bg-slate-800 hover:scale-[1.03] active:scale-95"
            : "bg-slate-900/95 backdrop-blur-md text-white border-slate-700/80 hover:bg-slate-800 hover:scale-[1.03] active:scale-95"
        }`}
        title="Click to view & edit consolidated outcomes for all 17 jackpot legs"
      >
        <div className="relative">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black transition-colors ${
            getActiveSelectionsCount() === subJackpotSize
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
          }`}>
            <Layers className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform duration-200" />
          </div>
          <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
            getActiveSelectionsCount() === subJackpotSize ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
          }`} />
        </div>

        <div className="flex flex-col text-left pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider font-mono text-slate-200">
              17 Legs Summary
            </span>
            <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded font-mono ${
              getActiveSelectionsCount() === subJackpotSize
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}>
              {getActiveSelectionsCount()}/{subJackpotSize}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {totalCombinations > 1 ? `${totalCombinations} Lines • KES ${estimatedCost.toLocaleString()}` : "1 Line • KES 99"}
          </span>
        </div>

        <div className="pl-1 border-l border-slate-700/60 text-slate-400 group-hover:text-white transition-colors">
          <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${showSummaryDrawer ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* CONSOLIDATED OUTCOMES SUMMARY DRAWER */}
      <AnimatePresence>
        {showSummaryDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Drawer Overlay / Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSummaryDrawer(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            />

            {/* Slide-over Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col h-full z-10 text-left font-sans"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-md shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight flex items-center gap-2">
                        17-Leg Outcomes Summary
                        <span className="text-[10px] font-mono uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold px-2 py-0.5 rounded-full">
                          MJP {subJackpotSize}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Consolidated view of active selections with 1-click leg & outcome removal
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSummaryDrawer(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Close Summary Drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Key Metrics / Quick Stats Banner inside Header */}
                <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-center border-r border-slate-100 dark:border-slate-800/80 pr-1">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">
                      Filled Legs
                    </span>
                    <span className={`text-sm font-mono font-black ${
                      getActiveSelectionsCount() === subJackpotSize ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {getActiveSelectionsCount()} / {subJackpotSize}
                    </span>
                  </div>

                  <div className="text-center border-r border-slate-100 dark:border-slate-800/80 px-1">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">
                      Total Permutations
                    </span>
                    <span className="text-sm font-mono font-black text-slate-800 dark:text-slate-100">
                      {totalCombinations.toLocaleString()} {totalCombinations === 1 ? "Line" : "Lines"}
                    </span>
                  </div>

                  <div className="text-center pl-1">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">
                      Est. Slip Stake
                    </span>
                    <span className="text-sm font-mono font-black text-indigo-600 dark:text-indigo-400">
                      KES {estimatedCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Quick Action Toolbar */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-150 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleAIQuickFillRemaining}
                    className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Use AI prediction models to fill empty leg picks"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Auto-Fill Vacants
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(getSportPesaSMSCode(), "SMS Code")}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10.5px] font-bold font-mono flex items-center gap-1 transition-all cursor-pointer"
                      title="Copy SMS bet code"
                    >
                      <Copy className="w-3 h-3 text-slate-500" />
                      Copy Code
                    </button>

                    <button
                      type="button"
                      onClick={handleClearAllSelections}
                      disabled={Object.keys(selections).length === 0}
                      className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Clear all 17 match selections"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" />
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Body - Scrollable Leg List (1 through 17) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/80 scrollbar-thin">
                {(() => {
                  const sortedMatches = [...matches]
                    .filter((m) => {
                      const num = parseInt(m.match_no);
                      return num >= 1 && num <= 17;
                    })
                    .sort((a, b) => parseInt(a.match_no) - parseInt(b.match_no));

                  if (sortedMatches.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400">
                        <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No jackpot matches currently loaded in memory.
                      </div>
                    );
                  }

                  return sortedMatches.map((m) => {
                    const picks = selections[m.match_no] || [];
                    const isActive = isMatchActive(m.match_no);
                    const isLocked = !!lockedMatches[m.match_no];
                    const isDouble = picks.length === 2;
                    const isTriple = picks.length === 3;

                    return (
                      <div
                        key={m.match_no}
                        className={`pt-2.5 first:pt-0 transition-all rounded-xl p-2.5 border ${
                          !isActive
                            ? "bg-slate-50/50 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800 opacity-60"
                            : picks.length > 0
                            ? "bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-indigo-900"
                            : "bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {/* Left: Leg Index + Teams */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                              <span className={`inline-flex w-7 h-7 rounded-lg items-center justify-center font-mono text-xs font-black border ${
                                picks.length > 0
                                  ? "bg-indigo-600 text-white border-indigo-700 shadow-2xs"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                              }`}>
                                #{m.match_no}
                              </span>
                              {isLocked && (
                                <span className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full border border-white dark:border-slate-900">
                                  <Lock className="w-2 h-2" />
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                  {m.home} vs {m.away}
                                </span>
                                {isDouble && (
                                  <span className="shrink-0 px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[8.5px] font-black rounded uppercase font-mono border border-amber-200 dark:border-amber-800">
                                    Double
                                  </span>
                                )}
                                {isTriple && (
                                  <span className="shrink-0 px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[8.5px] font-black rounded uppercase font-mono border border-indigo-200 dark:border-indigo-800">
                                    Triple
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span>{m.league || "League"}</span>
                                <span>•</span>
                                <span>Odds: {m.odds["1"].toFixed(2)} | {m.odds["X"].toFixed(2)} | {m.odds["2"].toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Selected Outcome Badges & One-Click Leg Removal */}
                          <div className="flex items-center gap-2 shrink-0">
                            {isActive ? (
                              picks.length > 0 ? (
                                <div className="flex items-center gap-1">
                                  {/* Outcome Chips - Clicking chip removes that specific pick */}
                                  <div className="flex gap-1">
                                    {["1", "X", "2"].map((val) => {
                                      const isPicked = picks.includes(val);
                                      if (!isPicked) return null;

                                      return (
                                        <button
                                          key={val}
                                          type="button"
                                          onClick={() => handleSelectOutcome(m.match_no, val)}
                                          className={`px-2 py-1 rounded-md text-xs font-black font-mono transition-all flex items-center gap-1 cursor-pointer group border shadow-3xs ${
                                            val === "1"
                                              ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600"
                                              : val === "X"
                                              ? "bg-slate-600 hover:bg-slate-700 text-white border-slate-700"
                                              : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700"
                                          }`}
                                          title={`Click to remove pick '${val}' from Leg #${m.match_no}`}
                                        >
                                          <span>{val}</span>
                                          <X className="w-3 h-3 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* One-click Leg Clear Trash Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleClearLeg(m.match_no)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer ml-1"
                                    title={`One-click remove all picks for Leg #${m.match_no}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
                                  </button>
                                </div>
                              ) : (
                                /* No picks selected - Quick outcome picker buttons right in the drawer */
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60 font-mono mr-1">
                                    No Pick
                                  </span>
                                  <div className="flex gap-0.5">
                                    {["1", "X", "2"].map((val) => (
                                      <button
                                        key={val}
                                        type="button"
                                        onClick={() => handleSelectOutcome(m.match_no, val)}
                                        className="w-6 h-6 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs rounded transition-all cursor-pointer flex items-center justify-center border border-slate-200 dark:border-slate-700"
                                        title={`Select '${val}' for Leg #${m.match_no}`}
                                      >
                                        {val}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )
                            ) : (
                              <span className="text-[10px] text-slate-400 italic font-mono">
                                Skipped in MJP{subJackpotSize}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-mono font-extrabold text-slate-400">
                      SMS Betting Payload
                    </span>
                    <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-white truncate max-w-xs">
                      {getSportPesaSMSCode()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSummaryDrawer(false);
                        openTelegramWithCoupon();
                      }}
                      className="px-3 py-1.5 bg-[#229ED9] hover:bg-[#1c8ec4] text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      title="Format coupon and open pre-filled message in Telegram app via tg:// link"
                    >
                      <Send className="w-3.5 h-3.5 fill-current" />
                      <span>Telegram</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSummaryDrawer(false);
                        handleExportData("json");
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Export & Share
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Non-intrusive 'Unsaved Strategy Edits' Footer Banner */}
      <AnimatePresence>
        {hasUnsavedStrategyEdits && !dismissedUnsavedNotification && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xl z-50 pointer-events-auto"
          >
            <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border border-amber-500/50 text-white p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3.5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono uppercase tracking-wide text-amber-400">
                      Unsaved Changes
                    </span>
                    {lastGeneratedStrategy && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold">
                        {lastGeneratedStrategy} Strategy
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-snug">
                    You modified your picks after applying the strategy. Save your custom slip configuration to the cloud or re-sync.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser) {
                      handleSaveCouponCloud(`${lastGeneratedStrategy.toUpperCase() || "Modified"} Slip`);
                    } else {
                      setShowCloudModal(true);
                    }
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Save current modified slip configuration to cloud storage"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Save to Cloud</span>
                </button>

                {lastGeneratedStrategy && (
                  <button
                    type="button"
                    onClick={() => handleGenerateSlip(lastGeneratedStrategy as any)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    title={`Re-apply original ${lastGeneratedStrategy} strategy`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-sync</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDismissedUnsavedNotification(true)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer shrink-0"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScreenshotUploadModal
        isOpen={showScreenshotModal}
        onClose={() => setShowScreenshotModal(false)}
        onMatchesScraped={handleMatchesScraped}
      />

      <PasteTextModal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onMatchesParsed={handleMatchesParsed}
      />

      <OddsTrackerModal
        isOpen={showOddsTrackerModal}
        onClose={() => setShowOddsTrackerModal(false)}
        matches={matches}
        initialMatchNo={oddsTrackerMatchNo}
      />
    </div>
  );
}
