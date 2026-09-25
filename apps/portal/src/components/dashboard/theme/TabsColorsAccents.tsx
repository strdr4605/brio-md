"use client";

import { BrioThemeConfig, CategoryType } from "./themeTypes";
import { COLOR_PRESETS, ACCENT_PRESETS } from "./themePresets";

type TabsColorsAccentsProps = {
  theme: BrioThemeConfig;
  activeColorCategory: "Toate" | CategoryType;
  onSelectCategory: (cat: "Toate" | CategoryType) => void;
  onUpdateTheme: (updates: Partial<BrioThemeConfig>, name?: string) => void;
};

export function TabsColorsAccents({
  theme,
  activeColorCategory,
  onSelectCategory,
  onUpdateTheme,
}: TabsColorsAccentsProps) {
  const filteredColors =
    activeColorCategory === "Toate"
      ? COLOR_PRESETS
      : COLOR_PRESETS.filter((p) => p.category === activeColorCategory);

  return (
    <div className="space-y-3.5 max-h-64 overflow-y-auto p-0.5 scrollbar-thin">
      {/* 1. Background Color Section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-black text-slate-800">1. Culoare Fundal</label>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[9px] font-bold">
            {(["Toate", "Luminos", "Pastel", "Întunecat"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-1.5 py-0.5 rounded transition ${
                  activeColorCategory === cat ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {filteredColors.map((c) => {
            const isSelected = theme.bg.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex + c.name}
                type="button"
                onClick={() => onUpdateTheme({ bg: c.hex }, c.name)}
                className={`flex flex-col items-center gap-1 p-1 rounded-xl border transition-all text-center cursor-pointer active:scale-95 ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 shadow-2xs"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div
                  className="w-full h-5 rounded-md border border-slate-300/80 shadow-2xs flex items-center justify-center"
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && (
                    <span className="text-[9px] font-black text-blue-600 bg-white/90 rounded-full px-1">✓</span>
                  )}
                </div>
                <span className="text-[9px] font-bold text-slate-700 truncate w-full">{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Hex input */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
          <label className="text-[10px] font-bold text-slate-400 shrink-0">Custom Hex:</label>
          <input
            type="color"
            value={theme.bg.startsWith("#") ? theme.bg : "#f8fafc"}
            onChange={(e) => onUpdateTheme({ bg: e.target.value }, "Culoare Custom")}
            className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
          />
          <input
            type="text"
            value={theme.bg}
            onChange={(e) => onUpdateTheme({ bg: e.target.value }, "Culoare Custom")}
            className="w-full text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-none uppercase"
          />
        </div>
      </div>

      {/* 2. Accent Color Section */}
      <div className="pt-2 border-t border-slate-100">
        <label className="text-xs font-black text-slate-800 block mb-1.5">
          2. Culoare Accent (Butoane, Tab-uri, Link-uri)
        </label>
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {ACCENT_PRESETS.map((acc) => {
            const isSelected = theme.accentColor.toLowerCase() === acc.hex.toLowerCase();
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => onUpdateTheme({ accentColor: acc.hex })}
                className={`flex items-center gap-1.5 p-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full shadow-2xs shrink-0 flex items-center justify-center text-[8px] text-white font-bold"
                  style={{ backgroundColor: acc.hex }}
                >
                  {isSelected && "✓"}
                </div>
                <span className="text-[9px] font-bold text-slate-700 truncate">{acc.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Accent input */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
          <label className="text-[10px] font-bold text-slate-400 shrink-0">Accent Hex:</label>
          <input
            type="color"
            value={theme.accentColor.startsWith("#") ? theme.accentColor : "#2563eb"}
            onChange={(e) => onUpdateTheme({ accentColor: e.target.value })}
            className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
          />
          <input
            type="text"
            value={theme.accentColor}
            onChange={(e) => onUpdateTheme({ accentColor: e.target.value })}
            className="w-full text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-none uppercase"
          />
        </div>
      </div>
    </div>
  );
}
