import React, { useState, useRef } from "react";
import { X, UploadCloud, Image as ImageIcon, Sparkles, CheckCircle, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { Match } from "../types";

interface ScreenshotUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchesScraped: (matches: Match[], message: string) => void;
}

export default function ScreenshotUploadModal({
  isOpen,
  onClose,
  onMatchesScraped,
}: ScreenshotUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrorMsg("Please select a valid image file (PNG, JPG, WebP).");
        return;
      }
      setErrorMsg(null);
      setSuccessMsg(null);
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      setErrorMsg("Please drop a valid image file.");
    }
  };

  const handleScrapeScreenshot = async () => {
    if (!imagePreview) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/matches/ocr-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: selectedFile?.type || "image/png",
        }),
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.matches)) {
        setSuccessMsg(data.message || `Successfully scraped ${data.extractedCount || 17} matches from screenshot! Autosaved as active Jackpot.`);
        onMatchesScraped(data.matches, data.message || "Jackpot updated from screenshot OCR and autosaved");
      } else {
        setErrorMsg(data.error || "Failed to parse matches from image. Please try another screenshot.");
      }
    } catch (err: any) {
      setErrorMsg("Server request failed. Please check network connection and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>Jackpot Screenshot OCR Scraper</span>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                  Gemini Vision AI
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Upload a SportPesa Mega Jackpot screenshot to automatically extract games, odds & fixtures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!imagePreview ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-8 text-center bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition cursor-pointer flex flex-col items-center justify-center gap-3"
            >
              <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                <ImageIcon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Drag & drop Jackpot screenshot here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports PNG, JPG, JPEG, WebP screenshots from SportPesa mobile app or browser
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 max-h-60 flex items-center justify-center p-2">
                <img
                  src={imagePreview}
                  alt="Jackpot Screenshot Preview"
                  className="max-h-56 object-contain rounded-lg"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreview(null);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="absolute top-3 right-3 bg-slate-900/80 hover:bg-rose-600 text-white p-1.5 rounded-lg text-xs font-bold transition cursor-pointer backdrop-blur-sm border border-slate-700"
                >
                  Remove Image
                </button>
              </div>

              {selectedFile && (
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
                  <span>File: {selectedFile.name}</span>
                  <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{successMsg}</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] uppercase font-mono px-2 py-0.5 rounded font-extrabold">
                17/17 READY
              </span>
            </div>
          )}

          <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-xs leading-relaxed space-y-1">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>How Gemini OCR Extraction Works</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Gemini Vision analyzes your uploaded coupon image, recognizes team names, kickoff dates, match numbers (1-17), and 1X2 market odds, then populates the app’s prediction engine automatically.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {successMsg ? (
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Proceed to Analysis & Predictions</span>
              </button>
            ) : (
              <button
                onClick={handleScrapeScreenshot}
                disabled={!imagePreview || isProcessing}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Games with OCR...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Scrape Screenshot Games</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
