"use client";

import { BrioThemeConfig } from "./themeTypes";
import {
  PATTERN_PRESETS,
  FONT_PRESETS,
  HOVER_PRESETS,
  DENSITY_PRESETS,
} from "./themePresets";

type TabsDetailsAdvancedProps = {
  theme: BrioThemeConfig;
  onUpdateTheme: (updates: Partial<BrioThemeConfig>) => void;
};

export function TabsDetailsAdvanced({ theme, onUpdateTheme }: TabsDetailsAdvancedProps) {
  return (
    <div className="space-y-3.5 max-h-64 overflow-y-auto p-0.5 scrollbar-thin">
      {/* 1. Textură Fundal */}
      <div>
        <label className="text-xs font-black text-slate-800 block mb-1">
          1. Textură & Grilă Fundal (Background Pattern)
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {PATTERN_PRESETS.map((p) => {
            const isSelected = theme.patternId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onUpdateTheme({ patternId: p.id })}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition cursor-pointer active:scale-95 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-2xs"
                    : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <span className="text-base">{p.icon}</span>
                <span className="text-[10px] font-bold text-slate-800">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tipografie / Font */}
      <div className="pt-2 border-t border-slate-100">
        <label className="text-xs font-black text-slate-800 block mb-1">
          2. Stil Tipografie (Font Vibe)
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {FONT_PRESETS.map((f) => {
            const isSelected = theme.fontId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onUpdateTheme({ fontId: f.id })}
                className={`p-2 rounded-xl border text-left transition cursor-pointer active:scale-95 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="text-[11px] font-black text-slate-900" style={{ fontFamily: f.fontFamily }}>
                  {f.name} {isSelected && <span className="text-blue-600 font-bold">✓</span>}
                </div>
                <div className="text-[9px] text-slate-400" style={{ fontFamily: f.fontFamily }}>
                  {f.preview}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Hover Effect & Densitate */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-slate-700 block mb-1">Efect Hover Carduri:</label>
          <div className="space-y-1">
            {HOVER_PRESETS.map((h) => {
              const isSelected = theme.hoverId === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onUpdateTheme({ hoverId: h.id })}
                  className={`w-full py-1 px-2 rounded-lg border text-left text-[10px] font-bold transition flex items-center justify-between ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{h.name}</span>
                  {isSelected && <span>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-700 block mb-1">Densitate Spațiere:</label>
          <div className="space-y-1">
            {DENSITY_PRESETS.map((d) => {
              const isSelected = theme.densityId === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onUpdateTheme({ densityId: d.id })}
                  className={`w-full py-1 px-2 rounded-lg border text-left text-[10px] font-bold transition flex items-center justify-between ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{d.name}</span>
                  {isSelected && <span>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Header Glassmorphism Toggle */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-black text-slate-900">Header Glassmorphism</div>
          <div className="text-[9px] text-slate-400">Aplică efect de sticlă blurată pe bara de sus</div>
        </div>
        <button
          type="button"
          onClick={() => onUpdateTheme({ headerGlass: !theme.headerGlass })}
          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
            theme.headerGlass ? "bg-blue-600" : "bg-slate-300"
          }`}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 left-0.75 ${
              theme.headerGlass ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
