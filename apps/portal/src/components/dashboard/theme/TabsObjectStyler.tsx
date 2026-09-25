"use client";

import { PresetTarget, PRESET_TARGETS, ElementCustomStyle, ObjectStylesMap } from "./objectStylerTypes";
import { generateObjectCss } from "./objectStylerApplicator";

type TabsObjectStylerProps = {
  selectedTarget: PresetTarget;
  onSelectTarget: (target: PresetTarget) => void;
  stylesMap: ObjectStylesMap;
  onUpdateStyle: (targetId: string, updates: Partial<ElementCustomStyle>) => void;
  onResetTarget: (targetId: string) => void;
  onResetAllTargets: () => void;
  onStartInspect: () => void;
  onShowToast: (msg: string) => void;
};

export function TabsObjectStyler({
  selectedTarget,
  onSelectTarget,
  stylesMap,
  onUpdateStyle,
  onResetTarget,
  onResetAllTargets,
  onStartInspect,
  onShowToast,
}: TabsObjectStylerProps) {
  const currentStyle = stylesMap[selectedTarget.id] || {};

  const handleCopyCss = async () => {
    const css = generateObjectCss(selectedTarget.id, currentStyle);
    try {
      await navigator.clipboard.writeText(css);
      onShowToast("📋 CSS Obiect copiat!");
    } catch {
      onShowToast("Eroare la copiere");
    }
  };

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto p-0.5 scrollbar-thin">
      {/* 1. Element Selector & Inspect Trigger */}
      <div className="bg-slate-50 border border-slate-200/90 p-2.5 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{selectedTarget.icon}</span>
            <div>
              <div className="text-xs font-black text-slate-900 leading-tight">{selectedTarget.name}</div>
              <div className="text-[9px] text-slate-400 font-mono truncate max-w-[170px]">
                {selectedTarget.selector}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onStartInspect}
            className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black shadow-xs transition active:scale-95 cursor-pointer shrink-0"
            title="Activează cursorul pentru a alege orice element din pagină"
          >
            <span>🎯</span>
            <span>Alege din pagină</span>
          </button>
        </div>

        {/* Quick Component Preset Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {PRESET_TARGETS.map((t) => {
            const isSelected = selectedTarget.id === t.id;
            const hasOverrides = Boolean(stylesMap[t.id]);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTarget(t)}
                className={`py-0.5 px-2 rounded-lg text-[9px] font-bold whitespace-nowrap border transition cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                <span>{t.icon} {t.name}</span>
                {hasOverrides && <span className="ml-1 text-blue-400">•</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Background & Text Colors */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 border border-slate-200/80 p-2 rounded-xl">
          <label className="text-[10px] font-bold text-slate-600 block mb-1">Fundal Obiect:</label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={currentStyle.bg && currentStyle.bg.startsWith("#") ? currentStyle.bg : "#ffffff"}
              onChange={(e) => onUpdateStyle(selectedTarget.id, { bg: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
            />
            <input
              type="text"
              value={currentStyle.bg || ""}
              onChange={(e) => onUpdateStyle(selectedTarget.id, { bg: e.target.value })}
              placeholder="#FFFFFF"
              className="w-full text-[10px] font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none"
            />
          </div>
          {/* Quick Opacity / Glass Presets */}
          <div className="flex items-center gap-1 mt-1.5">
            {[
              { label: "Opac", bg: "#ffffff", blur: "none" },
              { label: "Sticlă", bg: "rgba(255,255,255,0.85)", blur: "blur(12px)" },
              { label: "Dark", bg: "rgba(15,23,42,0.9)", blur: "none" },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onUpdateStyle(selectedTarget.id, { bg: p.bg, blur: p.blur })}
                className="flex-1 py-0.5 rounded text-[8px] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-2 rounded-xl">
          <label className="text-[10px] font-bold text-slate-600 block mb-1">Culoare Text:</label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={currentStyle.textColor && currentStyle.textColor.startsWith("#") ? currentStyle.textColor : "#0f172a"}
              onChange={(e) => onUpdateStyle(selectedTarget.id, { textColor: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
            />
            <input
              type="text"
              value={currentStyle.textColor || ""}
              onChange={(e) => onUpdateStyle(selectedTarget.id, { textColor: e.target.value })}
              placeholder="#0F172A"
              className="w-full text-[10px] font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none"
            />
          </div>
          {/* Quick Text Color Presets */}
          <div className="flex items-center gap-1 mt-1.5">
            {[
              { label: "Dark", color: "#0f172a" },
              { label: "Alb", color: "#ffffff" },
              { label: "Albastru", color: "#2563eb" },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onUpdateStyle(selectedTarget.id, { textColor: p.color })}
                className="flex-1 py-0.5 rounded text-[8px] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bordură & Rotunjire */}
      <div className="bg-slate-50 border border-slate-200/80 p-2 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-600">Grosime Bordură:</label>
          <div className="flex items-center gap-1">
            {["0px", "1px", "2px", "3px"].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onUpdateStyle(selectedTarget.id, { borderWidth: w })}
                className={`py-0.5 px-2 rounded text-[9px] font-bold border transition ${
                  currentStyle.borderWidth === w
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-600">Rotunjire Colțuri:</label>
          <div className="flex items-center gap-1">
            {[
              { label: "0px", val: "0px" },
              { label: "8px", val: "0.5rem" },
              { label: "16px", val: "1rem" },
              { label: "24px", val: "1.5rem" },
              { label: "Rotund", val: "9999px" },
            ].map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => onUpdateStyle(selectedTarget.id, { borderRadius: r.val })}
                className={`py-0.5 px-1.5 rounded text-[9px] font-bold border transition ${
                  currentStyle.borderRadius === r.val
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Umbră Obiect */}
      <div className="bg-slate-50 border border-slate-200/80 p-2 rounded-xl">
        <label className="text-[10px] font-bold text-slate-600 block mb-1">Umbră Specifică Obiect:</label>
        <div className="grid grid-cols-4 gap-1">
          {[
            { label: "Fără", val: "none" },
            { label: "Subtil", val: "0 1px 3px rgba(0,0,0,0.08)" },
            { label: "Modern", val: "0 4px 6px -1px rgba(0,0,0,0.1)" },
            { label: "Plutitor", val: "0 14px 25px -4px rgba(0,0,0,0.12)" },
            { label: "Adânc 3D", val: "0 22px 35px -8px rgba(0,0,0,0.2)" },
            { label: "Glow Bleu", val: "0 0 20px -2px rgba(59,130,246,0.3)" },
            { label: "Glow Aur", val: "0 0 20px -2px rgba(245,158,11,0.3)" },
            { label: "Smarald", val: "0 0 20px -2px rgba(16,185,129,0.3)" },
          ].map((sh) => (
            <button
              key={sh.label}
              type="button"
              onClick={() => onUpdateStyle(selectedTarget.id, { shadow: sh.val })}
              className={`py-1 rounded text-[9px] font-bold border text-center transition ${
                currentStyle.shadow === sh.val
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {sh.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Footer Actions for this target */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => onResetTarget(selectedTarget.id)}
          className="py-1 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-[10px] font-bold hover:bg-slate-100 transition active:scale-95 cursor-pointer"
        >
          ↺ Reset acest obiect
        </button>
        <button
          type="button"
          onClick={handleCopyCss}
          className="py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-[10px] font-bold hover:bg-slate-100 transition active:scale-95 cursor-pointer"
        >
          📋 Copiază CSS
        </button>
        <button
          type="button"
          onClick={onResetAllTargets}
          className="py-1 px-2 rounded-lg border border-red-200 text-red-600 text-[10px] font-bold hover:bg-red-50 transition active:scale-95 cursor-pointer"
          title="Elimină toate stilurile custom de pe toate obiectele"
        >
          Șterge tot
        </button>
      </div>
    </div>
  );
}
