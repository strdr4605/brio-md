import { ObjectStylesMap, ElementCustomStyle, PRESET_TARGETS } from "./objectStylerTypes";

const OBJECT_STYLE_TAG_ID = "brio-object-styles-override";

export function applyObjectStylesToDom(stylesMap: ObjectStylesMap) {
  if (typeof document === "undefined") return;

  let styleTag = document.getElementById(OBJECT_STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = OBJECT_STYLE_TAG_ID;
    document.head.appendChild(styleTag);
  }

  const cssRules: string[] = [];

  for (const [targetKey, style] of Object.entries(stylesMap)) {
    if (!style) continue;

    // Find selector: either from preset or raw selector
    const preset = PRESET_TARGETS.find((p) => p.id === targetKey);
    const selector = preset ? preset.selector : targetKey;

    const declarations: string[] = [];
    if (style.bg) {
      declarations.push(`background-color: ${style.bg} !important;`);
    }
    if (style.textColor) {
      declarations.push(`color: ${style.textColor} !important;`);
      declarations.push(`--tw-text-opacity: 1 !important;`);
    }
    if (style.borderColor) {
      declarations.push(`border-color: ${style.borderColor} !important;`);
    }
    if (style.borderWidth) {
      declarations.push(`border-width: ${style.borderWidth} !important;`);
    }
    if (style.borderRadius) {
      declarations.push(`border-radius: ${style.borderRadius} !important;`);
    }
    if (style.shadow) {
      declarations.push(`box-shadow: ${style.shadow} !important;`);
    }
    if (style.blur) {
      declarations.push(`backdrop-filter: ${style.blur} !important;`);
      declarations.push(`-webkit-backdrop-filter: ${style.blur} !important;`);
    }
    if (style.padding) {
      declarations.push(`padding: ${style.padding} !important;`);
    }
    if (style.scale) {
      declarations.push(`transform: scale(${style.scale}) !important;`);
      declarations.push(`transform-origin: center center !important;`);
    }

    if (declarations.length > 0) {
      cssRules.push(`${selector} {\n  ${declarations.join("\n  ")}\n}`);
    }
  }

  styleTag.textContent = cssRules.join("\n\n");
}

export function saveObjectStyles(stylesMap: ObjectStylesMap) {
  if (typeof window !== "undefined") {
    localStorage.setItem("brio_element_styles", JSON.stringify(stylesMap));
  }
}

export function loadObjectStyles(): ObjectStylesMap {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("brio_element_styles");
    if (raw) {
      try {
        return JSON.parse(raw) as ObjectStylesMap;
      } catch {
        // ignore
      }
    }
  }
  return {};
}

export function generateObjectCss(targetKey: string, style: ElementCustomStyle): string {
  const preset = PRESET_TARGETS.find((p) => p.id === targetKey);
  const selector = preset ? preset.name : targetKey;

  const lines: string[] = [`/* Stil Personalizat: ${selector} */`];
  if (style.bg) lines.push(`background-color: ${style.bg};`);
  if (style.textColor) lines.push(`color: ${style.textColor};`);
  if (style.borderColor) lines.push(`border-color: ${style.borderColor};`);
  if (style.borderWidth) lines.push(`border-width: ${style.borderWidth};`);
  if (style.borderRadius) lines.push(`border-radius: ${style.borderRadius};`);
  if (style.shadow) lines.push(`box-shadow: ${style.shadow};`);
  if (style.blur) lines.push(`backdrop-filter: ${style.blur};`);
  return lines.join("\n");
}
