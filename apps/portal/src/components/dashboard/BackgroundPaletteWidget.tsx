"use client";

import { useState, useEffect, useCallback } from "react";
import { BrioThemeConfig, CategoryType } from "./theme/themeTypes";
import { DEFAULT_THEME, SHADOW_PRESETS, SURFACE_PRESETS, RADIUS_PRESETS, GLACIAL_SORA_THEME } from "./theme/themePresets";
import { getRandomTheme, applyThemeToDom } from "./theme/themeApplicator";
import { TabsColorsAccents } from "./theme/TabsColorsAccents";
import { TabsSurfacesShadows } from "./theme/TabsSurfacesShadows";
import { TabsDetailsAdvanced } from "./theme/TabsDetailsAdvanced";
import { TabsFontGallery } from "./theme/TabsFontGallery";
import { TabsObjectStyler } from "./theme/TabsObjectStyler";
import { ThemeStudioFooter } from "./theme/ThemeStudioFooter";
import { ElementInspectorOverlay } from "./theme/ElementInspectorOverlay";
import { PRESET_TARGETS, PresetTarget, ObjectStylesMap, ElementCustomStyle } from "./theme/objectStylerTypes";
import { applyObjectStylesToDom, loadObjectStyles, saveObjectStyles } from "./theme/objectStylerApplicator";
import { FONT_COLLECTION, loadGoogleFont } from "./theme/fontsData";

type MainTabType = "colors" | "surfaces" | "details" | "fonts" | "objects";

export function BackgroundPaletteWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTabType>("colors");
  const [activeColorCategory, setActiveColorCategory] = useState<"Toate" | CategoryType>("Toate");
  const [theme, setTheme] = useState<BrioThemeConfig>(DEFAULT_THEME);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Object Customizer state
  const [selectedTarget, setSelectedTarget] = useState<PresetTarget>(PRESET_TARGETS[0]);
  const [isInspecting, setIsInspecting] = useState(false);
  const [objectStyles, setObjectStyles] = useState<ObjectStylesMap>({});

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
          const merged: BrioThemeConfig = { ...DEFAULT_THEME, ...parsed };
          setTheme(merged);
          applyThemeToDom(merged);
        } catch {
          // ignore
        }
      } else {
        setTheme(DEFAULT_THEME);
        applyThemeToDom(DEFAULT_THEME);
      }

      // Load object-specific styles
      const savedObjectStyles = loadObjectStyles();
      setObjectStyles(savedObjectStyles);
      applyObjectStylesToDom(savedObjectStyles);
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

  const handleApplyPreset = (preset: BrioThemeConfig) => {
    setTheme(preset);
    applyThemeToDom(preset);
    localStorage.setItem("brio_custom_theme", JSON.stringify(preset));
    localStorage.setItem("brio_dashboard_bg", preset.bg);
    showToast(`⭐ ${preset.name || "Stil"} activat!`);
  };

  const handleUpdateObjectStyle = (targetId: string, updates: Partial<ElementCustomStyle>) => {
    setObjectStyles((prev) => {
      const nextMap = {
        ...prev,
        [targetId]: { ...prev[targetId], ...updates },
      };
      applyObjectStylesToDom(nextMap);
      saveObjectStyles(nextMap);
      return nextMap;
    });
  };

  const handleResetObjectTarget = (targetId: string) => {
    setObjectStyles((prev) => {
      const nextMap = { ...prev };
      delete nextMap[targetId];
      applyObjectStylesToDom(nextMap);
      saveObjectStyles(nextMap);
      return nextMap;
    });
    showToast("Stil obiect resetat");
  };

  const handleResetAllObjectTargets = () => {
    setObjectStyles({});
    applyObjectStylesToDom({});
    saveObjectStyles({});
    showToast("Toate obiectele resetate");
  };

  const handleInspectSelect = (target: PresetTarget) => {
    setSelectedTarget(target);
    setIsInspecting(false);
    setActiveTab("objects");
    setIsOpen(true);
    showToast(`🎯 Selectat: ${target.name}`);
  };

  const handleRandomize = () => {
    const rolled = getRandomTheme();
    if (Math.random() > 0.3) {
      const randomFont = FONT_COLLECTION[Math.floor(Math.random() * FONT_COLLECTION.length)];
      loadGoogleFont(randomFont.name);
      rolled.fontName = randomFont.name;
      rolled.fontId = "custom_font";
    }
    setTheme(rolled);
    applyThemeToDom(rolled);
    localStorage.setItem("brio_custom_theme", JSON.stringify(rolled));
    localStorage.setItem("brio_dashboard_bg", rolled.bg);
    showToast(`✨ ${rolled.name || "Stil Nou"} (${rolled.fontName || "Inter"})!`);
  };

  const handleReset = () => {
    handleApplyPreset(GLACIAL_SORA_THEME);
  };

  const handleCopyCss = async () => {
    const currentShadow = SHADOW_PRESETS.find((s) => s.id === theme.shadowId)?.value || "none";
    const currentSurface = SURFACE_PRESETS.find((s) => s.id === theme.surfaceId);
    const currentRadius = RADIUS_PRESETS.find((r) => r.id === theme.radiusId)?.radius || "1rem";

    const css = [
      `/* Brio Theme: ${theme.name || "Personalizat"} */`,
      `--dashboard-bg: ${theme.bg};`,
      `--accent-color: ${theme.accentColor};`,
      `--card-bg: ${currentSurface?.bg};`,
      `--card-blur: ${currentSurface?.blur};`,
      `--card-shadow: ${currentShadow};`,
      `--card-radius: ${currentRadius};`,
      `--font-family: "${theme.fontName || "Inter"}", sans-serif;`,
      `--pattern: ${theme.patternId};`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(css);
      showToast("📋 CSS copiat!");
    } catch {
      showToast("Eroare la copiere");
    }
  };

  return (
    <>
      {/* Live Element Inspector Overlay */}
      <ElementInspectorOverlay
        isActive={isInspecting}
        onSelect={handleInspectSelect}
        onCancel={() => setIsInspecting(false)}
      />

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
          title="Personalizează stilul, fonturile și obiectele"
        >
          <span className="text-base group-hover:rotate-12 transition-transform">🎨</span>
          <span className="text-xs font-black tracking-tight hidden sm:inline">Stil Studio</span>
          <div className="flex items-center gap-1">
            <span
              className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
              style={{ backgroundColor: theme.bg }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs -ml-1.5"
              style={{ backgroundColor: theme.accentColor }}
            />
          </div>
        </button>
      </div>

      {/* Floating Theme Customizer Popover */}
      {isOpen && (
        <div
          id="theme-palette-modal"
          className="fixed bottom-18 right-5 z-50 w-88 sm:w-98 bg-white/98 backdrop-blur-2xl rounded-2xl border border-slate-200/90 shadow-2xl p-4 text-slate-800 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎨</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Studio Personalizare
                  </h3>
                  {theme.name && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 truncate max-w-[130px]">
                      {theme.name}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">110+ fonturi, culori, efecte și obiecte</p>
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

          {/* 5 Main Navigation Tabs */}
          <div className="flex items-center gap-1 my-2.5 bg-slate-100/90 p-1 rounded-xl text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("colors")}
              className={`flex-1 py-1 rounded-lg transition ${
                activeTab === "colors" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🎨 Culori
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("surfaces")}
              className={`flex-1 py-1 rounded-lg transition ${
                activeTab === "surfaces" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🪟 Carduri
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`flex-1 py-1 rounded-lg transition ${
                activeTab === "details" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              ✨ Efecte
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("fonts")}
              className={`flex-1 py-1 rounded-lg transition ${
                activeTab === "fonts" ? "bg-indigo-600 text-white shadow-2xs" : "text-indigo-600 hover:text-indigo-800"
              }`}
            >
              🔤 Fonturi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("objects")}
              className={`flex-1 py-1 rounded-lg transition ${
                activeTab === "objects" ? "bg-blue-600 text-white shadow-2xs" : "text-blue-600 hover:text-blue-800"
              }`}
            >
              🎯 Obiecte
            </button>
          </div>

          {/* Tab 1: Background & Accent Colors */}
          {activeTab === "colors" && (
            <TabsColorsAccents
              theme={theme}
              activeColorCategory={activeColorCategory}
              onSelectCategory={setActiveColorCategory}
              onUpdateTheme={updateTheme}
            />
          )}

          {/* Tab 2: Shadows, Surfaces, Radius, Borders */}
          {activeTab === "surfaces" && (
            <TabsSurfacesShadows theme={theme} onUpdateTheme={updateTheme} />
          )}

          {/* Tab 3: Patterns, Fonts, Hover, Density, Header Glass */}
          {activeTab === "details" && (
            <TabsDetailsAdvanced theme={theme} onUpdateTheme={updateTheme} />
          )}

          {/* Tab 4: 110+ Google Fonts Gallery */}
          {activeTab === "fonts" && (
            <TabsFontGallery
              theme={theme}
              onUpdateTheme={updateTheme}
              onShowToast={showToast}
            />
          )}

          {/* Tab 5: Object Styler & Inspector */}
          {activeTab === "objects" && (
            <TabsObjectStyler
              selectedTarget={selectedTarget}
              onSelectTarget={setSelectedTarget}
              stylesMap={objectStyles}
              onUpdateStyle={handleUpdateObjectStyle}
              onResetTarget={handleResetObjectTarget}
              onResetAllTargets={handleResetAllObjectTargets}
              onStartInspect={() => {
                setIsInspecting(true);
                setIsOpen(false);
              }}
              onShowToast={showToast}
            />
          )}

          {/* Footer Controls: Quick Favorite, Randomize, Copy CSS, Reset */}
          <ThemeStudioFooter
            theme={theme}
            onRandomize={handleRandomize}
            onCopyCss={handleCopyCss}
            onReset={handleReset}
            onApplyPreset={handleApplyPreset}
          />
        </div>
      )}
    </>
  );
}
