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

      setStatus("idle");
      refreshConversations();
    } catch (error) {
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

        <MessageList messages={messages} onSendStarter={handleSend} />

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

      <ConversationSidebar
        conversations={conversations}
        selectedId={conversationId}
        onSelect={loadConversation}
        onDelete={confirmDeleteConversation}
        focusScenarioName={focusScenario?.name ?? null}
        focusScenarioDescription={focusScenario?.description ?? null}
        metrics={metrics}
        recentCorrections={recentCorrections}
        sessionTenses={sessionTenses}
        sessionTopics={sessionTopics}
        sessionVocab={sessionVocab}
      />

      <DeleteDialog
        isOpen={deleteConfirm !== null}
        onConfirm={() => deleteConfirm && deleteConversation(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
        title={deleteConfirm?.title ?? ""}
        deleting={deleting}
      />
    </div>
  );
}
