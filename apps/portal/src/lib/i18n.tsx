"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { DICTIONARY, type Locale, type TranslationDictionary } from "./i18nDict";
import { translateRoText, translateRoToRu, translateRoToEn, recoverRoText } from "./autoTranslate";

export type { Locale, TranslationDictionary };
export { translateRoToRu, translateRoToEn, recoverRoText };

type I18nContextType = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, fallback?: string) => string;
  dict: TranslationDictionary;
};

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "brio_locale";

function isValidLocale(val: string | null | undefined): val is Locale {
  return val === "ro" || val === "ru" || val === "en";
}

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "ro";
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (isValidLocale(item)) return item;
    const cookieMatch = document.cookie.match(/(?:^|;\s*)brio_locale=(ro|ru|en)/);
    if (isValidLocale(cookieMatch?.[1])) {
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

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "CODE", "KBD", "NOSCRIPT"]);
const TRANSLATABLE_ATTRS = ["placeholder", "title", "aria-label"] as const;

type NodeTranslations = {
  ro: string;
  ru: string;
  en: string;
};

const globalForI18n = globalThis as unknown as {
  __brioTextNodeState?: WeakMap<Text, NodeTranslations>;
  __brioElementAttrState?: WeakMap<Element, Record<string, NodeTranslations>>;
};

const textNodeState =
  globalForI18n.__brioTextNodeState ??
  (globalForI18n.__brioTextNodeState = new WeakMap<Text, NodeTranslations>());
const elementAttrState =
  globalForI18n.__brioElementAttrState ??
  (globalForI18n.__brioElementAttrState = new WeakMap<
    Element,
    Record<string, NodeTranslations>
  >());

function shouldSkipElement(el: Element | null): boolean {
  if (!el) return true;
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.closest("[data-no-translate='true']")) return true;
  return false;
}

function resolveTranslations(current: string, saved?: NodeTranslations): NodeTranslations {
  // Recover the original Romanian source either from saved state or reverse lookup
  const ro =
    saved && (current === saved.ro || current === saved.ru || current === saved.en)
      ? saved.ro
      : recoverRoText(current);
  return {
    ro,
    ru: translateRoText(ro, "ru"),
    en: translateRoText(ro, "en"),
  };
}

function processTextNode(node: Text, locale: Locale) {
  if (shouldSkipElement(node.parentElement) || node.parentElement?.tagName === "TEXTAREA") return;
  const current = node.data;
  const trimmed = current ? current.trim() : "";
  if (!trimmed) return;

  // Never translate single-letter initials inside avatar badges (flex items-center justify-center rounded-*)
  if (trimmed.length === 1 && /^[A-Z]$/.test(trimmed)) {
    const cls = typeof node.parentElement?.className === "string" ? node.parentElement.className : "";
    if (cls.includes("justify-center") && cls.includes("rounded-")) {
      return;
    }
  }

  const saved = textNodeState.get(node);
  const entry = resolveTranslations(current, saved);

  // Only store if at least one translation differs from ro
  if (entry.ru !== entry.ro || entry.en !== entry.ro) {
    textNodeState.set(node, entry);
    const target = entry[locale];
    if (node.data !== target) {
      node.data = target;
    }
  }
}

function processElementAttributes(el: Element, locale: Locale) {
  if (shouldSkipElement(el)) return;
  let record = elementAttrState.get(el);

  for (const attr of TRANSLATABLE_ATTRS) {
    const current = el.getAttribute(attr);
    if (!current || !current.trim()) continue;

    const saved = record?.[attr];
    const entry = resolveTranslations(current, saved);

    if (entry.ru !== entry.ro || entry.en !== entry.ro) {
      if (!record) {
        record = {};
        elementAttrState.set(el, record);
      }
      record[attr] = entry;
      const target = entry[locale];
      if (el.getAttribute(attr) !== target) {
        el.setAttribute(attr, target);
      }
    }
  }
}

function translateSubtree(root: Node, locale: Locale) {
  if (root.nodeType === Node.TEXT_NODE) {
    processTextNode(root as Text, locale);
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) {
    return;
  }

  if (root.nodeType === Node.ELEMENT_NODE) {
    processElementAttributes(root as Element, locale);
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
  );

  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      processTextNode(current as Text, locale);
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      processElementAttributes(current as Element, locale);
    }
    current = walker.nextNode();
  }
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

  // Automatic DOM translation sync for RO <-> RU <-> EN across the entire portal
  useEffect(() => {
    if (typeof document === "undefined" || !document.body) return;

    document.documentElement.lang = locale;
    translateSubtree(document.body, locale);

    if (locale === "ro") return;

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
          processTextNode(m.target as Text, locale);
        } else if (m.type === "attributes" && m.target.nodeType === Node.ELEMENT_NODE) {
          processElementAttributes(m.target as Element, locale);
        } else if (m.type === "childList") {
          for (const added of Array.from(m.addedNodes)) {
            translateSubtree(added, locale);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });

    return () => observer.disconnect();
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const dict = useMemo(() => DICTIONARY[locale] ?? DICTIONARY.ro, [locale]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const val = translate(dict, key, fallback);
      if (locale !== "ro" && val === fallback && fallback) {
        return translateRoText(fallback, locale);
      }
      return val;
    },
    [dict, locale],
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
