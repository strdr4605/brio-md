"use client";

import { BrioThemeConfig } from "./themeTypes";
import { GLACIAL_SORA_THEME } from "./themePresets";

type ThemeStudioFooterProps = {
  theme: BrioThemeConfig;
  onRandomize: () => void;
  onCopyCss: () => void;
  onReset: () => void;
  onApplyPreset: (preset: BrioThemeConfig) => void;
};

export function ThemeStudioFooter({
  theme,
  onRandomize,
  onCopyCss,
  onReset,
  onApplyPreset,
}: ThemeStudioFooterProps) {
  const isGlacialSoraActive =
    theme.bg === GLACIAL_SORA_THEME.bg &&
    theme.accentColor === GLACIAL_SORA_THEME.accentColor &&
    theme.fontName === GLACIAL_SORA_THEME.fontName;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
      {/* Quick Favorite Star Button */}
      <button
        type="button"
        onClick={() => onApplyPreset(GLACIAL_SORA_THEME)}
        className={`w-full py-1.5 px-3 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
          isGlacialSoraActive
            ? "bg-blue-50 border-blue-300 text-blue-800 shadow-2xs"
            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50/50 hover:border-blue-200"
        }`}
        title="Aplică tema favorită: Albastru Glaciar, Sticlă Frosted, Glow Smarald și font Sora"
      >
        <span>⭐</span>
        <span>Stil Favorit: Aura Glaciară (Sora)</span>
        {isGlacialSoraActive && (
          <span className="text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.2">
            Activ
          </span>
        )}
      </button>

      {/* Action Row */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onRandomize}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs font-black shadow-md hover:shadow-indigo-500/25 hover:opacity-95 transition active:scale-95 cursor-pointer"
          title="Generează un stil complet aleator cu font nou"
        >
          <span>🎲</span>
          <span>Random</span>
        </button>
        <button
          type="button"
          onClick={onCopyCss}
          className="py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 transition active:scale-95 cursor-pointer"
          title="Copiază variabilele CSS în clipboard"
        >
          📋 CSS
        </button>
        <button
          type="button"
          onClick={onReset}
          className="py-2 px-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:text-slate-800 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
          title="Revino la stilul inițial"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}
