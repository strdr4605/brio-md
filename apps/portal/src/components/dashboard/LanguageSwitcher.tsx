"use client";

import { useTranslation } from "@/lib/i18n";

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useTranslation();

  return (
    <div
      data-testid="language-switcher"
      role="group"
      aria-label="Schimbă limba / Выбор языка"
      className={`inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 shadow-2xs ${className}`}
    >
      <button
        type="button"
        onClick={() => setLocale("ro")}
        data-active={locale === "ro"}
        aria-pressed={locale === "ro"}
        className={`px-2.5 py-1 text-xs rounded-lg transition-all select-none ${
          locale === "ro"
            ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/60"
            : "text-slate-600 hover:text-slate-900 font-medium"
        }`}
        title="Română"
      >
        RO
      </button>
      <button
        type="button"
        onClick={() => setLocale("ru")}
        data-active={locale === "ru"}
        aria-pressed={locale === "ru"}
        className={`px-2.5 py-1 text-xs rounded-lg transition-all select-none ${
          locale === "ru"
            ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/60"
            : "text-slate-600 hover:text-slate-900 font-medium"
        }`}
        title="Русский"
      >
        RU
      </button>
    </div>
  );
}
