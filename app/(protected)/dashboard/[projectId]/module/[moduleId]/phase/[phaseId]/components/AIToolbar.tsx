"use client";

import { useState } from "react";
import {
  Sparkles,
  Wand2,
  Maximize2,
  Minimize2,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  generateWritingSuggestion,
  fixGrammarAndStyle,
  expandText,
  shortenText,
} from "@/lib/ai/geminiClient";

type AIToolbarProps = {
  selectedText: string;
  fullContent: string;
  onInsert: (text: string) => void;
  onReplace: (text: string) => void;
};

export default function AIToolbar({
  selectedText,
  fullContent,
  onInsert,
  onReplace,
}: AIToolbarProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAIAction = async (
    action: "suggest" | "fix" | "expand" | "shorten"
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let aiResult = "";

      switch (action) {
        case "suggest":
          // Get last 2000 characters as context
          const context = fullContent.slice(-2000);
          aiResult = await generateWritingSuggestion(context, selectedText);
          break;

        case "fix":
          if (!selectedText) {
            alert("Please select some text first");
            setLoading(false);
            return;
          }
          aiResult = await fixGrammarAndStyle(selectedText);
          break;

        case "expand":
          if (!selectedText) {
            alert("Please select some text first");
            setLoading(false);
            return;
          }
          aiResult = await expandText(selectedText);
          break;

        case "shorten":
          if (!selectedText) {
            alert("Please select some text first");
            setLoading(false);
            return;
          }
          aiResult = await shortenText(selectedText);
          break;
      }

      setResult(aiResult);
      setShowResult(true);
    } catch (err: any) {
      console.error("AI Error:", err);
      setError(err.message || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (result) {
      if (selectedText) {
        onReplace(result); // Replace selected text
      } else {
        onInsert(result); // Insert at cursor
      }
      setShowResult(false);
      setResult(null);
    }
  };

  const handleReject = () => {
    setShowResult(false);
    setResult(null);
  };

  return (
    <>
      {/* AI Toolbar */}
      <div className="flex items-center gap-2 px-2 border-r border-white/10">
        <button
          onClick={() => handleAIAction("suggest")}
          disabled={loading}
          className="p-2 rounded hover:bg-purple-500/20 transition-colors text-purple-400 disabled:opacity-50"
          title="Continue Writing (AI)"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => handleAIAction("fix")}
          disabled={loading || !selectedText}
          className="p-2 rounded hover:bg-blue-500/20 transition-colors text-blue-400 disabled:opacity-50"
          title="Fix Grammar & Style"
        >
          <Wand2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleAIAction("expand")}
          disabled={loading || !selectedText}
          className="p-2 rounded hover:bg-green-500/20 transition-colors text-green-400 disabled:opacity-50"
          title="Expand Text"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleAIAction("shorten")}
          disabled={loading || !selectedText}
          className="p-2 rounded hover:bg-orange-500/20 transition-colors text-orange-400 disabled:opacity-50"
          title="Shorten Text"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* AI Result Modal */}
      {showResult && result && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 top-40">
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Suggestion
              </h3>
              <button
                onClick={handleReject}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 ">
              <p className="text-gray-300 whitespace-pre-wrap">{result}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Accept & Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4 max-w-md">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </>
  );
}