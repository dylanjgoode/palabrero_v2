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
        <div className="space-y-6">
          <div className="surface-muted p-5 text-sm text-[rgb(var(--muted))]">
            <p className="font-semibold text-[rgb(var(--ink))]">
              Start with a guided prompt
            </p>
            <p className="mt-2">
              Pick a starter line or type your own to begin the conversation.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onSendStarter(prompt)}
                className="surface-muted px-5 py-4 text-left text-[15px] font-medium transition hover:-translate-y-1 hover:shadow-sm"
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
            className={`flex flex-col ${
              message.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[80%] space-y-2 rounded-2xl px-5 py-4 text-sm shadow-sm ${
                message.role === "user"
                  ? "bg-[rgb(var(--accent))] text-white"
                  : "border border-black/10 bg-white/80"
              }`}
            >
              <div
                className={`flex items-center justify-between gap-4 text-[0.65rem] uppercase tracking-[0.2em] ${
                  message.role === "user"
                    ? "text-white/60"
                    : "text-black/50"
                }`}
              >
                <span>{formatRole(message.role)}</span>
                {(message.corrections?.length ?? 0) > 0 ? (
                  <button
                    type="button"
                    onClick={() => toggleCorrections(message.id)}
                    className={`hover:underline ${message.role === "user" ? "text-white/80" : "text-[rgb(var(--accent))]"}`}
                  >
                    {message.corrections!.length} note{message.corrections!.length === 1 ? "" : "s"} {expandedCorrections.has(message.id) ? "\u25b4" : "\u25be"}
                  </button>
                ) : (
                  <span>0 notes</span>
                )}
              </div>
              <p className="leading-relaxed">{message.content}</p>
            </div>
            {expandedCorrections.has(message.id) && message.corrections?.length ? (
              <div className={`mt-2 max-w-[80%] space-y-2 rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-sm ${message.role === "user" ? "self-end" : "self-start"}`}>
                {message.corrections.map((c, i) => (
                  <div key={`${c.original}-${i}`}>
                    <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgb(var(--accent))]">{c.type}</p>
                    <p className="mt-1 text-sm">{c.original} → <span className="font-semibold">{c.corrected}</span></p>
                    {c.explanation && <p className="mt-1 text-xs text-[rgb(var(--muted))]">{c.explanation}</p>}
                  </div>
                ))}
              </div>
            ) : null}
            {message.role === "user" && message.correctedContent && (
              <div className="mt-2 max-w-[80%] rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-emerald-600 mb-1">
                  Corrected version
                </p>
                <p className="text-emerald-800 leading-relaxed">
                  {message.correctedContent}
                </p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
