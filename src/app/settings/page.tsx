import { SettingsForm } from "@/components/settings/settings-form";

const toggles = [
  { label: "Auto-play tutor audio", detail: "Enable TTS playback by default." },
  { label: "Save chat transcripts", detail: "Store sessions locally." },
  { label: "Show inline corrections", detail: "Highlight mistakes inside messages." },
];

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="eyebrow">Settings</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Configuration and storage.
        </h1>
        <p className="text-sm text-[rgb(var(--muted))] sm:text-base">
          Palabrero runs locally. Configure your API keys below and control how
          data is stored on device.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card p-6">
          <p className="eyebrow">API access</p>
          <p className="mt-3 text-sm text-[rgb(var(--muted))]">
            API keys are stored locally in SQLite and never leave your machine.
            Choose your preferred AI provider below.
          </p>
          <div className="mt-6">
            <SettingsForm />
          </div>
        </div>

        <div className="surface-card p-6">
          <p className="eyebrow">Audio</p>
          <p className="mt-3 text-sm text-[rgb(var(--muted))]">
            Text-to-speech is optional. Audio clips are cached locally once
            generated.
          </p>
          <div className="mt-5 space-y-3 text-sm">
            {toggles.slice(0, 1).map((toggle) => (
              <div
                key={toggle.label}
                className="surface-muted flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{toggle.label}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {toggle.detail}
                  </p>
                </div>
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
                  Coming soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card p-6">
          <p className="eyebrow">Data storage</p>
          <p className="mt-3 text-sm text-[rgb(var(--muted))]">
            Conversation history, corrections, and vocabulary are stored in
            SQLite. Exports are available from Analytics.
          </p>
          <div className="mt-5 space-y-3 text-sm">
            {toggles.slice(1).map((toggle) => (
              <div
                key={toggle.label}
                className="surface-muted flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{toggle.label}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {toggle.detail}
                  </p>
                </div>
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
                  Coming soon
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-6">
          <p className="eyebrow">Maintenance</p>
          <p className="mt-3 text-sm text-[rgb(var(--muted))]">
            Export or reset local data. These actions are manual for safety.
          </p>
          <div className="mt-5 space-y-3 text-sm">
            {[
              "Export database",
              "Backup scenarios",
              "Clear local cache",
            ].map((action) => (
              <div
                key={action}
                className="surface-muted flex items-center justify-between px-4 py-3"
              >
                <span>{action}</span>
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
                  Coming soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
