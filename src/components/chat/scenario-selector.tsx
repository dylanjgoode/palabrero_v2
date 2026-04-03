"use client";

import { useEffect, useRef, useState } from "react";

type Scenario = {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
};

type ScenarioSelectorProps = {
  scenarios: Scenario[];
  value: string;
  onChange: (id: string) => void;
};

export default function ScenarioSelector({
  scenarios,
  value,
  onChange,
}: ScenarioSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedScenario = scenarios.find((s) => s.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === "ArrowDown" && isOpen) {
      event.preventDefault();
      const currentIndex = scenarios.findIndex((s) => s.id === value);
      const nextIndex = (currentIndex + 1) % scenarios.length;
      onChange(scenarios[nextIndex].id);
    } else if (event.key === "ArrowUp" && isOpen) {
      event.preventDefault();
      const currentIndex = scenarios.findIndex((s) => s.id === value);
      const prevIndex =
        currentIndex <= 0 ? scenarios.length - 1 : currentIndex - 1;
      onChange(scenarios[prevIndex].id);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="scenario-listbox"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex min-w-0 sm:min-w-[200px] items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-2.5 text-left text-sm transition-all hover:border-black/20 hover:bg-white/95 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-soft))]"
      >
        <span className="font-medium">{selectedScenario?.name ?? "Select scenario"}</span>
        <svg
          className={`h-4 w-4 text-[rgb(var(--muted))] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <ul
          ref={listboxRef}
          id="scenario-listbox"
          role="listbox"
          aria-activedescendant={value}
          className="absolute left-0 top-full z-50 mt-2 w-[calc(100vw-3rem)] sm:w-72 overflow-hidden rounded-2xl border border-black/10 bg-white/95 p-2 shadow-lg backdrop-blur-xl"
        >
          {scenarios.map((scenario) => {
            const isSelected = scenario.id === value;
            return (
              <li
                key={scenario.id}
                id={scenario.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(scenario.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleSelect(scenario.id);
                  }
                }}
                tabIndex={0}
                className={`cursor-pointer rounded-xl px-3 py-3 transition-colors ${
                  isSelected
                    ? "bg-[rgb(var(--accent-soft))]"
                    : "hover:bg-black/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-[rgb(var(--accent))]" : ""
                    }`}
                  >
                    {scenario.name}
                  </span>
                  {isSelected && (
                    <svg
                      className="h-4 w-4 text-[rgb(var(--accent))]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">
                  {scenario.description}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
