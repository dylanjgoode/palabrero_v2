"use client";

import { useState } from "react";

type VocabItem = {
  id: string;
  term: string;
  translation: string;
  partOfSpeech: string;
  category: string;
  count: number;
  firstSeenAt: number;
  lastSeenAt: number;
};

type CategorySummary = {
  category: string;
  termCount: number;
  totalUses: number;
};

const statCards = [
  { label: "Conversations", value: "12" },
  { label: "Messages", value: "248" },
  { label: "Corrections", value: "64" },
  { label: "Vocabulary added", value: "83" },
];

const tabs = ["Overview", "Vocabulary", "Grammar", "Topics", "Flashcards"];

const chartPlaceholders = [
  {
    title: "Accuracy trend",
    note: "Weekly improvement in corrected vs. uncorrected phrasing.",
  },
  {
    title: "Tense distribution",
    note: "Present, preterite, imperfect, conditional, subjunctive.",
  },
  {
    title: "Topic coverage",
    note: "Travel, food, work, relationships, current events.",
  },
  {
    title: "Vocabulary growth",
    note: "New words introduced by you and the tutor.",
  },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [vocabulary, setVocabulary] = useState<VocabItem[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [vocabFetched, setVocabFetched] = useState(false);
  const [vocabError, setVocabError] = useState(false);

  const fetchVocabulary = async () => {
    setLoading(true);
    setVocabError(false);
    try {
      const res = await fetch("/api/vocabulary?orderBy=lastSeenAt&limit=100");
      if (res.ok) {
        const data = await res.json();
        setVocabulary(data.vocabulary);
        setCategories(data.summary.categories);
      } else {
        setVocabError(true);
      }
    } catch {
      setVocabError(true);
    }
    setLoading(false);
    setVocabFetched(true);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "Vocabulary" && (!vocabFetched || vocabError)) {
      fetchVocabulary();
    }
  };

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="eyebrow">Analytics</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Learning trends and accountability.
        </h1>
        <p className="text-sm text-[rgb(var(--muted))] sm:text-base">
          Filter by conversation or date range to study where progress is
          consistent and where new attention is required.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="surface-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <p className="eyebrow">Dashboard</p>
            <p className="mt-2 text-lg font-semibold">All sessions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab
                    ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]"
                    : "border-black/10 text-[rgb(var(--muted))] hover:border-black/40"
                }`}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "Overview" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {chartPlaceholders.map((chart) => (
              <div key={chart.title} className="surface-muted p-6">
                <p className="text-sm font-semibold">{chart.title}</p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                  {chart.note}
                </p>
                <div className="mt-6 h-32 rounded-2xl border border-dashed border-black/15 bg-white/60" />
              </div>
            ))}
          </div>
        )}

        {activeTab === "Vocabulary" && (
          <div className="mt-6 space-y-6">
            {loading ? (
              <div className="text-center py-8 text-[rgb(var(--muted))]">
                Loading vocabulary...
              </div>
            ) : vocabError ? (
              <div className="text-center py-8">
                <p className="text-[rgb(var(--muted))]">Failed to load vocabulary.</p>
                <button
                  onClick={fetchVocabulary}
                  className="mt-2 text-sm text-[rgb(var(--accent))] hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : vocabulary.length === 0 ? (
              <div className="text-center py-8 text-[rgb(var(--muted))]">
                No vocabulary recorded yet. Start a conversation to build your vocabulary list.
              </div>
            ) : (
              <>
                {/* Category summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {categories.map((cat) => (
                    <div key={cat.category} className="surface-muted p-4">
                      <p className="text-xs text-[rgb(var(--muted))] capitalize">{cat.category}</p>
                      <p className="text-2xl font-bold">{cat.termCount}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{cat.totalUses} uses</p>
                    </div>
                  ))}
                </div>

                {/* Vocabulary table */}
                <div className="surface-muted overflow-hidden rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-black/5">
                      <tr>
                        <th className="text-left p-3 font-medium">Term</th>
                        <th className="text-left p-3 font-medium">Translation</th>
                        <th className="text-left p-3 font-medium">Category</th>
                        <th className="text-right p-3 font-medium">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vocabulary.map((v) => (
                        <tr key={v.id} className="border-t border-black/10">
                          <td className="p-3 font-medium">{v.term}</td>
                          <td className="p-3 text-[rgb(var(--muted))]">{v.translation}</td>
                          <td className="p-3">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 capitalize">
                              {v.category}
                            </span>
                          </td>
                          <td className="p-3 text-right">{v.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab !== "Overview" && activeTab !== "Vocabulary" && (
          <div className="mt-6 text-center py-12 text-[rgb(var(--muted))]">
            {activeTab} analytics coming soon.
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card p-6">
          <p className="eyebrow">Filters</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              "Conversation selector",
              "Date range",
              "Error type",
              "Scenario",
            ].map((filter) => (
              <div key={filter} className="surface-muted p-4 text-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
                  {filter}
                </p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                  Pending configuration
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-6">
          <p className="eyebrow">Exports</p>
          <p className="mt-3 text-sm text-[rgb(var(--muted))]">
            Export vocabulary to CSV or generate Mochi flashcards from filtered
            results.
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="surface-muted flex items-center justify-between px-4 py-3">
              <span>Vocabulary CSV</span>
              <button className="btn-secondary" type="button">
                Download
              </button>
            </div>
            <div className="surface-muted flex items-center justify-between px-4 py-3">
              <span>Mochi flashcards</span>
              <button className="btn-primary" type="button">
                Generate
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
