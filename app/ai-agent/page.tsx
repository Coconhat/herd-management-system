"use client";

import { useEffect, useRef, useState } from "react";
import { useGeminiChat } from "@/hooks/use-gemini";
import Link from "next/link";

export default function Chat() {
  const { messages, sendMessage, loading } = useGeminiChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input);
    setInput("");
  };

  // ✅ Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-green-100/70 p-6">
      <div className="flex flex-col w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-xl border border-green-200 overflow-hidden">
        {/* Header */}

        <header className="bg-green-400 text-white py-4 px-6 flex flex-col gap-3 shadow-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1 self-start rounded-full bg-white/20 px-3 py-1 text-sm font-medium transition-colors hover:bg-white/30"
          >
            ← Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-300/40 flex items-center justify-center text-xl">
                🌱
              </div>
              <h1 className="text-xl font-semibold tracking-wide">
                Cassie - Farm Assistant
              </h1>
            </div>
            <span
              className={`text-sm font-medium ${
                loading ? "opacity-70 italic" : "opacity-90"
              }`}
            >
              {loading ? "Thinking..." : "Online"}
            </span>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-green-50">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-5 py-3 rounded-2xl text-base shadow-sm max-w-[70%] transition-all duration-200 ${
                  m.role === "user"
                    ? "bg-green-400 text-white rounded-br-none"
                    : "bg-white border border-green-100 text-gray-800 rounded-bl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {/* 👇 Auto-scroll anchor */}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="border-t border-green-100 bg-white p-4 flex items-center gap-3"
        >
          <input
            className="flex-1 p-3 border border-green-200 rounded-xl bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 placeholder-gray-500 text-base"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            disabled={loading}
            className="px-5 py-2.5 bg-green-400 hover:bg-green-500 text-white font-medium text-base rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
