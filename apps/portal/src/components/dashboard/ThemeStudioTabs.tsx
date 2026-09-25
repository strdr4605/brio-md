"use client";

import {
  BrioThemeConfig,
  COLOR_PRESETS,
  SHADOW_PRESETS,
  SURFACE_PRESETS,
  RADIUS_PRESETS,
  CategoryType,
} from "./themePresets";

type ColorsTabProps = {
  theme: BrioThemeConfig;
  activeColorCategory: "Toate" | CategoryType;
  onSelectCategory: (cat: "Toate" | CategoryType) => void;
  onUpdateTheme: (updates: Partial<BrioThemeConfig>, name?: string) => void;
};

export function ColorsTab({
  theme,
  activeColorCategory,
  onSelectCategory,
  onUpdateTheme,
}: ColorsTabProps) {
  const filteredColors =
    activeColorCategory === "Toate"
      ? COLOR_PRESETS
      : COLOR_PRESETS.filter((p) => p.category === activeColorCategory);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1 bg-slate-100/70 p-0.5 rounded-lg text-[10px] font-bold">
        {(["Toate", "Luminos", "Pastel", "Întunecat"] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`flex-1 py-0.5 rounded-md transition ${
              activeColorCategory === cat ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-0.5 scrollbar-thin">
        {filteredColors.map((c) => {
          const isSelected = theme.bg.toLowerCase() === c.hex.toLowerCase();
          return (
            <button
              key={c.hex + c.name}
              type="button"
              onClick={() => onUpdateTheme({ bg: c.hex }, c.name)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all text-center cursor-pointer active:scale-95 ${
                isSelected
                  ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 shadow-2xs"
                  : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div
                className="w-full h-6 rounded-md border border-slate-300/80 shadow-2xs flex items-center justify-center"
                style={{ backgroundColor: c.hex }}
              >
                {isSelected && (
                  <span className="text-[10px] font-black text-blue-600 bg-white/90 rounded-full px-1">
                    ✓
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-700 truncate w-full">{c.name}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <label className="text-[10px] font-bold text-slate-400 shrink-0">Custom:</label>
        <div className="flex items-center gap-1.5 flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
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
    </div>
  );
}

export function ShadowsTab({
  theme,
  onUpdateTheme,
}: {
  theme: BrioThemeConfig;
  onUpdateTheme: (updates: Partial<BrioThemeConfig>) => void;
}) {
  return (
    <div className="space-y-1.5 max-h-56 overflow-y-auto p-0.5 scrollbar-thin">
      {SHADOW_PRESETS.map((s) => {
        const isSelected = theme.shadowId === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onUpdateTheme({ shadowId: s.id })}
            className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition cursor-pointer active:scale-98 ${
              isSelected
                ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                : "border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <div>
              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                {s.name}
                {isSelected && <span className="text-[10px] text-blue-600 font-bold">✓</span>}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">{s.description}</div>
            </div>
            <div
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 shrink-0"
              style={{ boxShadow: s.value }}
            />
          </button>
        );
      })}
    </div>
  );
}

export function SurfacesTab({
  theme,
  onUpdateTheme,
}: {
  theme: BrioThemeConfig;
  onUpdateTheme: (updates: Partial<BrioThemeConfig>) => void;
}) {
  return (
    <div className="space-y-1.5 max-h-56 overflow-y-auto p-0.5 scrollbar-thin">
      {SURFACE_PRESETS.map((sf) => {
        const isSelected = theme.surfaceId === sf.id;
        return (
          <button
            key={sf.id}
            type="button"
            onClick={() => onUpdateTheme({ surfaceId: sf.id })}
            className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition cursor-pointer active:scale-98 ${
              isSelected
                ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                : "border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <div>
              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                {sf.name}
                {isSelected && <span className="text-[10px] text-blue-600 font-bold">✓</span>}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">{sf.description}</div>
            </div>
            <div
              className="w-10 h-7 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs"
              style={{
                backgroundColor: sf.bg,
                borderColor: sf.border,
                backdropFilter: sf.blur,
              }}
            >
              <span className="text-[9px] font-bold text-slate-500">Aa</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function RadiusTab({
  theme,
  onUpdateTheme,
}: {
  theme: BrioThemeConfig;
  onUpdateTheme: (updates: Partial<BrioThemeConfig>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto p-0.5">
      {RADIUS_PRESETS.map((r) => {
        const isSelected = theme.radiusId === r.id;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onUpdateTheme({ radiusId: r.id })}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition text-center cursor-pointer active:scale-95 ${
              isSelected
                ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                : "border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <div
              className="w-12 h-8 bg-slate-100 border border-slate-300 mb-1.5 flex items-center justify-center"
              style={{ borderRadius: r.radius }}
            >
              <span className="text-[10px] font-mono font-bold text-slate-600">{r.pxLabel}</span>
            </div>
            <span className="text-[11px] font-bold text-slate-800">{r.name}</span>
          </button>
        );
      })}
    </div>
  );
}
