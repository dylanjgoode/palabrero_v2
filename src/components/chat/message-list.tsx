"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/ai/types";

const starterPrompts = [
  "Quiero practicar cómo pedir comida en un restaurante.",
  "Necesito ayuda para preparar una entrevista de trabajo.",
  "¿Podemos hablar sobre mis planes de viaje a España?",
];

function formatRole(role: ChatMessage["role"]) {
  return role === "user" ? "You" : "Tutor";
}

type MessageListProps = {
  messages: ChatMessage[];
  onSendStarter: (prompt: string) => void;
};

export default function MessageList({ messages, onSendStarter }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const [expandedCorrections, setExpandedCorrections] = useState<Set<string>>(new Set());

  const toggleCorrections = (id: string) => {
    setExpandedCorrections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  }, []);

  useEffect(() => {
    if (!scrollRef.current || !isNearBottomRef.current) {
      return;
    }
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 space-y-4 overflow-y-auto px-6 py-5"
    >
      {messages.length === 0 ? (
        <div className="space-y-6 h-full flex flex-col justify-center max-w-lg mx-auto">
          <div className="text-center space-y-2 mb-4 animate-rise">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))] mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-[family-name:var(--font-fraunces)] text-2xl font-bold text-[rgb(var(--ink))]">
              Start a Conversation
            </p>
            <p className="text-[rgb(var(--muted))] text-sm">
              Pick a starter line or type your own to begin.
            </p>
          </div>
          <div className="grid gap-3 stagger">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onSendStarter(prompt)}
                className="surface-card p-4 text-center text-[15px] font-medium text-[rgb(var(--ink-body))] transition hover:-translate-y-1 hover:border-[rgb(var(--accent))]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col group animate-fade ${
              message.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {message.role === "assistant" && (
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[rgb(var(--muted))] mb-1 ml-1 opacity-0 group-hover:opacity-100 transition">
                Tutor
              </p>
            )}
            <div
              className={`max-w-[85%] px-5 py-3.5 text-[15px] leading-relaxed relative ${
                message.role === "user"
                  ? "bg-[rgb(var(--accent))] text-white rounded-2xl rounded-tr-sm shadow-md shadow-red-900/10"
                  : "surface-card border border-white/50 rounded-2xl rounded-tl-sm text-[rgb(var(--ink))]"
              }`}
            >
              <p>{message.content}</p>
            </div>
            
            {/* Notes Toggle */}
            {(message.corrections?.length ?? 0) > 0 && message.role === "user" && (
              <button
                type="button"
                onClick={() => toggleCorrections(message.id)}
                className="mt-1 mr-1 flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-widest text-[rgb(var(--accent))] hover:text-[rgb(var(--accent-hover))] transition"
              >
                <svg className={`w-3 h-3 transition-transform ${expandedCorrections.has(message.id) ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
                {message.corrections!.length} correction{message.corrections!.length === 1 ? "" : "s"}
              </button>
            )}

            {/* Expanded Notes Section (replaces the redundant green block) */}
            {expandedCorrections.has(message.id) && (
              <div className={`mt-2 max-w-[85%] surface-muted border border-[rgb(var(--accent))]/10 p-4 animate-fade ${message.role === "user" ? "self-end rounded-2xl rounded-tr-sm" : "self-start rounded-2xl rounded-tl-sm"}`}>
                {message.correctedContent && (
                  <div className="mb-4 pb-4 border-b border-black/5">
                    <p className="text-[0.6rem] uppercase tracking-widest text-[rgb(var(--muted))] font-bold mb-1">
                      Corrected Version
                    </p>
                    <p className="text-sm font-medium text-[rgb(var(--ink))]">
                      {message.correctedContent}
                    </p>
                  </div>
                )}
                
                {message.corrections?.length ? (
                  <div className="space-y-3">
                    {message.corrections.map((c, i) => (
                      <div key={`${c.original}-${i}`}>
                        <p className="text-[0.6rem] uppercase tracking-[0.15em] text-[rgb(var(--accent))] font-bold inline-block mr-2">{c.type}</p>
                        <span className="text-sm">
                          <span className="line-through text-red-800/40 decoration-red-800/40">{c.original}</span>
                          <span className="mx-2 text-[rgb(var(--muted))]">→</span>
                          <span className="font-bold text-[rgb(var(--ink))]">{c.corrected}</span>
                        </span>
                        {c.explanation && <p className="mt-1 text-xs italic text-[rgb(var(--muted))]">"{c.explanation}"</p>}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
