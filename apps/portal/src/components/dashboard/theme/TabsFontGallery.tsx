"use client";

import { useState, useMemo } from "react";
import { BrioThemeConfig } from "./themeTypes";
import { FONT_COLLECTION, FontCategory, loadGoogleFont } from "./fontsData";

type TabsFontGalleryProps = {
  theme: BrioThemeConfig;
  onUpdateTheme: (updates: Partial<BrioThemeConfig>, customName?: string) => void;
  onShowToast: (msg: string) => void;
};

const CATEGORIES: FontCategory[] = [
  "Toate",
  "Modern UI",
  "Clean Sans",
  "Serif & Lux",
  "Monospace",
  "Display Bold",
  "Handwriting",
  "Retro & Cyber",
];

export function TabsFontGallery({
  theme,
  onUpdateTheme,
  onShowToast,
}: TabsFontGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FontCategory>("Toate");

  const filteredFonts = useMemo(() => {
    return FONT_COLLECTION.filter((f) => {
      const matchesCat = activeCategory === "Toate" || f.category === activeCategory;
      const matchesSearch =
        !searchQuery.trim() || f.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleSelectFont = (fontName: string) => {
    loadGoogleFont(fontName);
    onUpdateTheme({ fontName, fontId: "custom_font" });
    onShowToast(`🔤 Font: ${fontName}`);
  };

  const handleRandomFont = () => {
    const randomIdx = Math.floor(Math.random() * FONT_COLLECTION.length);
    const chosen = FONT_COLLECTION[randomIdx];
    handleSelectFont(chosen.name);
  };

  const activeFontName = theme.fontName || "Inter";

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto p-0.5 scrollbar-thin">
      {/* 1. Active Font Banner & Randomizer */}
      <div className="bg-slate-50 border border-slate-200/90 p-2.5 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Font Curent Activ
            </div>
            <div
              className="text-sm font-black text-slate-900 truncate max-w-[200px]"
              style={{ fontFamily: `"${activeFontName}", sans-serif` }}
            >
              {activeFontName}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRandomFont}
            className="flex items-center gap-1.5 py-1 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-black shadow-xs transition active:scale-95 cursor-pointer"
            title="Alege un font aleator din colecția de 110+ fonturi"
          >
            <span>🎲</span>
            <span>Font Aleator</span>
          </button>
        </div>

        {/* Font Letter Spacing & Scale controls */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 text-[9px] font-bold text-slate-600">
          <span className="shrink-0 text-slate-400">Spațiere:</span>
          <div className="flex items-center gap-1">
            {["-0.5px", "0px", "0.5px", "1px"].map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => onUpdateTheme({ fontLetterSpacing: sp })}
                className={`px-1.5 py-0.5 rounded border transition ${
                  theme.fontLetterSpacing === sp
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {sp}
              </button>
            ))}
          </div>

          <span className="shrink-0 text-slate-400 ml-auto">Dimensiune:</span>
          <div className="flex items-center gap-1">
            {["95%", "100%", "105%"].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => onUpdateTheme({ fontSizeScale: sz })}
                className={`px-1.5 py-0.5 rounded border transition ${
                  theme.fontSizeScale === sz
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="space-y-1.5">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Caută printre ${FONT_COLLECTION.length} fonturi... (ex: Inter, Poppins, Mono, Serif)`}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
          />
          <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[9px] font-bold">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`py-0.5 px-2 rounded-lg border whitespace-nowrap transition cursor-pointer shrink-0 ${
                activeCategory === cat
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Font Swatches Grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {filteredFonts.map((f) => {
          const isSelected = activeFontName.toLowerCase() === f.name.toLowerCase();
          return (
            <button
              key={f.name}
              type="button"
              onMouseEnter={() => loadGoogleFont(f.name)}
              onClick={() => handleSelectFont(f.name)}
              className={`p-2 rounded-xl border text-left transition cursor-pointer active:scale-95 flex flex-col justify-between ${
                isSelected
                  ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-2xs"
                  : "border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-medium text-slate-400 truncate max-w-[110px]">
                  {f.category}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-black text-blue-600 bg-white rounded-full px-1">
                    ✓
                  </span>
                )}
              </div>
              <div
                className="text-sm font-bold text-slate-900 truncate"
                style={{ fontFamily: `"${f.name}", ${f.fallback}` }}
              >
                {f.name}
              </div>
              <div
                className="text-[10px] text-slate-500 truncate mt-0.5 opacity-80"
                style={{ fontFamily: `"${f.name}", ${f.fallback}` }}
              >
                Brio Portal 2026 Catalog
              </div>
            </button>
          );
        })}
      </div>

      {filteredFonts.length === 0 && (
        <div className="p-6 text-center text-slate-400 text-xs">
          Niciun font găsit pentru „{searchQuery}”. Încearcă alt termen!
        </div>
      )}
    </div>
  );
}
