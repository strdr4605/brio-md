"use client";

import { TEST_GAME_PRESETS, GamePreset } from "@/lib/gameUrlHelper";

type Props = {
  onSelect: (preset: GamePreset) => void;
};

export function MinigamePresets({ onSelect }: Props) {
  return (
    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <span>🎮</span> Exemple rapide:
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TEST_GAME_PRESETS.map((preset) => (
          <button
            key={preset.title}
            type="button"
            onClick={() => onSelect(preset)}
            className="text-xs px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 rounded-lg font-medium text-slate-700 transition cursor-pointer shadow-2xs"
          >
            {preset.title}
          </button>
        ))}
      </div>
    </div>
  );
}
