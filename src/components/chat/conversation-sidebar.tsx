"use client";

import { useState } from "react";

type Correction = {
  type: string;
  original: string;
  corrected: string;
  explanation?: string;
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

type ConversationSummary = {
  id: string;
  title: string;
  scenarioId: string | null;
  messageCount: number;
  updatedAt: number;
  summary: string | null;
};

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

type ConversationSidebarProps = {
  focusScenarioName: string | null;
  focusScenarioDescription: string | null;
  metrics: {
    messages: number;
    corrections: number;
    turns: number;
  };
  recentCorrections: Correction[];
  sessionTenses: TenseItem[];
  sessionTopics: TopicItem[];
  sessionVocab: VocabItem[];
};

export default function ConversationSidebar({
  focusScenarioName,
  focusScenarioDescription,
  metrics,
  recentCorrections,
  sessionTenses,
  sessionTopics,
  sessionVocab,
}: ConversationSidebarProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <aside className="space-y-4">
      {/* Tutor's Notebook Header */}
      <div className="flex items-center gap-3 px-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-[rgb(var(--accent-soft))] flex items-center justify-center text-[rgb(var(--accent))]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-[rgb(var(--ink))]">
          Tutor's Notebook
        </h2>
      </div>

      <div className="surface-card p-5 animate-rise" style={{ animationDelay: '0.1s' }}>
        <p className="eyebrow">Session overview</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { label: "Turns", value: metrics.turns },
            { label: "Messages", value: metrics.messages },
            { label: "Corrections", value: metrics.corrections },
            { label: "Scenario", value: focusScenarioName ?? "Custom" },
          ].map((metric) => (
            <div key={metric.label} className="surface-muted p-3">
              <p className="text-[0.65rem] uppercase tracking-[0.15em] text-[rgb(var(--muted))]">
                {metric.label}
              </p>
              <p className="mt-1 text-base font-semibold">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="surface-card p-5 animate-rise" style={{ animationDelay: '0.2s' }}>
        <p className="eyebrow flex items-center justify-between">
          <span>Active Corrections</span>
          {recentCorrections.length > 0 && (
            <span className="bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))] px-2 py-0.5 rounded-full text-[0.6rem]">
              {recentCorrections.length}
            </span>
          )}
        </p>
        {recentCorrections.length ? (
          <div className="mt-3 space-y-2 text-sm">
            {recentCorrections.map((correction, index) => (
              <div key={`${correction.original}-${index}`} className="surface-muted p-3 border-l-2 border-l-[rgb(var(--accent))]">
                <p className="text-[0.65rem] uppercase tracking-[0.1em] text-[rgb(var(--accent))] font-bold">
                  {correction.type}
                </p>
                <div className="mt-1.5 flex flex-col gap-1">
                  <p className="text-[rgb(var(--muted))] line-through decoration-1 decoration-red-400">
                    {correction.original}
                  </p>
                  <p className="font-semibold text-[rgb(var(--ink))]">
                    {correction.corrected}
                  </p>
                </div>
                {correction.explanation ? (
                  <p className="mt-2 text-xs italic text-[rgb(var(--muted))]">
                    "{correction.explanation}"
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 surface-muted px-4 py-4 text-center text-sm text-[rgb(var(--muted))] italic">
            Waiting for grammar or vocabulary corrections.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setSidebarExpanded((prev) => !prev)}
        className="lg:hidden w-full surface-card px-4 py-3 text-sm font-medium text-[rgb(var(--ink))] transition hover:bg-white border hover:border-black/10"
      >
        {sidebarExpanded ? "Hide Notebook contents \u25b4" : "Show Notebook contents \u25be"}
      </button>

      <div className={`space-y-4 ${sidebarExpanded ? "block" : "hidden lg:block"} animate-rise`} style={{ animationDelay: '0.3s' }}>
        {(sessionTenses.length > 0 || sessionTopics.length > 0) && (
          <div className="surface-card p-5">
            {sessionTenses.length > 0 && (
              <div>
                <p className="eyebrow">Tenses</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sessionTenses.map((tense) => (
                    <span
                      key={tense.id}
                      className="rounded-md bg-[rgb(var(--accent-soft))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--accent))] shadow-sm"
                    >
                      {tense.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {sessionTopics.length > 0 && (
              <div className={sessionTenses.length > 0 ? "mt-4" : ""}>
                <p className="eyebrow">Topics</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sessionTopics.map((topic) => (
                    <span
                      key={topic.id}
                      className="rounded-md surface-muted border border-white/40 px-2.5 py-1 text-xs font-medium text-[rgb(var(--ink))]"
                    >
                      {topic.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {sessionVocab.length > 0 && (
          <div className="surface-card p-5 animate-rise" style={{ animationDelay: '0.4s' }}>
            <p className="eyebrow">Vocabulary</p>
            <div className="mt-3 space-y-1.5">
              {sessionVocab.map((vocab) => (
                <div key={vocab.term} className="flex justify-between items-center text-sm border-b border-black/5 pb-1.5 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[rgb(var(--ink))]">{vocab.term}</span>
                    <span className="text-[0.75rem] text-[rgb(var(--muted))]">{vocab.translation}</span>
                  </div>
                  <span className="text-[0.55rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm surface-muted text-[rgb(var(--muted))] border border-white/50">
                    {vocab.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
