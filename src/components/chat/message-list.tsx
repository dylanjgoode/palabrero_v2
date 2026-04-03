"use client";

import { useCallback, useEffect, useRef } from "react";

type Correction = {
  type: string;
  original: string;
  corrected: string;
  explanation?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  corrections?: Correction[];
  correctedContent?: string | null;
};

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
                className="surface-muted px-4 py-3 text-left text-sm transition hover:border-black/30"
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
                <span>{message.corrections?.length ?? 0} notes</span>
              </div>
              <p className="leading-relaxed">{message.content}</p>
            </div>
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
