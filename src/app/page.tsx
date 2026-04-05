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
                Your personal <br/><i className="text-[rgb(var(--accent))]">language</i> lab.
            </h1>
            <p className="text-lg text-[rgb(var(--ink-body))] max-w-md leading-relaxed mb-10">
                A private, conversational workspace to practice Spanish. Make mistakes, learn from gentle corrections, and track your progress without leaving your device.
            </p>
            <div className="flex flex-wrap gap-4">
                <Link className="btn-primary" href="/chat">
                    Start chatting
                </Link>
                <Link className="btn-secondary" href="/analytics">
                    View insights
                </Link>
            </div>
            
            <div className="mt-12 grid gap-4 text-[rgb(var(--ink-body))] sm:grid-cols-3">
              <div className="surface-muted px-5 py-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[rgb(var(--accent))]">Local</p>
                <p className="mt-2 text-sm font-semibold">100% on-device SQLite storage.</p>
              </div>
              <div className="surface-muted px-5 py-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[rgb(var(--accent))]">Private</p>
                <p className="mt-2 text-sm font-semibold">No accounts. Bring your own key.</p>
              </div>
              <div className="surface-muted px-5 py-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[rgb(var(--accent))]">Focused</p>
                <p className="mt-2 text-sm font-semibold">No gamification, just real practice.</p>
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
            <span className="inline-block px-4 py-2 bg-[rgb(var(--accent-warm))] text-[rgb(var(--accent-hover))] rounded-full text-sm font-bold w-max mb-2 mx-auto">Core features</span>
            <h2 className="font-[family-name:var(--font-fraunces)] text-4xl md:text-5xl text-[rgb(var(--ink))]">Practice with purpose.</h2>
            <p className="text-[rgb(var(--ink-body))] max-w-lg mx-auto text-lg">Built to capture the nuances of conversational learning, providing a clear audit trail of what was corrected and why.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 text-left">
          {[
            {
              title: "Conversational Practice",
              detail: "Engage in real-time dialogue with gentle corrections and alternate phrasing.",
              icon: "💬"
            },
            {
              title: "Insightful Analytics",
              detail: "Track your most frequent grammar mistakes and tense usage over time.",
              icon: "📈"
            },
            {
              title: "Passive Vocabulary",
              detail: "Automatically captures new words from sessions to review later.",
              icon: "📚"
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
            <h2 className="font-[family-name:var(--font-fraunces)] text-4xl md:text-5xl text-[rgb(var(--ink))]">No gamification. Just learning.</h2>
            <p className="text-[rgb(var(--ink-body))] max-w-lg mx-auto text-lg">Conversations feed directly into your personal insights and vocabulary list.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 relative z-10">
          {[
            "Select a scenario and start chatting.",
            "Receive inline grammar and tense corrections.",
            "Review your personal learning insights.",
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
