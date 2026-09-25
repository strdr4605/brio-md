"use client";

import { useState, useEffect, useCallback } from "react";
import { PRESET_TARGETS, PresetTarget } from "./objectStylerTypes";

type ElementInspectorOverlayProps = {
  isActive: boolean;
  onSelect: (target: PresetTarget) => void;
  onCancel: () => void;
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  label: string;
};

export function ElementInspectorOverlay({
  isActive,
  onSelect,
  onCancel,
}: ElementInspectorOverlayProps) {
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);

  const getElementLabel = (el: HTMLElement): { name: string; id: string; selector: string } => {
    // Check if element or parent has preset target
    for (const preset of PRESET_TARGETS) {
      if (el.closest(preset.selector)) {
        return { name: preset.name, id: preset.id, selector: preset.selector };
      }
    }

    // Try finding data-brio-id
    const brioEl = el.closest("[data-brio-id]") as HTMLElement | null;
    if (brioEl) {
      const brioId = brioEl.getAttribute("data-brio-id") || "element";
      return {
        name: `Componentă (${brioId})`,
        id: brioId,
        selector: `[data-brio-id="${brioId}"]`,
      };
    }

    // Fallback: create unique data attribute on target
    if (!el.getAttribute("data-brio-target-id")) {
      const uniqueId = "el-" + Math.random().toString(36).substring(2, 8);
      el.setAttribute("data-brio-target-id", uniqueId);
    }
    const targetId = el.getAttribute("data-brio-target-id")!;
    const tagName = el.tagName.toLowerCase();
    const friendlyName =
      tagName === "button"
        ? "Buton"
        : tagName === "table" || tagName === "thead" || tagName === "tbody"
        ? "Zonă Tabel"
        : tagName === "header"
        ? "Antet"
        : tagName === "nav"
        ? "Meniu Navigare"
        : el.className.includes("card") || el.className.includes("rounded-2xl")
        ? "Card Conținut"
        : `Element <${tagName}>`;

    return {
      name: friendlyName,
      id: `[data-brio-target-id="${targetId}"]`,
      selector: `[data-brio-target-id="${targetId}"]`,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Ignore modal elements
    if (target.closest("#theme-palette-modal") || target.closest("#inspector-banner")) {
      setHighlight(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    const labelInfo = getElementLabel(target);

    setHighlight({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      label: labelInfo.name,
    });
  }, []);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore clicking inside widget popover
      if (target.closest("#theme-palette-modal") || target.closest("#inspector-banner")) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const labelInfo = getElementLabel(target);
      onSelect({
        id: labelInfo.id,
        name: labelInfo.name,
        description: `Element selectat din pagină`,
        selector: labelInfo.selector,
        icon: "🎯",
      });
    },
    [onSelect]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    if (!isActive) {
      setHighlight(null);
      return;
    }

    window.addEventListener("mousemove", handleMouseMove, true);
    window.addEventListener("click", handleClick, true);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove, true);
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isActive, handleMouseMove, handleClick, handleKeyDown]);

  if (!isActive) return null;

  return (
    <>
      {/* Top Banner Notice */}
      <div
        id="inspector-banner"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] bg-slate-900/95 backdrop-blur-md text-white px-4 py-2 rounded-2xl shadow-2xl border border-blue-500/50 flex items-center gap-3 animate-fade-in text-xs font-bold"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
        <span>🎯 Mod Inspectare: Fă clic pe orice obiect din pagină pentru a-i modifica stilul</span>
        <button
          type="button"
          onClick={onCancel}
          className="ml-2 px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-[11px] transition cursor-pointer"
        >
          Anulează (Esc)
        </button>
      </div>

      {/* Target Bounding Box Highlight */}
      {highlight && (
        <div
          className="fixed pointer-events-none z-[9999] border-2 border-blue-500 bg-blue-500/15 rounded-xl transition-all duration-75 shadow-lg shadow-blue-500/20"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
          }}
        >
          <div className="absolute -top-7 left-0 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 truncate max-w-[200px]">
            <span>🎯</span>
            <span>{highlight.label}</span>
          </div>
        </div>
      )}
    </>
  );
}
