import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-20">
      <section className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <p className="eyebrow">Local-first tutor</p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Structured Spanish practice for serious learners.
          </h1>
          <p className="text-base text-[rgb(var(--muted))] sm:text-lg">
            Palabrero is a local workspace for conversational Spanish. It
            captures corrections, tracks mistakes, and turns every session into
            measurable progress without leaving your device.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" href="/chat">
              Start a session
            </Link>
            <Link className="btn-secondary" href="/analytics">
              Review analytics
            </Link>
          </div>
          <div className="grid gap-4 text-sm text-[rgb(var(--muted))] sm:grid-cols-3">
            <div className="surface-muted px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--accent))]">
                Data model
              </p>
              <p className="mt-2 text-sm">Conversations, corrections, vocabulary.</p>
            </div>
            <div className="surface-muted px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--accent))]">
                Storage
              </p>
              <p className="mt-2 text-sm">SQLite on-device with export options.</p>
            </div>
            <div className="surface-muted px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--accent))]">
                Audio
              </p>
              <p className="mt-2 text-sm">Text-to-speech with optional autoplay.</p>
            </div>
          </div>
        </div>
        <div className="surface-card animate-rise space-y-6 p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Session snapshot</p>
            <span className="rounded-full bg-[rgb(var(--accent-soft))] px-3 py-1 text-xs font-semibold text-[rgb(var(--accent))]">
              Live review
            </span>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
                Scenario
              </p>
              <p className="mt-2 text-base">Cafe in Madrid</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
                Recent corrections
              </p>
              <div className="mt-3 space-y-3">
                <div className="surface-muted px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--accent))]">
                    Agreement
                  </p>
                  <p className="mt-1 text-sm">
                    "La problema" → "El problema"
                  </p>
                </div>
                <div className="surface-muted px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--accent))]">
                    Tense
                  </p>
                  <p className="mt-1 text-sm">
                    "Yo fui a trabajar" → "Yo iba a trabajar"
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="surface-muted px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
                  Vocabulary
                </p>
                <p className="mt-2 text-xl font-semibold text-[rgb(var(--ink))]">
                  28 active
                </p>
              </div>
              <div className="surface-muted px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
                  Accuracy
                </p>
                <p className="mt-2 text-xl font-semibold text-[rgb(var(--ink))]">
                  82%
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="eyebrow">Core modules</p>
            <h2 className="text-3xl font-semibold">Built for accountable practice.</h2>
          </div>
          <p className="max-w-md text-sm text-[rgb(var(--muted))]">
            Every workflow emphasizes clarity, repeatability, and an audit trail
            of what was corrected and why.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Conversational Practice",
              detail:
                "Real-time corrections with alternate phrasing and recorded mistakes.",
            },
            {
              title: "Scenario Library",
              detail:
                "Roleplay templates and custom prompts for focused practice.",
            },
            {
              title: "Learning Analytics",
              detail:
                "Trends across grammar, vocabulary, topics, and accuracy.",
            },
          ].map((item) => (
            <div key={item.title} className="surface-card p-6">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm text-[rgb(var(--muted))]">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <p className="eyebrow">Workflow</p>
            <h2 className="text-3xl font-semibold">
              From session to study plan.
            </h2>
          </div>
          <p className="max-w-md text-sm text-[rgb(var(--muted))]">
            Each conversation feeds analytics and optional flashcards without
            manual curation.
          </p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {[
            "Start a chat with a scenario.",
            "Receive corrections and explanations.",
            "Review analytics and filters.",
            "Export flashcards to Mochi.",
          ].map((step, index) => (
            <div key={step} className="surface-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--accent))]">
                Step {index + 1}
              </p>
              <p className="mt-3 text-sm">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
