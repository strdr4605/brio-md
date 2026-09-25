"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BrioThemeConfig,
  SHADOW_PRESETS,
  SURFACE_PRESETS,
  RADIUS_PRESETS,
  DEFAULT_THEME,
  getRandomTheme,
  applyThemeToDom,
  CategoryType,
} from "./themePresets";
import {
  ColorsTab,
  ShadowsTab,
  SurfacesTab,
  RadiusTab,
} from "./ThemeStudioTabs";

type TabType = "colors" | "shadows" | "surfaces" | "radius";

export function BackgroundPaletteWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("colors");
  const [activeColorCategory, setActiveColorCategory] = useState<"Toate" | CategoryType>("Toate");
  const [theme, setTheme] = useState<BrioThemeConfig>(DEFAULT_THEME);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    const timer = setTimeout(() => setToastMessage(null), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("brio_custom_theme");
      if (savedTheme) {
        try {
          const parsed = JSON.parse(savedTheme) as BrioThemeConfig;
          setTheme(parsed);
          applyThemeToDom(parsed);
          return;
        } catch {
          // ignore parsing error
        }
      }
      const legacyBg = localStorage.getItem("brio_dashboard_bg");
      if (legacyBg) {
        const initial = { ...DEFAULT_THEME, bg: legacyBg };
        setTheme(initial);
        applyThemeToDom(initial);
      }
    }
  }, []);

  const updateTheme = (updates: Partial<BrioThemeConfig>, customName?: string) => {
    setTheme((prev) => {
      const next: BrioThemeConfig = {
        ...prev,
        ...updates,
        name: customName ?? updates.name ?? "Personalizat",
      };
      applyThemeToDom(next);
      localStorage.setItem("brio_custom_theme", JSON.stringify(next));
      localStorage.setItem("brio_dashboard_bg", next.bg);
      return next;
    });
  };

  const handleRandomize = () => {
    const rolled = getRandomTheme();
    setTheme(rolled);
    applyThemeToDom(rolled);
    localStorage.setItem("brio_custom_theme", JSON.stringify(rolled));
    localStorage.setItem("brio_dashboard_bg", rolled.bg);
    showToast(`✨ ${rolled.name || "Stil Nou"}!`);
  };

  const handleReset = () => {
    setTheme(DEFAULT_THEME);
    applyThemeToDom(DEFAULT_THEME);
    localStorage.removeItem("brio_custom_theme");
    localStorage.removeItem("brio_dashboard_bg");
    showToast("Revenit la Brio Implicit");
  };

  const handleCopyCss = async () => {
    const currentShadow = SHADOW_PRESETS.find((s) => s.id === theme.shadowId)?.value || "none";
    const currentSurface = SURFACE_PRESETS.find((s) => s.id === theme.surfaceId);
    const currentRadius = RADIUS_PRESETS.find((r) => r.id === theme.radiusId)?.radius || "1rem";

    const css = `/* Brio Theme: ${theme.name || "Personalizat"} */\n--dashboard-bg: ${theme.bg};\n--card-bg: ${currentSurface?.bg};\n--card-blur: ${currentSurface?.blur};\n--card-shadow: ${currentShadow};\n--card-radius: ${currentRadius};`;
    try {
      await navigator.clipboard.writeText(css);
      showToast("📋 CSS copiat!");
    } catch {
      showToast("Eroare la copiere");
    }
  };

  return (
    <>
      {/* Floating Widget Trigger */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl shadow-xl border transition-all active:scale-95 group cursor-pointer ${
            isOpen
              ? "bg-slate-900 text-white border-slate-900 ring-4 ring-blue-500/20"
              : "bg-white/95 text-slate-800 border-slate-200/90 hover:bg-white hover:border-blue-400 backdrop-blur-md"
          }`}
          title="Personalizează stilul, culorile și umbrele"
        >
          <span className="text-base group-hover:rotate-12 transition-transform">🎨</span>
          <span className="text-xs font-black tracking-tight hidden sm:inline">
            Stil Studio
          </span>
          <span
            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
            style={{ backgroundColor: theme.bg }}
          />
        </button>
      </div>

      {/* Floating Theme Customizer Popover */}
      {isOpen && (
        <div
          id="theme-palette-modal"
          className="fixed bottom-18 right-5 z-50 w-84 sm:w-92 bg-white/98 backdrop-blur-2xl rounded-2xl border border-slate-200/90 shadow-2xl p-4 text-slate-800 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎨</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Studio Stil
                  </h3>
                  {theme.name && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 truncate max-w-[120px]">
                      {theme.name}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Alege aspectul ideal pentru dashboard</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="mt-2 py-1 px-2.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg text-center shadow-md animate-fade-in">
              {toastMessage}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 my-3 bg-slate-100/90 p-1 rounded-xl text-[11px] font-bold">
            {(
              [
                { id: "colors", label: "🎨 Culoare" },
                { id: "shadows", label: "☁️ Umbre" },
                { id: "surfaces", label: "🪟 Carduri" },
                { id: "radius", label: "📐 Colțuri" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1 rounded-lg transition ${
                  activeTab === tab.id ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          {activeTab === "colors" && (
            <ColorsTab
              theme={theme}
              activeColorCategory={activeColorCategory}
              onSelectCategory={setActiveColorCategory}
              onUpdateTheme={updateTheme}
            />
          )}

          {activeTab === "shadows" && (
            <ShadowsTab theme={theme} onUpdateTheme={updateTheme} />
          )}

          {activeTab === "surfaces" && (
            <SurfacesTab theme={theme} onUpdateTheme={updateTheme} />
          )}

          {activeTab === "radius" && (
            <RadiusTab theme={theme} onUpdateTheme={updateTheme} />
          )}

          {/* Footer Controls: Randomize, Copy CSS, Reset */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleRandomize}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs font-black shadow-md hover:shadow-indigo-500/25 hover:opacity-95 transition active:scale-95 cursor-pointer"
              title="Generează un stil aleator coordonat"
            >
              <span>🎲</span>
              <span>Random</span>
            </button>
            <button
              type="button"
              onClick={handleCopyCss}
              className="py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 transition active:scale-95 cursor-pointer"
              title="Copiază variabilele CSS în clipboard"
            >
              📋 CSS
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:text-slate-800 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
              title="Revino la stilul implicit"
            >
              ↺ Reset
            </button>
          </div>
        </div>
      )}
    </>
  );
}
