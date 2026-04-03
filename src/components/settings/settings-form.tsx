"use client";

import { useEffect, useState } from "react";

type FormState = {
  google_api_key: string;
};

export function SettingsForm() {
  const [form, setForm] = useState<FormState>({
    google_api_key: "",
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, "saved" | "error" | undefined>>({});
  const [dirtyFields, setDirtyFields] = useState<Set<keyof FormState>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          google_api_key: data.google_api_key || "",
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
        setDirtyFields((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
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

  const markDirty = (key: keyof FormState) => {
    setDirtyFields((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const validateGoogleKey = (value: string): string | null => {
    if (!value) return null;
    if (!value.startsWith("AIza")) return "Invalid key format — Google API keys start with AIza";
    if (value.length < 35 || value.length > 45) return "Invalid key length — expected 39 characters";
    return null;
  };

  const handleKeyBlur = () => {
    const value = form.google_api_key;
    if (value && dirtyFields.has("google_api_key")) {
      const error = validateGoogleKey(value);
      if (error) {
        setValidationError(error);
        return;
      }
      setValidationError(null);
      saveField("google_api_key", value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google API Key */}
      <div>
        <label htmlFor="google-key" className="block text-sm font-medium mb-2">
          Google API Key
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="google-key"
            type="password"
            value={form.google_api_key}
            onChange={(e) => { markDirty("google_api_key"); setValidationError(null); setForm((prev) => ({ ...prev, google_api_key: e.target.value })); }}
            onBlur={handleKeyBlur}
            placeholder="AIza..."
            aria-describedby="google-key-help"
            className="flex-1 px-3 py-2 text-sm surface-muted rounded-md border border-transparent focus:border-[rgb(var(--accent))] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleKeyBlur}
            disabled={saving === "google_api_key"}
            className="btn-secondary px-4"
          >
            {saving === "google_api_key" ? "Saving..." : "Save"}
          </button>
        </div>
        {validationError && (
          <p className="mt-2 text-xs text-red-600">{validationError}</p>
        )}
        {status.google_api_key === "saved" && (
          <p className="mt-2 text-xs text-green-600">API key saved</p>
        )}
        {status.google_api_key === "error" && (
          <p className="mt-2 text-xs text-red-600">Failed to save</p>
        )}
        <p id="google-key-help" className="mt-2 text-xs text-[rgb(var(--muted))]">
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
