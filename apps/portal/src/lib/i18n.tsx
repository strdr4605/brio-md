"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { DICTIONARY, type Locale, type TranslationDictionary } from "./i18nDict";

export type { Locale, TranslationDictionary };

type I18nContextType = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, fallback?: string) => string;
  dict: TranslationDictionary;
};

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "brio_locale";

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "ro";
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (item === "ro" || item === "ru") return item;
    const cookieMatch = document.cookie.match(/(?:^|;\s*)brio_locale=(ro|ru)/);
    if (cookieMatch?.[1] === "ro" || cookieMatch?.[1] === "ru") {
      return cookieMatch[1];
    }
  } catch {
    // Return default on storage access error
  }
  return "ro";
}

function persistLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
    document.cookie = `brio_locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // Silently continue if storage is restricted
  }
}

export function translate(dict: any, key: string, fallback?: string): string {
  if (!key) return fallback || "";
  const parts = key.split(".");
  let cur = dict;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") {
      return fallback !== undefined ? fallback : key;
    }
    cur = cur[part];
  }
  return typeof cur === "string" ? cur : fallback !== undefined ? fallback : key;
}

export function I18nProvider({
  children,
  defaultLocale = "ro",
}: {
  children: React.ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const saved = getStoredLocale();
    if (saved !== defaultLocale) {
      setLocaleState(saved);
    }
  }, [defaultLocale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const dict = useMemo(() => DICTIONARY[locale], [locale]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return translate(dict, key, fallback);
    },
    [dict],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      dict,
    }),
    [locale, setLocale, t, dict],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    // Safe fallback if used outside provider (e.g. isolated test or SSR)
    const fallbackDict = DICTIONARY.ro;
    return {
      locale: "ro",
      setLocale: () => {},
      t: (key: string, fallback?: string) => translate(fallbackDict, key, fallback),
      dict: fallbackDict,
    };
  }
  return context;
}
