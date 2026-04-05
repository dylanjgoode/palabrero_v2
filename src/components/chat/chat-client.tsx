"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import scenarios from "@/data/scenarios.json";
import ScenarioSelector from "./scenario-selector";
import MessageList from "./message-list";
import ConversationSidebar from "./conversation-sidebar";
import DeleteDialog from "./delete-dialog";

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

const tenseLabels: Record<string, string> = {
  present: "Present indicative",
  preterite: "Preterite (simple past)",
  imperfect: "Imperfect",
  future: "Future",
  conditional: "Conditional",
  "present-subjunctive": "Present subjunctive",
  "imperfect-subjunctive": "Imperfect subjunctive",
  imperative: "Commands/imperative",
  "present-perfect": "Present perfect",
  "past-perfect": "Past perfect (pluperfect)",
};

const topicLabels: Record<string, string> = {
  food: "Food & Dining",
  travel: "Travel",
  work: "Work & Career",
  family: "Family",
  health: "Health",
  shopping: "Shopping",
  weather: "Weather",
  hobbies: "Hobbies & Leisure",
  education: "Education",
  technology: "Technology",
  general: "General",
};

const defaultScenario =
  scenarios.find((scenario) => scenario.isDefault) ?? scenarios[0];

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
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const lastFailedMessagesRef = useRef<ChatMessage[] | null>(null);

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
  const refreshConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch {
      // Silently fail
    }
  }, []);

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
      setHistoryOpen(false); // Close history drawer if open
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

  const isSendingRef = useRef(false);

  const handleRetry = async () => {
    if (!lastFailedMessagesRef.current || status === "thinking" || isSendingRef.current) return;
    isSendingRef.current = true;
    setStatus("thinking");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId,
          conversationId,
          messages: lastFailedMessagesRef.current.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!response.ok) throw new Error("Request failed");
      const data = (await response.json()) as ChatResponse;
      if (data.conversationId) setConversationId(data.conversationId);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        corrections: data.corrections ?? [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
      if (data.corrections?.length) {
        setLiveAnnouncement(`Tutor responded with ${data.corrections.length} correction${data.corrections.length === 1 ? "" : "s"}`);
      }
      lastFailedMessagesRef.current = null;
      setStatus("idle");
      refreshConversations();
    } catch {
      setStatus("error");
      setErrorMessage("We could not reach the tutor. Check your API key or try again.");
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleSend = async (content?: string) => {
    const trimmed = (content ?? input).trim();
    if (!trimmed || status === "thinking" || isSendingRef.current) {
      return;
    }
    isSendingRef.current = true;

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

      // Accumulate topics and tenses from response
      if (data.topics?.length) {
        setSessionTopics((prev) => {
          const newTopics = data.topics!
            .filter((id) => !prev.some((p) => p.id === id))
            .map((id) => ({ id, label: topicLabels[id] ?? id }));
          return [...prev, ...newTopics];
        });
      }
      if (data.tenses?.length) {
        setSessionTenses((prev) => {
          const newTenses = data.tenses!
            .filter((id) => !prev.some((p) => p.id === id))
            .map((id) => ({ id, label: tenseLabels[id] ?? id }));
          return [...prev, ...newTenses];
        });
      }

      if (data.corrections?.length) {
        setLiveAnnouncement(`Tutor responded with ${data.corrections.length} correction${data.corrections.length === 1 ? "" : "s"}`);
      }
      lastFailedMessagesRef.current = null;
      setStatus("idle");
      refreshConversations();
    } catch {
      lastFailedMessagesRef.current = [...messages, userMessage];
      setStatus("error");
      setErrorMessage(
        "We could not reach the tutor. Check your API key or try again.",
      );
    } finally {
      isSendingRef.current = false;
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
    <>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="surface-card flex min-h-[600px] flex-col relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 px-6 py-5 bg-white/40">
            <div>
              <p className="eyebrow text-[rgb(var(--accent))]">Active session</p>
              <p className="mt-1 text-lg font-bold font-[family-name:var(--font-fraunces)]">
                {focusScenario?.name ?? "Custom scenario"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                type="button" 
                onClick={() => setHistoryOpen(true)}
                className="btn-secondary px-3 py-2 space-x-2 text-sm !rounded-md"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">History</span>
              </button>
              <ScenarioSelector
                scenarios={scenarios}
                value={scenarioId}
                onChange={setScenarioId}
              />
              <button className="btn-secondary px-3 py-2 text-sm !rounded-md" type="button" onClick={handleReset}>
                <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">New chat</span>
              </button>
            </div>
          </div>

        <MessageList messages={messages} onSendStarter={handleSend} />

        <div className="border-t border-black/10 px-6 py-4">
          {errorMessage ? (
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={handleRetry}
                className="ml-3 shrink-0 font-semibold text-red-700 underline hover:text-red-900"
              >
                Try again
              </button>
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
              disabled={status === "thinking"}
              aria-label="Write your next message in Spanish"
              placeholder="Write your next message in Spanish…"
              className="min-h-[110px] flex-1 resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-shadow"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              className="btn-primary w-full sm:w-auto h-[50px] self-end"
              disabled={status === "thinking"}
            >
              {status === "thinking" ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Thinking
                </span>
              ) : "Send \u2192"}
            </button>
          </div>
          <p className="mt-4 text-center text-xs font-semibold text-[rgb(var(--muted))]">
            Press Enter to send, Shift+Enter for a new line.
          </p>
          <div aria-live="polite" className="sr-only">{liveAnnouncement}</div>
        </div>
      </section>

      <ConversationSidebar
        focusScenarioName={focusScenario?.name ?? null}
        focusScenarioDescription={focusScenario?.description ?? null}
        metrics={metrics}
        recentCorrections={recentCorrections}
        sessionTenses={sessionTenses}
        sessionTopics={sessionTopics}
        sessionVocab={sessionVocab}
      />

      {historyOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/20 backdrop-blur-sm" onClick={() => setHistoryOpen(false)}>
          <div 
            className="w-full max-w-sm h-full bg-[rgb(var(--surface))] shadow-2xl p-6 overflow-y-auto animate-fade shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 border-b border-black/5 pb-4">
              <h2 className="text-xl font-bold font-[family-name:var(--font-fraunces)] text-[rgb(var(--ink))]">Conversation History</h2>
              <button onClick={() => setHistoryOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition">
                <svg className="w-5 h-5 text-[rgb(var(--muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {conversations.length === 0 ? (
              <p className="text-sm text-[rgb(var(--muted))] italic">No past conversations found.</p>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <div key={conv.id} className="group relative flex flex-col surface-muted border border-transparent p-3 rounded-xl hover:border-[rgb(var(--accent-soft))] hover:bg-white transition shadow-sm">
                    <button
                      type="button"
                      onClick={() => loadConversation(conv.id)}
                      className="text-left w-full pr-8"
                    >
                      <p className={`font-semibold text-sm ${conversationId === conv.id ? "text-[rgb(var(--accent))]" : "text-[rgb(var(--ink))]"}`}>
                        {conv.title}
                      </p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-1 line-clamp-2">
                        {conv.summary ?? "No summary available."}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))] mt-2 bg-black/5 inline-block px-2 py-0.5 rounded">
                        {conv.messageCount} msgs \u2022 {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteConversation(conv.id, conv.title);
                      }}
                      className="absolute right-2 top-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-300 hover:text-red-600 transition"
                      aria-label="Delete conversation"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <DeleteDialog
        isOpen={deleteConfirm !== null}
        onConfirm={() => deleteConfirm && deleteConversation(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
        title={deleteConfirm?.title ?? ""}
        deleting={deleting}
      />
    </div>
    </>
  );
}
