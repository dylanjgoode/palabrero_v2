"use client";

import { useEffect, useState } from "react";

type Provider = "openai" | "gemini";

type FormState = {
  openai_api_key: string;
  google_api_key: string;
  ai_provider: Provider;
};

export function SettingsForm() {
  const [form, setForm] = useState<FormState>({
    openai_api_key: "",
    google_api_key: "",
    ai_provider: "openai",
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, "saved" | "error" | undefined>>({});

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          openai_api_key: data.openai_api_key || "",
          google_api_key: data.google_api_key || "",
          ai_provider: data.ai_provider || "openai",
        }));
      })
      .catch(console.error);
  }, []);

  const saveField = async (key: keyof FormState, value: string) => {
    setSaving(key);
    setStatus((prev) => ({ ...prev, [key]: undefined }));

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      if (res.ok) {
        setStatus((prev) => ({ ...prev, [key]: "saved" }));
        setTimeout(() => setStatus((prev) => ({ ...prev, [key]: undefined })), 2000);
      } else {
        setStatus((prev) => ({ ...prev, [key]: "error" }));
      }
    } catch {
      setStatus((prev) => ({ ...prev, [key]: "error" }));
    } finally {
      setSaving(null);
    }
  };

  const handleKeyBlur = (key: "openai_api_key" | "google_api_key") => {
    const value = form[key];
    // Only save if it looks like a new key (not masked)
    if (value && !value.includes("...")) {
      saveField(key, value);
    }
  };

  const handleProviderChange = (provider: Provider) => {
    setForm((prev) => ({ ...prev, ai_provider: provider }));
    saveField("ai_provider", provider);
  };

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">AI Provider</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleProviderChange("openai")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              form.ai_provider === "openai"
                ? "bg-[rgb(var(--accent))] text-white"
                : "surface-muted hover:bg-[rgb(var(--muted)/0.2)]"
            }`}
          >
            OpenAI
          </button>
          <button
            type="button"
            onClick={() => handleProviderChange("gemini")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              form.ai_provider === "gemini"
                ? "bg-[rgb(var(--accent))] text-white"
                : "surface-muted hover:bg-[rgb(var(--muted)/0.2)]"
            }`}
          >
            Google Gemini
          </button>
        </div>
        {status.ai_provider === "saved" && (
          <p className="mt-2 text-xs text-green-600">Provider saved</p>
        )}
      </div>

      {/* OpenAI API Key */}
      <div>
        <label htmlFor="openai-key" className="block text-sm font-medium mb-2">
          OpenAI API Key
        </label>
        <div className="flex gap-2">
          <input
            id="openai-key"
            type="password"
            value={form.openai_api_key}
            onChange={(e) => setForm((prev) => ({ ...prev, openai_api_key: e.target.value }))}
            onBlur={() => handleKeyBlur("openai_api_key")}
            placeholder="sk-..."
            className="flex-1 px-3 py-2 text-sm surface-muted rounded-md border border-transparent focus:border-[rgb(var(--accent))] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleKeyBlur("openai_api_key")}
            disabled={saving === "openai_api_key"}
            className="btn-secondary px-4"
          >
            {saving === "openai_api_key" ? "Saving..." : "Save"}
          </button>
        </div>
        {status.openai_api_key === "saved" && (
          <p className="mt-2 text-xs text-green-600">API key saved</p>
        )}
        {status.openai_api_key === "error" && (
          <p className="mt-2 text-xs text-red-600">Failed to save</p>
        )}
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">
          Get your key at{" "}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            platform.openai.com
          </a>
        </p>
      </div>

      {/* Google API Key */}
      <div>
        <label htmlFor="google-key" className="block text-sm font-medium mb-2">
          Google API Key
        </label>
        <div className="flex gap-2">
          <input
            id="google-key"
            type="password"
            value={form.google_api_key}
            onChange={(e) => setForm((prev) => ({ ...prev, google_api_key: e.target.value }))}
            onBlur={() => handleKeyBlur("google_api_key")}
            placeholder="AIza..."
            className="flex-1 px-3 py-2 text-sm surface-muted rounded-md border border-transparent focus:border-[rgb(var(--accent))] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleKeyBlur("google_api_key")}
            disabled={saving === "google_api_key"}
            className="btn-secondary px-4"
          >
            {saving === "google_api_key" ? "Saving..." : "Save"}
          </button>
        </div>
        {status.google_api_key === "saved" && (
          <p className="mt-2 text-xs text-green-600">API key saved</p>
        )}
        {status.google_api_key === "error" && (
          <p className="mt-2 text-xs text-red-600">Failed to save</p>
        )}
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">
          Get your key at{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            aistudio.google.com
          </a>
        </p>
      </div>
    </div>
  );
}
