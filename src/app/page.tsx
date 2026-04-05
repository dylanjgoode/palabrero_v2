import Link from "next/link";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { messages, corrections } from "@/db/schema";

export default async function Home() {
  const [[msgCount], [corrCount]] = await Promise.all([
    db.select({ value: count() }).from(messages),
    db.select({ value: count() }).from(corrections),
  ]);
  return (
    <div className="space-y-32">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col justify-center">
            <span className="inline-block px-4 py-2 bg-[rgb(var(--accent-soft))] text-[rgb(var(--ink))] rounded-full text-sm font-bold w-max mb-6">Local-first tutor 🌿</span>
            <h1 className="font-[family-name:var(--font-fraunces)] text-5xl md:text-7xl leading-[1.1] mb-6 text-[rgb(var(--ink))]">
                Speak Spanish with <br/><i className="text-[rgb(var(--accent))]">confidence</i>.
            </h1>
            <p className="text-lg text-[rgb(var(--ink-body))] max-w-md leading-relaxed mb-10">
                A warm, conversational workspace that captures your mistakes and turns them into gentle, measurable progress without leaving your device.
            </p>
            <div className="flex flex-wrap gap-4">
                <Link className="btn-primary" href="/chat">
                    Start chatting
                </Link>
                <Link className="btn-secondary" href="/analytics">
                    Review progress
                </Link>
            </div>
            
            <div className="mt-12 grid gap-4 text-[rgb(var(--ink-body))] sm:grid-cols-3">
              <div className="surface-muted px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--accent))]">Data model</p>
                <p className="mt-2 text-sm font-semibold">Conversations, corrections, vocabulary.</p>
              </div>
              <div className="surface-muted px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--accent))]">Storage</p>
                <p className="mt-2 text-sm font-semibold">SQLite on-device with export options.</p>
              </div>
              <div className="surface-muted px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--accent))]">Audio</p>
                <p className="mt-2 text-sm font-semibold">Text-to-speech with optional autoplay.</p>
              </div>
            </div>
        </div>

        <div className="relative flex justify-center">
            <div className="surface-card animate-rise rounded-[160px_160px_32px_32px] p-8 w-full max-w-sm relative z-10 border border-white/60">
                <div className="text-center mb-8 mt-12">
                    <span className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--muted))]">Session Snapshot</span>
                    <h3 className="font-[family-name:var(--font-fraunces)] text-3xl mt-2 text-[rgb(var(--ink))]">Cafe in Madrid</h3>
                </div>
                <div className="space-y-4">
                    <div className="bg-[rgb(var(--background))] p-5 rounded-3xl">
                        <span className="text-xs font-bold text-[rgb(var(--accent))] uppercase tracking-wide block mb-1">Gentle correction</span>
                        <p className="text-[rgb(var(--ink-body))] line-through decoration-red-300 decoration-2">La problema</p>
                        <p className="font-[family-name:var(--font-fraunces)] text-xl text-[rgb(var(--ink))] mt-1">El problema</p>
                    </div>
                    <div className="bg-[rgb(var(--background))] p-5 rounded-3xl">
                        <span className="text-xs font-bold text-[rgb(var(--accent))] uppercase tracking-wide block mb-1">Tense update</span>
                        <p className="text-[rgb(var(--ink-body))] line-through decoration-red-300 decoration-2">Yo fui a trabajar</p>
                        <p className="font-[family-name:var(--font-fraunces)] text-xl text-[rgb(var(--ink))] mt-1">Yo iba a trabajar</p>
                    </div>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className="bg-[rgb(var(--background))] p-4 rounded-3xl text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--muted))]">Msgs</p>
                      <p className="font-[family-name:var(--font-fraunces)] text-2xl text-[rgb(var(--ink))] mt-1">{msgCount.value}</p>
                    </div>
                    <div className="bg-[rgb(var(--background))] p-4 rounded-3xl text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--muted))]">Fixes</p>
                      <p className="font-[family-name:var(--font-fraunces)] text-2xl text-[rgb(var(--ink))] mt-1">{corrCount.value}</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      <section className="space-y-12 max-w-4xl mx-auto text-center">
        <div className="space-y-4">
            <span className="inline-block px-4 py-2 bg-[rgb(var(--accent-warm))] text-[rgb(var(--accent-hover))] rounded-full text-sm font-bold w-max mb-2 mx-auto">Core modules</span>
            <h2 className="font-[family-name:var(--font-fraunces)] text-4xl md:text-5xl text-[rgb(var(--ink))]">Built for accountable practice.</h2>
            <p className="text-[rgb(var(--ink-body))] max-w-lg mx-auto text-lg">Every workflow emphasizes clarity, repeatability, and a gentle audit trail of what was corrected and why.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 text-left">
          {[
            {
              title: "Conversational Practice",
              detail: "Real-time corrections with alternate phrasing and recorded mistakes.",
              icon: "💬"
            },
            {
              title: "Scenario Library",
              detail: "Roleplay templates and custom prompts for focused practice.",
              icon: "🎭"
            },
            {
              title: "Learning Analytics",
              detail: "Trends across grammar, vocabulary, topics, and accuracy.",
              icon: "📈"
            },
          ].map((item) => (
            <div key={item.title} className="surface-card p-8 transition-transform hover:-translate-y-1">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-[family-name:var(--font-fraunces)] text-2xl mb-3 text-[rgb(var(--ink))]">{item.title}</h3>
              <p className="text-[rgb(var(--ink-body))] leading-relaxed font-medium">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card p-10 md:p-16 max-w-5xl mx-auto relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[rgb(var(--accent-soft))] rounded-full mix-blend-multiply blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 text-center mb-12 space-y-4 flex flex-col items-center">
            <span className="inline-block px-4 py-2 bg-[rgb(var(--accent-warm))] text-[rgb(var(--accent-hover))] rounded-full text-sm font-bold w-max mb-2">Workflow</span>
            <h2 className="font-[family-name:var(--font-fraunces)] text-4xl md:text-5xl text-[rgb(var(--ink))]">From session to study plan.</h2>
            <p className="text-[rgb(var(--ink-body))] max-w-lg mx-auto text-lg">Each conversation feeds analytics and optional flashcards without manual curation.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-4 relative z-10">
          {[
            "Start a chat with a scenario.",
            "Receive corrections and explanations.",
            "Review analytics and filters.",
            "Export flashcards to Mochi.",
          ].map((step, index) => (
            <div key={step} className="surface-muted p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-[rgb(var(--accent-warm))] text-[rgb(var(--accent-hover))] flex items-center justify-center font-bold text-xl mb-4">
                {index + 1}
              </div>
              <p className="text-[rgb(var(--ink-body))] font-semibold">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}