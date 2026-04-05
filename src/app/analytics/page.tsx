"use client";

import React, { Component, useEffect, useMemo, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  PieChart,
  Area,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

class ChartErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white/60 text-sm text-[rgb(var(--muted))]">
          <div className="text-center">
            <p>Chart failed to load.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 text-sm text-[rgb(var(--accent))] hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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

type AnalyticsData = {
  tenses: Array<{ id: string; label: string; count: number }>;
  topics: Array<{ id: string; label: string; count: number }>;
  corrections: Array<{ type: string; count: number }>;
  progress: Array<{
    week: string;
    weekStart: number;
    userMessages: number;
    corrections: number;
    newVocabulary: number;
  }>;
  totals: {
    conversations: number;
    userMessages: number;
    corrections: number;
    vocabulary: number;
  };
};

const tabs = ["Overview", "Vocabulary"];

function getCssVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function buildChartColors() {
  const accent = getCssVar("--accent") || "30 95 80";
  const accentSoft = getCssVar("--accent-soft") || "214 231 226";
  const muted = getCssVar("--muted") || "86 94 90";
  const ink = getCssVar("--ink") || "21 24 24";
  return {
    teal: `rgb(${accent})`,
    tealSoft: `rgb(${accentSoft})`,
    tealMid: `rgba(${accent}, 0.5)`,
    muted: `rgb(${muted})`,
    ink: `rgb(${ink})`,
    gridLine: "rgba(0, 0, 0, 0.06)",
  };
}

const CATEGORY_COLORS = Array.from({ length: 10 }, (_, i) =>
  `hsl(${(i * 36 + 200) % 360}, 60%, ${50 + (i % 3) * 10}%)`
);

const tooltipStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.08)",
  backdropFilter: "blur(8px)",
  background: "rgba(255,255,255,0.92)",
  fontSize: 12,
  boxShadow: "0 8px 24px -12px rgba(0,0,0,0.15)",
};

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [vocabulary, setVocabulary] = useState<VocabItem[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [vocabFetched, setVocabFetched] = useState(false);
  const [vocabError, setVocabError] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(false);

  const CHART_COLORS = useMemo(() => buildChartColors(), []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(false);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        setAnalytics(await res.json());
      } else {
        setAnalyticsError(true);
      }
    } catch {
      setAnalyticsError(true);
    }
    setAnalyticsLoading(false);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const stats = analytics
    ? [
        { label: "Conversations", value: String(analytics.totals.conversations) },
        { label: "Messages", value: String(analytics.totals.userMessages) },
        { label: "Corrections", value: String(analytics.totals.corrections) },
        { label: "Vocabulary added", value: String(analytics.totals.vocabulary) },
      ]
    : [
        { label: "Conversations", value: "—" },
        { label: "Messages", value: "—" },
        { label: "Corrections", value: "—" },
        { label: "Vocabulary added", value: "—" },
      ];

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

  const progressData = (analytics?.progress ?? []).map((p) => ({
    ...p,
    label: new Date(p.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  const tensesWithData = (analytics?.tenses ?? []).filter((t) => t.count > 0);
  const topicsWithData = (analytics?.topics ?? []).filter((t) => t.count > 0);
  const correctionsData = analytics?.corrections ?? [];

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
        {analyticsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface-card p-5">
                <div className="h-3 w-20 rounded bg-black/10 animate-pulse" />
                <div className="mt-4 h-7 w-12 rounded bg-black/10 animate-pulse" />
              </div>
            ))
          : stats.map((stat) => (
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
          <div className="flex flex-wrap gap-2" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                role="tab"
                aria-selected={activeTab === tab}
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
          <>
            {analyticsLoading ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="surface-muted p-6">
                    <div className="h-4 w-32 rounded bg-black/10 animate-pulse" />
                    <div className="mt-2 h-3 w-48 rounded bg-black/10 animate-pulse" />
                    <div className="mt-4 h-[180px] sm:h-[220px] rounded-2xl bg-black/5 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : analyticsError ? (
              <div className="mt-6 text-center py-12">
                <p className="text-[rgb(var(--muted))]">Failed to load analytics.</p>
                <button
                  onClick={fetchAnalytics}
                  className="mt-2 text-sm text-[rgb(var(--accent))] hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : !analytics ? (
              <div className="mt-6 text-center py-12 text-[rgb(var(--muted))]">
                No analytics data available yet. Start a conversation to
                generate data.
              </div>
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Weekly progress: messages, corrections, vocabulary */}
                <div className="surface-muted p-6">
                  <p className="text-sm font-semibold">Weekly progress</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Messages, corrections, and new vocabulary by week.
                  </p>
                  {progressData.length === 0 ? (
                    <div className="mt-6 flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white/60 text-sm text-[rgb(var(--muted))]">
                      Complete a few sessions to see progress.
                    </div>
                  ) : (
                    <div className="mt-4 h-[180px] sm:h-[220px]">
                      <ChartErrorBoundary>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={progressData}>
                          <defs>
                            <linearGradient
                              id="gradMessages"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={CHART_COLORS.teal}
                                stopOpacity={0.18}
                              />
                              <stop
                                offset="100%"
                                stopColor={CHART_COLORS.teal}
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                            <linearGradient
                              id="gradCorrections"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={CHART_COLORS.muted}
                                stopOpacity={0.15}
                              />
                              <stop
                                offset="100%"
                                stopColor={CHART_COLORS.muted}
                                stopOpacity={0.01}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={CHART_COLORS.gridLine}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                            axisLine={false}
                            tickLine={false}
                            width={30}
                          />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: 11 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="userMessages"
                            name="Messages"
                            stroke={CHART_COLORS.teal}
                            fill="url(#gradMessages)"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="corrections"
                            name="Corrections"
                            stroke={CHART_COLORS.muted}
                            fill="url(#gradCorrections)"
                            strokeWidth={2}
                            dot={false}
                            strokeDasharray="4 4"
                          />
                          <Bar
                            dataKey="newVocabulary"
                            name="New vocabulary"
                            fill={CHART_COLORS.tealSoft}
                            radius={[4, 4, 0, 0]}
                            barSize={12}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                      </ChartErrorBoundary>
                    </div>
                  )}
                </div>

                {/* Error type breakdown */}
                <div className="surface-muted p-6">
                  <p className="text-sm font-semibold">Error types</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Most frequent correction categories.
                  </p>
                  {correctionsData.length === 0 ? (
                    <div className="mt-6 flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white/60 text-sm text-[rgb(var(--muted))]">
                      No corrections recorded yet.
                    </div>
                  ) : (
                    <div className="mt-4 h-[180px] sm:h-[220px]">
                      <ChartErrorBoundary>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={correctionsData}
                          layout="vertical"
                          margin={{ left: 10, right: 20 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={CHART_COLORS.gridLine}
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="type"
                            tick={{ fontSize: 11, fill: CHART_COLORS.ink }}
                            axisLine={false}
                            tickLine={false}
                            width={90}
                          />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar
                            dataKey="count"
                            name="Corrections"
                            fill={CHART_COLORS.teal}
                            radius={[0, 6, 6, 0]}
                            barSize={18}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                      </ChartErrorBoundary>
                    </div>
                  )}
                </div>

                {/* Tense distribution donut */}
                <div className="surface-muted p-6">
                  <p className="text-sm font-semibold">Tense distribution</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Verb tenses practiced across all sessions.
                  </p>
                  {tensesWithData.length === 0 ? (
                    <div className="mt-6 flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white/60 text-sm text-[rgb(var(--muted))]">
                      No tense data recorded yet.
                    </div>
                  ) : (
                    <div className="mt-4 h-[180px] sm:h-[220px]">
                      <ChartErrorBoundary>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={tensesWithData}
                            dataKey="count"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            strokeWidth={2}
                            stroke="rgba(255,255,255,0.8)"
                          >
                            {tensesWithData.map((t, i) => (
                              <Cell
                                key={t.id}
                                fill={
                                  CATEGORY_COLORS[
                                    i % CATEGORY_COLORS.length
                                  ]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{
                              fontSize: 11,
                              color: CHART_COLORS.muted,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      </ChartErrorBoundary>
                    </div>
                  )}
                </div>

                {/* Topic coverage */}
                <div className="surface-muted p-6">
                  <p className="text-sm font-semibold">Topic coverage</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Conversation topics by message frequency.
                  </p>
                  {topicsWithData.length === 0 ? (
                    <div className="mt-6 flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white/60 text-sm text-[rgb(var(--muted))]">
                      No topic data recorded yet.
                    </div>
                  ) : (
                    <div className="mt-4 h-[180px] sm:h-[220px]">
                      <ChartErrorBoundary>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topicsWithData}
                          layout="vertical"
                          margin={{ left: 10, right: 20 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={CHART_COLORS.gridLine}
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="label"
                            tick={{ fontSize: 11, fill: CHART_COLORS.ink }}
                            axisLine={false}
                            tickLine={false}
                            width={100}
                          />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar
                            dataKey="count"
                            name="Messages"
                            fill={CHART_COLORS.tealMid}
                            radius={[0, 6, 6, 0]}
                            barSize={18}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                      </ChartErrorBoundary>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
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

      </section>

      <section className="surface-card p-8">
        <p className="eyebrow">Filters</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            "Conversation selector",
            "Date range",
            "Error type",
            "Scenario",
          ].map((filter) => (
            <div key={filter} className="surface-muted p-5 text-sm opacity-70">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[rgb(var(--muted))]">
                {filter}
              </p>
              <p className="mt-2 text-sm font-semibold text-[rgb(var(--ink-body))]">
                Pending configuration
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
