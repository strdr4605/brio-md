export type CategoryType = "Luminos" | "Pastel" | "Întunecat";

export type ColorPreset = {
  name: string;
  hex: string;
  category: CategoryType;
};

export type AccentPreset = {
  id: string;
  name: string;
  hex: string;
  twClass: string;
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

export type PatternPreset = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export type FontPreset = {
  id: string;
  name: string;
  fontFamily: string;
  preview: string;
};

export type HoverPreset = {
  id: string;
  name: string;
  description: string;
};

export type DensityPreset = {
  id: string;
  name: string;
  description: string;
};

export type BorderWidthPreset = {
  id: string;
  name: string;
  width: string;
};

export type BrioThemeConfig = {
  name?: string;
  bg: string;
  accentColor: string;
  shadowId: string;
  surfaceId: string;
  radiusId: string;
  patternId: string;
  fontId: string;
  fontName?: string;
  fontLetterSpacing?: string;
  fontSizeScale?: string;
  borderWidthId: string;
  hoverId: string;
  densityId: string;
  headerGlass: boolean;
};
