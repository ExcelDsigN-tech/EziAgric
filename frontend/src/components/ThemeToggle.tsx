"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
    >
      {isDark ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
    </button>
  );
}
