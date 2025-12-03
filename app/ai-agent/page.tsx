"use client";

import { useEffect, useRef, useState } from "react";
import { useGeminiChat } from "@/hooks/use-gemini";
import Link from "next/link";
import { Send, Sparkles, ArrowLeft, Loader2, Trash2 } from "lucide-react";

export default function Chat() {
  const { messages, sendMessage, clearChat, loading } = useGeminiChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setInput("");
    await sendMessage(input);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Format message text with proper line breaks and bullet points
  const formatMessage = (text: string) => {
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 md:p-6">
      <div className="flex flex-col w-full max-w-4xl h-[85vh] bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white py-5 px-6">
          <div className="flex items-center justify-between mb-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <button
              onClick={clearChat}
              className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm transition-all hover:bg-red-500/80 hover:scale-105"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg ring-2 ring-white/30">
                🐄
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wide flex items-center gap-2">
                  Cassie
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                </h1>
                <p className="text-emerald-100 text-sm">
                  Your Farm AI Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  loading ? "bg-yellow-400 animate-pulse" : "bg-green-300"
                }`}
              />
              <span className="text-sm font-medium text-emerald-100">
                {loading ? "Thinking..." : "Online"}
              </span>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-emerald-50/50 to-white">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-4xl shadow-lg">
                🌾
              </div>
              <h2 className="text-xl font-semibold text-gray-700">
                Welcome to Cassie!
              </h2>
              <p className="text-gray-500 max-w-md">
                I can help you with farm data - ask me about animals, breeding
                records, calvings, health records, diesel usage, or feed
                inventory.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {[
                  "Show pregnant animals",
                  "List recent calvings",
                  "Diesel usage this month",
                  "Health records summary",
                  "Feed inventory",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-sm rounded-full transition-all hover:scale-105"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-5 py-3.5 rounded-2xl text-base max-w-[80%] transition-all duration-200 ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-md shadow-lg shadow-emerald-200"
                    : "bg-white border border-emerald-100 text-gray-700 rounded-bl-md shadow-md"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-emerald-50">
                    <span className="text-lg">🐄</span>
                    <span className="text-sm font-medium text-emerald-600">
                      Cassie
                    </span>
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {formatMessage(m.text)}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="px-5 py-4 rounded-2xl bg-white border border-emerald-100 shadow-md rounded-bl-md">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                  <span className="text-gray-500 text-sm">
                    Cassie is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="border-t border-emerald-100 bg-white p-4 flex items-center gap-3"
        >
          <input
            className="flex-1 p-4 border border-emerald-200 rounded-xl bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-gray-400 text-base transition-all"
            placeholder="Ask Cassie about your farm..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
