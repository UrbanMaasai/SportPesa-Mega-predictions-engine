import React, { useState } from "react";
import { FileText, Sparkles, X, Check, Loader2 } from "lucide-react";
import { Match } from "../types";

interface PasteTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchesParsed: (matches: Match[], msg: string) => void;
}

export default function PasteTextModal({ isOpen, onClose, onMatchesParsed }: PasteTextModalProps) {
  const [rawText, setRawText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!rawText.trim()) {
      setErrorMsg("Please paste text from the SportPesa Mega Jackpot page first.");
      return;
    }

    setIsParsing(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/matches/parse-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to parse text.");
      }

      onMatchesParsed(data.matches, data.message || "Successfully parsed jackpot fixtures!");
      setRawText("");
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Parsing failed. Please check the pasted content.");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 text-slate-100 shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Paste SportPesa Coupon Text
            </h3>
            <p className="text-xs text-slate-400">
              Copy fixtures text directly from <a href="https://www.ke.sportpesa.com/en/mega-jackpot-pro" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">ke.sportpesa.com</a> and paste here to load fixtures via Gemini AI.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Pasted Fixtures Content
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste text copied from SportPesa portal here (e.g. '1. Arsenal vs Chelsea 2.10 3.20 2.90...')..."
            rows={7}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 transition-all resize-none"
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleParse}
            disabled={isParsing || !rawText.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md disabled:opacity-50 transition-all cursor-pointer"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Parsing via AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Extract 17 Fixtures</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
