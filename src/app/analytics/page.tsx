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
            {tabs.map((tab, index) => (
              <button
                key={tab}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  index === 0
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
