import {
  BrioThemeConfig,
} from "./themeTypes";
import {
  COLOR_PRESETS,
  ACCENT_PRESETS,
  SHADOW_PRESETS,
  SURFACE_PRESETS,
  RADIUS_PRESETS,
  PATTERN_PRESETS,
  FONT_PRESETS,
  BORDER_WIDTH_PRESETS,
  HOVER_PRESETS,
  DENSITY_PRESETS,
  CURATED_THEMES,
} from "./themePresets";

export function getRandomTheme(): BrioThemeConfig {
  const isCurated = Math.random() < 0.65;
  if (isCurated) {
    const idx = Math.floor(Math.random() * CURATED_THEMES.length);
    return CURATED_THEMES[idx];
  }

  const randomColor = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)].hex;
  const randomAccent = ACCENT_PRESETS[Math.floor(Math.random() * ACCENT_PRESETS.length)].hex;
  const randomShadow = SHADOW_PRESETS[Math.floor(Math.random() * SHADOW_PRESETS.length)].id;
  const randomSurface = SURFACE_PRESETS[Math.floor(Math.random() * SURFACE_PRESETS.length)].id;
  const randomRadius = RADIUS_PRESETS[Math.floor(Math.random() * RADIUS_PRESETS.length)].id;
  const randomPattern = PATTERN_PRESETS[Math.floor(Math.random() * PATTERN_PRESETS.length)].id;
  const randomFont = FONT_PRESETS[Math.floor(Math.random() * FONT_PRESETS.length)].id;
  const randomBorder = BORDER_WIDTH_PRESETS[Math.floor(Math.random() * BORDER_WIDTH_PRESETS.length)].id;
  const randomHover = HOVER_PRESETS[Math.floor(Math.random() * HOVER_PRESETS.length)].id;
  const randomDensity = DENSITY_PRESETS[Math.floor(Math.random() * DENSITY_PRESETS.length)].id;

  return {
    name: "Stil Generat",
    bg: randomColor,
    accentColor: randomAccent,
    shadowId: randomShadow,
    surfaceId: randomSurface,
    radiusId: randomRadius,
    patternId: randomPattern,
    fontId: randomFont,
    borderWidthId: randomBorder,
    hoverId: randomHover,
    densityId: randomDensity,
    headerGlass: Math.random() > 0.4,
  };
}

const STYLE_TAG_ID = "brio-theme-style-override";

function getPatternCss(patternId: string, accentHex: string): string {
  switch (patternId) {
    case "dots":
      return `background-image: radial-gradient(rgba(100, 116, 139, 0.18) 1.5px, transparent 1.5px); background-size: 24px 24px;`;
    case "grid":
      return `background-image: linear-gradient(rgba(100, 116, 139, 0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 116, 139, 0.09) 1px, transparent 1px); background-size: 28px 28px;`;
    case "mesh":
      return `background-image: radial-gradient(circle at 12% 15%, ${accentHex}1a 0%, transparent 45%), radial-gradient(circle at 88% 85%, ${accentHex}16 0%, transparent 45%);`;
    case "diagonal":
      return `background-image: repeating-linear-gradient(45deg, rgba(100, 116, 139, 0.035) 0, rgba(100, 116, 139, 0.035) 1px, transparent 0, transparent 14px);`;
    default:
      return `background-image: none;`;
  }
}

function getHoverCss(hoverId: string, accentHex: string): string {
  switch (hoverId) {
    case "lift":
      return `
        #dashboard-root main .rounded-2xl, #dashboard-root main .rounded-xl {
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease !important;
        }
        #dashboard-root main .rounded-2xl:hover, #dashboard-root main .rounded-xl:hover {
          transform: translateY(-3px) !important;
        }
      `;
    case "glow":
      return `
        #dashboard-root main .rounded-2xl, #dashboard-root main .rounded-xl {
          transition: box-shadow 0.22s ease !important;
        }
        #dashboard-root main .rounded-2xl:hover, #dashboard-root main .rounded-xl:hover {
          box-shadow: 0 0 24px -2px ${accentHex}40 !important;
        }
      `;
    case "scale":
      return `
        #dashboard-root main .rounded-2xl, #dashboard-root main .rounded-xl {
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        #dashboard-root main .rounded-2xl:hover, #dashboard-root main .rounded-xl:hover {
          transform: scale(1.008) !important;
        }
      `;
    default:
      return "";
  }
}

function getDensityCss(densityId: string): string {
  if (densityId === "compact") {
    return `
      #dashboard-root table td, #dashboard-root table th {
        padding-top: 4px !important;
        padding-bottom: 4px !important;
      }
    `;
  }
  if (densityId === "relaxed") {
    return `
      #dashboard-root table td, #dashboard-root table th {
        padding-top: 14px !important;
        padding-bottom: 14px !important;
      }
    `;
  }
  return "";
}

export function applyThemeToDom(theme: BrioThemeConfig) {
  if (typeof document === "undefined") return;

  const shadow = SHADOW_PRESETS.find((s) => s.id === theme.shadowId) || SHADOW_PRESETS[2];
  const surface = SURFACE_PRESETS.find((s) => s.id === theme.surfaceId) || SURFACE_PRESETS[0];
  const radius = RADIUS_PRESETS.find((r) => r.id === theme.radiusId) || RADIUS_PRESETS[3];
  const font = FONT_PRESETS.find((f) => f.id === theme.fontId) || FONT_PRESETS[0];
  const borderWidth = BORDER_WIDTH_PRESETS.find((b) => b.id === theme.borderWidthId) || BORDER_WIDTH_PRESETS[1];

  document.documentElement.style.setProperty("--dashboard-bg", theme.bg);
  document.body.style.backgroundColor = theme.bg;

  const root = document.getElementById("dashboard-root");
  if (root) {
    root.style.backgroundColor = theme.bg;
  }

  let styleTag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = STYLE_TAG_ID;
    document.head.appendChild(styleTag);
  }

  const patternCss = getPatternCss(theme.patternId, theme.accentColor);
  const hoverCss = getHoverCss(theme.hoverId, theme.accentColor);
  const densityCss = getDensityCss(theme.densityId);

  styleTag.textContent = `
    #dashboard-root {
      background-color: ${theme.bg} !important;
      font-family: ${font.fontFamily} !important;
      ${patternCss}
    }
    #dashboard-root [class*="fixed inset-0"][class*="z-[100]"] {
      background-color: ${theme.bg} !important;
    }
    #dashboard-root main .rounded-2xl,
    #dashboard-root main .rounded-xl,
    #dashboard-root main .rounded-3xl {
      border-radius: ${radius.radius} !important;
    }
    #dashboard-root main .bg-white.shadow-xs,
    #dashboard-root main .bg-white.shadow-sm,
    #dashboard-root main .bg-white.shadow,
    #dashboard-root main .bg-white.shadow-md,
    #dashboard-root main .bg-white.shadow-lg,
    #dashboard-root main .rounded-2xl.bg-white,
    #dashboard-root main .rounded-xl.bg-white,
    #dashboard-root main .rounded-3xl.bg-white,
    #dashboard-root main [data-brio-card="true"] {
      background-color: ${surface.bg} !important;
      backdrop-filter: ${surface.blur} !important;
      -webkit-backdrop-filter: ${surface.blur} !important;
      box-shadow: ${shadow.value} !important;
      border-width: ${borderWidth.width} !important;
      border-color: ${surface.border} !important;
    }
    #dashboard-root .bg-blue-600,
    #dashboard-root .bg-blue-500 {
      background-color: ${theme.accentColor} !important;
    }
    #dashboard-root .text-blue-600,
    #dashboard-root .text-blue-500 {
      color: ${theme.accentColor} !important;
    }
    #dashboard-root .border-blue-600,
    #dashboard-root .border-blue-500 {
      border-color: ${theme.accentColor} !important;
    }
    ${
      theme.headerGlass
        ? `
      #dashboard-root header.sticky {
        background-color: ${surface.bg} !important;
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
      }
    `
        : ""
    }
    ${hoverCss}
    ${densityCss}
  `;
}
