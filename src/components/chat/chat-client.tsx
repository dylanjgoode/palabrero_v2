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
  correctedContent?: string | null;
};

type VocabItem = {
  term: string;
  translation: string;
  category: string;
};

type TopicItem = {
  id: string;
  label: string;
};

type TenseItem = {
  id: string;
  label: string;
};

type ChatResponse = {
  reply: string;
  corrections: Correction[];
  conversationId: string;
  vocabulary?: VocabItem[];
  correctedContent?: string | null;
  topics?: string[];
  tenses?: string[];
};

type ConversationSummary = {
  id: string;
  title: string;
  scenarioId: string | null;
  messageCount: number;
  updatedAt: number;
  summary: string | null;
};

type ConversationDetail = {
  id: string;
  title: string;
  scenarioId: string | null;
  messages: ChatMessage[];
  topics?: TopicItem[];
  tenses?: TenseItem[];
};

const starterPrompts = [
  "Quiero practicar cómo pedir comida en un restaurante.",
  "Necesito ayuda para preparar una entrevista de trabajo.",
  "¿Podemos hablar sobre mis planes de viaje a España?",
];

const defaultScenario =
  scenarios.find((scenario) => scenario.isDefault) ?? scenarios[0];

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

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
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sessionVocab, setSessionVocab] = useState<VocabItem[]>([]);
  const [sessionTopics, setSessionTopics] = useState<TopicItem[]>([]);
  const [sessionTenses, setSessionTenses] = useState<TenseItem[]>([]);
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
      setSessionVocab([]); // Reset session vocab when loading different conversation
      setSessionTopics(data.topics ?? []);
      setSessionTenses(data.tenses ?? []);
      if (data.scenarioId) {
        setScenarioId(data.scenarioId);
      }
      setStatus("idle");
      setErrorMessage(null);
    } catch {
      setErrorMessage("Failed to load conversation.");
    }
  };

  const confirmDeleteConversation = (id: string, title: string) => {
    setDeleteConfirm({ id, title });
  };

  const deleteConversation = async (id: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");

      // Clear active conversation if it was deleted
      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
        setSessionVocab([]);
        setSessionTopics([]);
        setSessionTenses([]);
      }

      await refreshConversations();
      setDeleteConfirm(null);
    } catch {
      setErrorMessage("Failed to delete conversation.");
      setDeleteConfirm(null);
    }
    setDeleting(false);
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

      // Update user message with correctedContent (if present) and add assistant message
      setMessages((prev) => {
        const updated = data.correctedContent
          ? prev.map((msg) =>
              msg.id === userMessage.id
                ? { ...msg, correctedContent: data.correctedContent }
                : msg
            )
          : prev;
        return [...updated, assistantMessage];
      });

      // Accumulate vocabulary from response
      if (data.vocabulary?.length) {
        setSessionVocab((prev) => {
          const newTerms = data.vocabulary!.filter(
            (v) => !prev.some((p) => p.term.toLowerCase() === v.term.toLowerCase())
          );
          return [...prev, ...newTerms].slice(-10); // Keep last 10
        });
      }

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
    setSessionVocab([]);
    setSessionTopics([]);
    setSessionTenses([]);
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
                <div
                  key={conv.id}
                  className="group relative flex items-center"
                >
                  <button
                    type="button"
                    onClick={() => loadConversation(conv.id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition hover:bg-black/5 ${
                      conversationId === conv.id
                        ? "bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]"
                        : "text-[rgb(var(--muted))]"
                    }`}
                  >
                    <p className="font-medium truncate text-[rgb(var(--ink))] pr-6">
                      {conv.title}
                    </p>
                    {conv.summary && (
                      <p className="text-xs mt-0.5 truncate text-[rgb(var(--muted))] pr-6">
                        {conv.summary}
                      </p>
                    )}
                    <p className="text-xs mt-0.5">{conv.messageCount} messages</p>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteConversation(conv.id, conv.title);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-[rgb(var(--muted))] hover:text-red-600 transition"
                    aria-label="Delete conversation"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
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

        {sessionVocab.length > 0 && (
          <div className="surface-card p-6">
            <p className="eyebrow">Session Vocabulary</p>
            <div className="mt-4 space-y-2">
              {sessionVocab.map((vocab) => (
                <div key={vocab.term} className="flex justify-between items-start text-sm">
                  <div>
                    <span className="font-medium">{vocab.term}</span>
                    <span className="text-[rgb(var(--muted))] ml-2">{vocab.translation}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--surface-muted))] text-[rgb(var(--muted))]">
                    {vocab.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => !deleting && setDeleteConfirm(null)}
          onKeyDown={(e) => e.key === "Escape" && !deleting && setDeleteConfirm(null)}
        >
          <div
            className="surface-card p-6 max-w-sm mx-4 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg">Delete conversation?</h3>
            <p className="text-[rgb(var(--muted))] mt-2">
              &ldquo;{deleteConfirm.title}&rdquo; will be permanently deleted.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg border border-[rgb(var(--border))] hover:bg-black/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConversation(deleteConfirm.id)}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
