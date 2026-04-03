"use client";

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
  conversations: ConversationSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, title: string) => void;
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
  conversations,
  selectedId,
  onSelect,
  onDelete,
  focusScenarioName,
  focusScenarioDescription,
  metrics,
  recentCorrections,
  sessionTenses,
  sessionTopics,
  sessionVocab,
}: ConversationSidebarProps) {
  return (
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
                  onClick={() => onSelect(conv.id)}
                  className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition hover:bg-black/5 ${
                    selectedId === conv.id
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
                    onDelete(conv.id, conv.title);
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
          {focusScenarioDescription ??
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
            { label: "Scenario", value: focusScenarioName ?? "Custom" },
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

      {(sessionTenses.length > 0 || sessionTopics.length > 0) && (
        <div className="surface-card p-6">
          {sessionTenses.length > 0 && (
            <div>
              <p className="eyebrow">Tenses practiced</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sessionTenses.map((tense) => (
                  <span
                    key={tense.id}
                    className="rounded-full bg-[rgb(var(--accent-soft))] px-3 py-1 text-xs font-medium text-[rgb(var(--accent))]"
                  >
                    {tense.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          {sessionTopics.length > 0 && (
            <div className={sessionTenses.length > 0 ? "mt-5" : ""}>
              <p className="eyebrow">Topics covered</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sessionTopics.map((topic) => (
                  <span
                    key={topic.id}
                    className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-medium text-[rgb(var(--ink))]"
                  >
                    {topic.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
  );
}
