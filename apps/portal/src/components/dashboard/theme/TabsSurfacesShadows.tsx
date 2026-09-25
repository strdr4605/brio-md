"use client";

import { BrioThemeConfig } from "./themeTypes";
import {
  SHADOW_PRESETS,
  SURFACE_PRESETS,
  RADIUS_PRESETS,
  BORDER_WIDTH_PRESETS,
} from "./themePresets";

type TabsSurfacesShadowsProps = {
  theme: BrioThemeConfig;
  onUpdateTheme: (updates: Partial<BrioThemeConfig>) => void;
};

export function TabsSurfacesShadows({ theme, onUpdateTheme }: TabsSurfacesShadowsProps) {
  return (
    <div className="space-y-3 max-h-64 overflow-y-auto p-0.5 scrollbar-thin">
      {/* 1. Umbre */}
      <div>
        <label className="text-xs font-black text-slate-800 block mb-1">1. Stil Umbre (Shadows)</label>
        <div className="grid grid-cols-2 gap-1.5">
          {SHADOW_PRESETS.map((s) => {
            const isSelected = theme.shadowId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onUpdateTheme({ shadowId: s.id })}
                className={`flex items-center justify-between p-1.5 rounded-xl border text-left transition cursor-pointer active:scale-95 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="min-w-0 pr-1">
                  <div className="text-[11px] font-black text-slate-900 truncate">
                    {s.name} {isSelected && <span className="text-blue-600 font-bold">✓</span>}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">{s.description}</div>
                </div>
                <div
                  className="w-6 h-6 rounded-md bg-white border border-slate-200 shrink-0"
                  style={{ boxShadow: s.value }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Finisaj Suprafață (Glassmorphism) */}
      <div className="pt-2 border-t border-slate-100">
        <label className="text-xs font-black text-slate-800 block mb-1">
          2. Textură Carduri (Glassmorphism & Opacitate)
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {SURFACE_PRESETS.map((sf) => {
            const isSelected = theme.surfaceId === sf.id;
            return (
              <button
                key={sf.id}
                type="button"
                onClick={() => onUpdateTheme({ surfaceId: sf.id })}
                className={`flex items-center justify-between p-1.5 rounded-xl border text-left transition cursor-pointer active:scale-95 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="min-w-0 pr-1">
                  <div className="text-[11px] font-black text-slate-900 truncate">
                    {sf.name} {isSelected && <span className="text-blue-600 font-bold">✓</span>}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">{sf.description}</div>
                </div>
                <div
                  className="w-7 h-5 rounded border flex items-center justify-center shrink-0 shadow-2xs"
                  style={{
                    backgroundColor: sf.bg,
                    borderColor: sf.border,
                    backdropFilter: sf.blur,
                  }}
                >
                  <span className="text-[8px] font-bold text-slate-500">Aa</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Colțuri & Borduri */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-700 block mb-1">Rotunjire Colțuri:</label>
          <div className="grid grid-cols-4 gap-1">
            {RADIUS_PRESETS.slice(1, 5).map((r) => {
              const isSelected = theme.radiusId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onUpdateTheme({ radiusId: r.id })}
                  className={`py-1 text-center rounded-lg border text-[10px] font-bold transition active:scale-95 ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {r.pxLabel}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-32 shrink-0">
          <label className="text-[10px] font-bold text-slate-700 block mb-1">Grosime Bordură:</label>
          <div className="grid grid-cols-3 gap-1">
            {BORDER_WIDTH_PRESETS.map((b) => {
              const isSelected = theme.borderWidthId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onUpdateTheme({ borderWidthId: b.id })}
                  className={`py-1 text-center rounded-lg border text-[10px] font-bold transition active:scale-95 ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {b.width}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
