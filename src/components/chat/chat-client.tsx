"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import scenarios from "@/data/scenarios.json";
import ScenarioSelector from "./scenario-selector";

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
};

type ChatResponse = {
  reply: string;
  corrections: Correction[];
  conversationId: string;
};

type ConversationSummary = {
  id: string;
  title: string;
  scenarioId: string | null;
  messageCount: number;
  updatedAt: number;
};

type ConversationDetail = {
  id: string;
  title: string;
  scenarioId: string | null;
  messages: ChatMessage[];
};

const starterPrompts = [
  "Quiero practicar cómo pedir comida en un restaurante.",
  "Necesito ayuda para preparar una entrevista de trabajo.",
  "¿Podemos hablar sobre mis planes de viaje a España?",
];

const defaultScenario =
  scenarios.find((scenario) => scenario.isDefault) ?? scenarios[0];

function formatRole(role: ChatMessage["role"]) {
  return role === "user" ? "You" : "Tutor";
}

export default function ChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [scenarioId, setScenarioId] = useState(defaultScenario?.id ?? "");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [status, setStatus] = useState<"idle" | "thinking" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Load conversation history on mount
  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch("/api/conversations");
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch {
        // Silently fail - conversations list is optional
      }
    }
    loadConversations();
  }, []);

  // Reload conversations after sending a message
  const refreshConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch {
      // Silently fail
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) {
        throw new Error("Failed to load conversation");
      }
      const data = (await response.json()) as ConversationDetail;
      setConversationId(data.id);
      setMessages(data.messages);
      if (data.scenarioId) {
        setScenarioId(data.scenarioId);
      }
      setStatus("idle");
      setErrorMessage(null);
    } catch {
      setErrorMessage("Failed to load conversation.");
    }
  };

  const metrics = useMemo(() => {
    const corrections = messages.reduce(
      (total, message) => total + (message.corrections?.length ?? 0),
      0,
    );

    const userMessages = messages.filter((message) => message.role === "user");

    return {
      messages: messages.length,
      corrections,
      turns: userMessages.length,
    };
  }, [messages]);

  const recentCorrections = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role === "assistant" && message.corrections?.length) {
        return message.corrections;
      }
    }
    return [];
  }, [messages]);

  const focusScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === scenarioId),
    [scenarioId],
  );

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleSend = async (content?: string) => {
    const trimmed = (content ?? input).trim();
    if (!trimmed || status === "thinking") {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setStatus("thinking");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenarioId,
          conversationId,
          messages: [...messages, userMessage].map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data = (await response.json()) as ChatResponse;

      // Store the conversation ID for subsequent messages
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        corrections: data.corrections ?? [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("idle");
      refreshConversations();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        "We could not reach the tutor. Check your API key or try .",
      );
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
    setConversationId(null);
    setStatus("idle");
    setErrorMessage(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="surface-card flex min-h-[560px] flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 px-6 py-5">
          <div>
            <p className="eyebrow">Active session</p>
            <p className="mt-2 text-lg font-semibold">
              {focusScenario?.name ?? "Custom scenario"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ScenarioSelector
              scenarios={scenarios}
              value={scenarioId}
              onChange={setScenarioId}
            />
            <button className="btn-secondary" type="button" onClick={handleReset}>
              New chat
            </button>
            <span className="rounded-full bg-[rgb(var(--accent-soft))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--accent))]">
              {status === "thinking" ? "Thinking" : "Ready"}
            </span>
          </div>
        </div>

        <div
          ref={scrollRef}
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
                    onClick={() => handleSend(prompt)}
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
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
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
              </div>
            ))
          )}
        </div>

        <div className="border-t border-black/10 px-6 py-4">
          {errorMessage ? (
            <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Write your next message in Spanish…"
              className="min-h-[110px] flex-1 resize-none rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-soft))]"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              className="btn-primary w-full sm:w-auto"
              disabled={status === "thinking"}
            >
              Send
            </button>
          </div>
          <p className="mt-3 text-xs text-[rgb(var(--muted))]">
            Press Enter to send, Shift+Enter for a new line.
          </p>
        </div>
      </section>

      <aside className="space-y-6">
        {conversations.length > 0 && (
          <div className="surface-card p-6">
            <p className="eyebrow">Recent conversations</p>
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {conversations.slice(0, 5).map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => loadConversation(conv.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition hover:bg-black/5 ${
                    conversationId === conv.id
                      ? "bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]"
                      : "text-[rgb(var(--muted))]"
                  }`}
                >
                  <p className="font-medium truncate text-[rgb(var(--ink))]">
                    {conv.title}
                  </p>
                  <p className="text-xs mt-0.5">
                    {conv.messageCount} messages
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="surface-card p-6">
          <p className="eyebrow">Scenario focus</p>
          <p className="mt-3 text-sm text-[rgb(var(--muted))]">
            {focusScenario?.description ??
              "Custom prompt with personalized instructions."}
          </p>
          <div className="mt-4 space-y-3 text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
            <div className="surface-muted px-4 py-3">
              Mode: conversational correction
            </div>
            <div className="surface-muted px-4 py-3">
              Output: reply + corrections
            </div>
          </div>
        </div>

        <div className="surface-card p-6">
          <p className="eyebrow">Session metrics</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              { label: "Turns", value: metrics.turns },
              { label: "Messages", value: metrics.messages },
              { label: "Corrections", value: metrics.corrections },
              { label: "Scenario", value: focusScenario?.name ?? "Custom" },
            ].map((metric) => (
              <div key={metric.label} className="surface-muted p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
                  {metric.label}
                </p>
                <p className="mt-2 text-lg font-semibold">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-6">
          <p className="eyebrow">Recent corrections</p>
          {recentCorrections.length ? (
            <div className="mt-4 space-y-3 text-sm">
              {recentCorrections.map((correction, index) => (
                <div key={`${correction.original}-${index}`} className="surface-muted p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--accent))]">
                    {correction.type}
                  </p>
                  <p className="mt-2 text-sm">
                    {correction.original} →{" "}
                    <span className="font-semibold">
                      {correction.corrected}
                    </span>
                  </p>
                  {correction.explanation ? (
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      {correction.explanation}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 surface-muted px-4 py-3 text-sm text-[rgb(var(--muted))]">
              Corrections will appear here as the tutor responds.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
