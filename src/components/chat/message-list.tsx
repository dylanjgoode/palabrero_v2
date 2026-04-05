"use client";

import { useCallback, useEffect, useRef } from "react";
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
              className={`max-w-[85%] text-[15px] leading-relaxed relative overflow-hidden ${
                message.role === "user"
                  ? "bg-[rgb(var(--accent))] text-white rounded-2xl rounded-tr-sm shadow-md shadow-red-900/10"
                  : "surface-card border border-white/50 rounded-2xl rounded-tl-sm text-[rgb(var(--ink))]"
              }`}
            >
              <div className="px-5 py-3.5">
                <p>{message.content}</p>
              </div>

              {/* Integrated Inline Corrections */}
              {(message.corrections?.length ?? 0) > 0 && message.role === "user" && (
                <div className="bg-black/15 px-5 py-3.5 border-t border-white/10 mt-1">
                  <div className="flex items-center justify-end gap-1.5 mb-2 text-white/90">
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] opacity-90">How you might say it</span>
                    <svg className="w-3.5 h-3.5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  {message.correctedContent && (
                    <p className="text-[14.5px] font-medium text-white mb-2 text-right leading-snug">
                      {message.correctedContent}
                    </p>
                  )}
                  
                  {message.corrections && message.corrections.length > 0 && (
                    <div className="space-y-2 border-t border-white/10 pt-2.5 mt-1 text-right">
                      {message.corrections.map((c, i) => (
                        <div key={`${c.original}-${i}`} className="text-[12.5px] text-white/80 transition-colors">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <span className="line-through decoration-white/40 opacity-70 relative top-[1px]">{c.original}</span>
                            <span className="opacity-50">→</span>
                            <span className="font-semibold text-white/95">{c.corrected}</span>
                          </div>
                          {c.explanation && <p className="mt-0.5 text-[11px] opacity-75 italic leading-snug">"{c.explanation}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
