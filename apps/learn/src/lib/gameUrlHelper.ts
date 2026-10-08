export type GameProvider = "scratch" | "wordwall" | "phet" | "geogebra" | "custom";

export type NormalizedGameUrl = {
  url: string;
  embedUrl: string;
  provider: GameProvider;
  isEmbedFriendly: boolean;
};

export type GamePreset = {
  title: string;
  url: string;
  embedUrl: string;
  provider: GameProvider;
  maxScore: number;
  instructions: string;
};

export const TEST_GAME_PRESETS: GamePreset[] = [
  {
    title: "PhET: Fraction Matcher",
    url: "https://phet.colorado.edu/sims/html/fraction-matcher/latest/fraction-matcher_all.html",
    embedUrl: "https://phet.colorado.edu/sims/html/fraction-matcher/latest/fraction-matcher_all.html",
    provider: "phet",
    maxScore: 100,
    instructions: "Potrivește formele fracționare cu valorile lor numerice pentru a finaliza nivelurile.",
  },
  {
    title: "Scratch: Math Runner",
    url: "https://scratch.mit.edu/projects/10128407/",
    embedUrl: "https://scratch.mit.edu/projects/10128407/embed",
    provider: "scratch",
    maxScore: 100,
    instructions: "Alergă și rezolvă operațiile matematice înainte de expirarea timpului.",
  },
  {
    title: "Wordwall: Tabla Înmulțirii",
    url: "https://wordwall.net/resource/1808846",
    embedUrl: "https://wordwall.net/embed/1808846",
    provider: "wordwall",
    maxScore: 50,
    instructions: "Alege răspunsul corect pentru fiecare operație din tabla înmulțirii.",
  },
  {
    title: "GeoGebra: Teorema Pitagora",
    url: "https://www.geogebra.org/m/mhyxva7q",
    embedUrl: "https://www.geogebra.org/material/iframe/id/mhyxva7q",
    provider: "geogebra",
    maxScore: 100,
    instructions: "Explorează demonstrația geometrică interactivă a Teoremei lui Pitagora.",
  },
];

export function normalizeGameUrl(rawUrl: string): NormalizedGameUrl {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) {
    return {
      url: "",
      embedUrl: "",
      provider: "custom",
      isEmbedFriendly: false,
    };
  }

  // Scratch: scratch.mit.edu/projects/:id or :id/embed
  const scratchMatch = trimmed.match(/scratch\.mit\.edu\/projects\/(\d+)/i);
  if (scratchMatch) {
    const projectId = scratchMatch[1];
    return {
      url: `https://scratch.mit.edu/projects/${projectId}/`,
      embedUrl: `https://scratch.mit.edu/projects/${projectId}/embed`,
      provider: "scratch",
      isEmbedFriendly: true,
    };
  }

  // Wordwall: wordwall.net/resource/:id or wordwall.net/play/:id or /embed/:id
  const wordwallMatch = trimmed.match(/wordwall\.net\/(?:resource|play|embed)\/(\d+)/i);
  if (wordwallMatch) {
    const resourceId = wordwallMatch[1];
    return {
      url: `https://wordwall.net/resource/${resourceId}`,
      embedUrl: `https://wordwall.net/embed/${resourceId}`,
      provider: "wordwall",
      isEmbedFriendly: true,
    };
  }

  // PhET Simulations (Colorado University HTML5)
  if (trimmed.includes("phet.colorado.edu")) {
    return {
      url: trimmed,
      embedUrl: trimmed,
      provider: "phet",
      isEmbedFriendly: true,
    };
  }

  // GeoGebra
  const geogebraMatch = trimmed.match(/geogebra\.org\/(?:m|material\/iframe\/id)\/([a-zA-Z0-9]+)/i);
  if (geogebraMatch) {
    const matId = geogebraMatch[1];
    return {
      url: `https://www.geogebra.org/m/${matId}`,
      embedUrl: `https://www.geogebra.org/material/iframe/id/${matId}`,
      provider: "geogebra",
      isEmbedFriendly: true,
    };
  }

  return {
    url: trimmed,
    embedUrl: trimmed,
    provider: "custom",
    isEmbedFriendly: false,
  };
}
