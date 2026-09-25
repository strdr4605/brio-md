export type CategoryType = "Luminos" | "Pastel" | "Întunecat";

export type ColorPreset = {
  name: string;
  hex: string;
  category: CategoryType;
};

export type ShadowPreset = {
  id: string;
  name: string;
  description: string;
  value: string;
};

export type SurfacePreset = {
  id: string;
  name: string;
  description: string;
  bg: string;
  blur: string;
  border: string;
};

export type RadiusPreset = {
  id: string;
  name: string;
  radius: string;
  pxLabel: string;
};

export type BrioThemeConfig = {
  name?: string;
  bg: string;
  shadowId: string;
  surfaceId: string;
  radiusId: string;
};

export const COLOR_PRESETS: ColorPreset[] = [
  { name: "Slate Implicit", hex: "#f8fafc", category: "Luminos" },
  { name: "Alb Pur", hex: "#ffffff", category: "Luminos" },
  { name: "Gri Apple", hex: "#f5f5f7", category: "Luminos" },
  { name: "Zinc Modern", hex: "#f4f4f5", category: "Luminos" },
  { name: "Perlă Caldă", hex: "#fafaf9", category: "Luminos" },
  { name: "Mentă Proaspătă", hex: "#f0fdf4", category: "Pastel" },
  { name: "Gheață Bleu", hex: "#f0f6fc", category: "Pastel" },
  { name: "Hârtie Caldă", hex: "#fcfaf6", category: "Pastel" },
  { name: "Nisip Fin", hex: "#f7f4ed", category: "Pastel" },
  { name: "Piersică / Rose", hex: "#fff1f2", category: "Pastel" },
  { name: "Lavandă Delicată", hex: "#faf5ff", category: "Pastel" },
  { name: "Chihlimbar Cald", hex: "#fffbeb", category: "Pastel" },
  { name: "Midnight Slate", hex: "#0f172a", category: "Întunecat" },
  { name: "Deep Navy", hex: "#0a1128", category: "Întunecat" },
  { name: "Carbon Zinc", hex: "#18181b", category: "Întunecat" },
  { name: "OLED Black", hex: "#000000", category: "Întunecat" },
];

export const SHADOW_PRESETS: ShadowPreset[] = [
  {
    id: "none",
    name: "Plat (Flat)",
    description: "Fără umbră, stil minimalist clar",
    value: "none",
  },
  {
    id: "subtle",
    name: "Subtil",
    description: "Umbră discretă de 1px",
    value: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
  },
  {
    id: "modern",
    name: "Modern Brio",
    description: "Echilibrat, elegant pentru UI",
    value: "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
  },
  {
    id: "floating",
    name: "Plutitor (Air)",
    description: "Carduri ce plutesc deasupra paginii",
    value: "0 12px 24px -6px rgba(0, 0, 0, 0.08), 0 6px 12px -4px rgba(0, 0, 0, 0.03)",
  },
  {
    id: "deep",
    name: "Adânc 3D",
    description: "Contrast volumetric puternic",
    value: "0 20px 28px -8px rgba(0, 0, 0, 0.14), 0 10px 14px -6px rgba(0, 0, 0, 0.07)",
  },
  {
    id: "glow_blue",
    name: "Neon Bleu",
    description: "Halou luminos albastru modern",
    value: "0 0 22px -3px rgba(59, 130, 246, 0.22), 0 4px 8px -2px rgba(0, 0, 0, 0.04)",
  },
  {
    id: "glow_amber",
    name: "Chihlimbar Cald",
    description: "Aura caldă de apus",
    value: "0 0 22px -3px rgba(245, 158, 11, 0.22), 0 4px 8px -2px rgba(0, 0, 0, 0.04)",
  },
];

export const SURFACE_PRESETS: SurfacePreset[] = [
  {
    id: "solid",
    name: "Alb Opac",
    description: "Card clasic alb solid",
    bg: "#ffffff",
    blur: "none",
    border: "#e2e8f0",
  },
  {
    id: "glass",
    name: "Sticlă Subtilă",
    description: "88% alb cu blur discret",
    bg: "rgba(255, 255, 255, 0.88)",
    blur: "blur(12px)",
    border: "rgba(255, 255, 255, 0.65)",
  },
  {
    id: "frosted",
    name: "Frosted Glass",
    description: "72% alb cu blur intens de sticlă mată",
    bg: "rgba(255, 255, 255, 0.72)",
    blur: "blur(20px)",
    border: "rgba(255, 255, 255, 0.85)",
  },
  {
    id: "translucent",
    name: "Translucid",
    description: "55% alb, efect aerian",
    bg: "rgba(255, 255, 255, 0.55)",
    blur: "blur(16px)",
    border: "rgba(255, 255, 255, 0.5)",
  },
  {
    id: "cream",
    name: "Hârtie Fină",
    description: "Nuanță caldă de bumbac",
    bg: "#fdfbf7",
    blur: "none",
    border: "#e7e2d9",
  },
];

export const RADIUS_PRESETS: RadiusPreset[] = [
  { id: "sm", name: "Subtil", radius: "0.5rem", pxLabel: "8px" },
  { id: "md", name: "Compact", radius: "0.75rem", pxLabel: "12px" },
  { id: "lg", name: "Standard", radius: "1rem", pxLabel: "16px" },
  { id: "xl", name: "Modern", radius: "1.25rem", pxLabel: "20px" },
  { id: "2xl", name: "Pufos", radius: "1.5rem", pxLabel: "24px" },
  { id: "3xl", name: "Super Rotunjit", radius: "2rem", pxLabel: "32px" },
];

export const CURATED_THEMES: BrioThemeConfig[] = [
  {
    name: "Brio Default",
    bg: "#f8fafc",
    shadowId: "modern",
    surfaceId: "solid",
    radiusId: "xl",
  },
  {
    name: "Apple Studio",
    bg: "#f5f5f7",
    shadowId: "floating",
    surfaceId: "glass",
    radiusId: "2xl",
  },
  {
    name: "Mentă Proaspătă",
    bg: "#f0fdf4",
    shadowId: "modern",
    surfaceId: "frosted",
    radiusId: "2xl",
  },
  {
    name: "Nordic Frosted",
    bg: "#f0f6fc",
    shadowId: "subtle",
    surfaceId: "frosted",
    radiusId: "xl",
  },
  {
    name: "Neo-Brutalist",
    bg: "#fafaf9",
    shadowId: "none",
    surfaceId: "solid",
    radiusId: "sm",
  },
  {
    name: "Hârtie & Nisip",
    bg: "#f7f4ed",
    shadowId: "subtle",
    surfaceId: "cream",
    radiusId: "md",
  },
  {
    name: "Lavandă Pufos",
    bg: "#faf5ff",
    shadowId: "floating",
    surfaceId: "glass",
    radiusId: "3xl",
  },
  {
    name: "Piersică Caldă",
    bg: "#fff1f2",
    shadowId: "modern",
    surfaceId: "frosted",
    radiusId: "2xl",
  },
  {
    name: "Cyber Midnight",
    bg: "#0f172a",
    shadowId: "glow_blue",
    surfaceId: "solid",
    radiusId: "xl",
  },
  {
    name: "Deep Space Navy",
    bg: "#0a1128",
    shadowId: "deep",
    surfaceId: "glass",
    radiusId: "xl",
  },
  {
    name: "Apus Chihlimbar",
    bg: "#fffbeb",
    shadowId: "glow_amber",
    surfaceId: "glass",
    radiusId: "2xl",
  },
];

export const DEFAULT_THEME: BrioThemeConfig = CURATED_THEMES[0];

export function getRandomTheme(): BrioThemeConfig {
  const isCurated = Math.random() < 0.65;
  if (isCurated) {
    const idx = Math.floor(Math.random() * CURATED_THEMES.length);
    return CURATED_THEMES[idx];
  }
  const randomColor = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)].hex;
  const randomShadow = SHADOW_PRESETS[Math.floor(Math.random() * SHADOW_PRESETS.length)].id;
  const randomSurface = SURFACE_PRESETS[Math.floor(Math.random() * SURFACE_PRESETS.length)].id;
  const randomRadius = RADIUS_PRESETS[Math.floor(Math.random() * RADIUS_PRESETS.length)].id;

  return {
    name: "Stil Generat",
    bg: randomColor,
    shadowId: randomShadow,
    surfaceId: randomSurface,
    radiusId: randomRadius,
  };
}

const STYLE_TAG_ID = "brio-theme-style-override";

export function applyThemeToDom(theme: BrioThemeConfig) {
  if (typeof document === "undefined") return;

  const shadow = SHADOW_PRESETS.find((s) => s.id === theme.shadowId) || SHADOW_PRESETS[2];
  const surface = SURFACE_PRESETS.find((s) => s.id === theme.surfaceId) || SURFACE_PRESETS[0];
  const radius = RADIUS_PRESETS.find((r) => r.id === theme.radiusId) || RADIUS_PRESETS[3];

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

  styleTag.textContent = `
    #dashboard-root {
      background-color: ${theme.bg} !important;
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
      border-color: ${surface.border} !important;
    }
  `;
}
