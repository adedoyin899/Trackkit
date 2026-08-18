"use client";

import { useTheme, type Theme } from "@/lib/theme-context";
import { Sun, Moon, Desktop } from "@phosphor-icons/react";

interface ThemeToggleProps {
  variant?: "icon" | "full";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const toggleNext = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  if (variant === "full") {
    return (
      <div className={`flex items-center gap-1 rounded-buttons bg-[var(--surface-card-secondary)] p-1 border border-[var(--border-hairline)] ${className}`}>
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-pills px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
            theme === "light"
              ? "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
          }`}
          title="Light theme"
        >
          <Sun size={16} /> Light
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-pills px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
            theme === "dark"
              ? "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
          }`}
          title="Dark theme"
        >
          <Moon size={16} /> Dark
        </button>
        <button
          type="button"
          onClick={() => setTheme("system")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-pills px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
            theme === "system"
              ? "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
          }`}
          title="System default theme"
        >
          <Desktop size={16} /> Auto
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleNext}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-card-secondary)] text-[var(--text-heading)] border border-[var(--border-hairline)] hover:opacity-80 transition-all cursor-pointer ${className}`}
      title={`Current: ${theme} (${resolvedTheme} mode active). Click to toggle.`}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Moon size={18} className="text-sky-blue" />
      ) : (
        <Sun size={18} className="text-gold" />
      )}
    </button>
  );
}
