export type FontCategory =
  | "Toate"
  | "Modern UI"
  | "Clean Sans"
  | "Serif & Lux"
  | "Monospace"
  | "Display Bold"
  | "Handwriting"
  | "Retro & Cyber";

export type FontItem = {
  name: string;
  category: FontCategory;
  fallback: string;
};

export const FONT_COLLECTION: FontItem[] = [
  // --- Modern UI ---
  { name: "Inter", category: "Modern UI", fallback: "sans-serif" },
  { name: "Plus Jakarta Sans", category: "Modern UI", fallback: "sans-serif" },
  { name: "Outfit", category: "Modern UI", fallback: "sans-serif" },
  { name: "DM Sans", category: "Modern UI", fallback: "sans-serif" },
  { name: "Manrope", category: "Modern UI", fallback: "sans-serif" },
  { name: "Space Grotesk", category: "Modern UI", fallback: "sans-serif" },
  { name: "Syne", category: "Modern UI", fallback: "sans-serif" },
  { name: "Sora", category: "Modern UI", fallback: "sans-serif" },
  { name: "Urbanist", category: "Modern UI", fallback: "sans-serif" },
  { name: "Figtree", category: "Modern UI", fallback: "sans-serif" },
  { name: "Archivo", category: "Modern UI", fallback: "sans-serif" },
  { name: "Jost", category: "Modern UI", fallback: "sans-serif" },
  { name: "Lexend", category: "Modern UI", fallback: "sans-serif" },
  { name: "Albert Sans", category: "Modern UI", fallback: "sans-serif" },
  { name: "Red Hat Display", category: "Modern UI", fallback: "sans-serif" },
  { name: "Epilogue", category: "Modern UI", fallback: "sans-serif" },
  { name: "Rubik", category: "Modern UI", fallback: "sans-serif" },
  { name: "Work Sans", category: "Modern UI", fallback: "sans-serif" },
  { name: "Be Vietnam Pro", category: "Modern UI", fallback: "sans-serif" },
  { name: "Mulish", category: "Modern UI", fallback: "sans-serif" },

  // --- Clean Sans ---
  { name: "Poppins", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Montserrat", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Roboto", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Open Sans", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Lato", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Raleway", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Nunito", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Nunito Sans", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Source Sans 3", category: "Clean Sans", fallback: "sans-serif" },
  { name: "PT Sans", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Ubuntu", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Titillium Web", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Barlow", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Heebo", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Questrial", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Karla", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Quicksand", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Cabin", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Kanit", category: "Clean Sans", fallback: "sans-serif" },
  { name: "Oxygen", category: "Clean Sans", fallback: "sans-serif" },

  // --- Serif & Lux ---
  { name: "Playfair Display", category: "Serif & Lux", fallback: "serif" },
  { name: "Merriweather", category: "Serif & Lux", fallback: "serif" },
  { name: "Lora", category: "Serif & Lux", fallback: "serif" },
  { name: "Cinzel", category: "Serif & Lux", fallback: "serif" },
  { name: "Cormorant Garamond", category: "Serif & Lux", fallback: "serif" },
  { name: "EB Garamond", category: "Serif & Lux", fallback: "serif" },
  { name: "Bodoni Moda", category: "Serif & Lux", fallback: "serif" },
  { name: "Prata", category: "Serif & Lux", fallback: "serif" },
  { name: "Libre Baskerville", category: "Serif & Lux", fallback: "serif" },
  { name: "Spectral", category: "Serif & Lux", fallback: "serif" },
  { name: "Fraunces", category: "Serif & Lux", fallback: "serif" },
  { name: "Bitter", category: "Serif & Lux", fallback: "serif" },
  { name: "DM Serif Display", category: "Serif & Lux", fallback: "serif" },
  { name: "Marcellus", category: "Serif & Lux", fallback: "serif" },
  { name: "Newsreader", category: "Serif & Lux", fallback: "serif" },
  { name: "Castoro", category: "Serif & Lux", fallback: "serif" },
  { name: "Instrument Serif", category: "Serif & Lux", fallback: "serif" },
  { name: "Volkhov", category: "Serif & Lux", fallback: "serif" },
  { name: "Crimson Text", category: "Serif & Lux", fallback: "serif" },
  { name: "Cardo", category: "Serif & Lux", fallback: "serif" },
  { name: "Arvo", category: "Serif & Lux", fallback: "serif" },
  { name: "Rokkitt", category: "Serif & Lux", fallback: "serif" },
  { name: "Cinzel Decorative", category: "Serif & Lux", fallback: "serif" },
  { name: "Unna", category: "Serif & Lux", fallback: "serif" },

  // --- Monospace ---
  { name: "JetBrains Mono", category: "Monospace", fallback: "monospace" },
  { name: "Fira Code", category: "Monospace", fallback: "monospace" },
  { name: "Space Mono", category: "Monospace", fallback: "monospace" },
  { name: "Roboto Mono", category: "Monospace", fallback: "monospace" },
  { name: "Inconsolata", category: "Monospace", fallback: "monospace" },
  { name: "Source Code Pro", category: "Monospace", fallback: "monospace" },
  { name: "IBM Plex Mono", category: "Monospace", fallback: "monospace" },
  { name: "Ubuntu Mono", category: "Monospace", fallback: "monospace" },
  { name: "VT323", category: "Monospace", fallback: "monospace" },
  { name: "Share Tech Mono", category: "Monospace", fallback: "monospace" },
  { name: "Cousine", category: "Monospace", fallback: "monospace" },
  { name: "Anonymous Pro", category: "Monospace", fallback: "monospace" },
  { name: "Major Mono Display", category: "Monospace", fallback: "monospace" },
  { name: "Nova Mono", category: "Monospace", fallback: "monospace" },
  { name: "Red Hat Mono", category: "Monospace", fallback: "monospace" },

  // --- Display Bold ---
  { name: "Bebas Neue", category: "Display Bold", fallback: "sans-serif" },
  { name: "Oswald", category: "Display Bold", fallback: "sans-serif" },
  { name: "Anton", category: "Display Bold", fallback: "sans-serif" },
  { name: "Russo One", category: "Display Bold", fallback: "sans-serif" },
  { name: "Righteous", category: "Display Bold", fallback: "sans-serif" },
  { name: "Permanent Marker", category: "Display Bold", fallback: "cursive" },
  { name: "Bungee", category: "Display Bold", fallback: "sans-serif" },
  { name: "Fredoka", category: "Display Bold", fallback: "sans-serif" },
  { name: "Ultra", category: "Display Bold", fallback: "serif" },
  { name: "Carter One", category: "Display Bold", fallback: "sans-serif" },
  { name: "Fugaz One", category: "Display Bold", fallback: "sans-serif" },
  { name: "Black Han Sans", category: "Display Bold", fallback: "sans-serif" },
  { name: "Titan One", category: "Display Bold", fallback: "sans-serif" },
  { name: "Passion One", category: "Display Bold", fallback: "sans-serif" },
  { name: "Shrikhand", category: "Display Bold", fallback: "serif" },
  { name: "Abril Fatface", category: "Display Bold", fallback: "serif" },
  { name: "Alfa Slab One", category: "Display Bold", fallback: "serif" },
  { name: "Paytone One", category: "Display Bold", fallback: "sans-serif" },

  // --- Handwriting ---
  { name: "Caveat", category: "Handwriting", fallback: "cursive" },
  { name: "Dancing Script", category: "Handwriting", fallback: "cursive" },
  { name: "Pacifico", category: "Handwriting", fallback: "cursive" },
  { name: "Shadows Into Light", category: "Handwriting", fallback: "cursive" },
  { name: "Indie Flower", category: "Handwriting", fallback: "cursive" },
  { name: "Satisfy", category: "Handwriting", fallback: "cursive" },
  { name: "Sacramento", category: "Handwriting", fallback: "cursive" },
  { name: "Yellowtail", category: "Handwriting", fallback: "cursive" },
  { name: "Kalam", category: "Handwriting", fallback: "cursive" },
  { name: "Great Vibes", category: "Handwriting", fallback: "cursive" },
  { name: "Marck Script", category: "Handwriting", fallback: "cursive" },
  { name: "Reenie Beanie", category: "Handwriting", fallback: "cursive" },
  { name: "Patrick Hand", category: "Handwriting", fallback: "cursive" },
  { name: "Courgette", category: "Handwriting", fallback: "cursive" },
  { name: "Kaushan Script", category: "Handwriting", fallback: "cursive" },

  // --- Retro & Cyber ---
  { name: "Press Start 2P", category: "Retro & Cyber", fallback: "monospace" },
  { name: "Orbitron", category: "Retro & Cyber", fallback: "sans-serif" },
  { name: "Silkscreen", category: "Retro & Cyber", fallback: "monospace" },
  { name: "Pixelify Sans", category: "Retro & Cyber", fallback: "sans-serif" },
  { name: "Monoton", category: "Retro & Cyber", fallback: "cursive" },
  { name: "Megrim", category: "Retro & Cyber", fallback: "cursive" },
  { name: "Bruno Ace", category: "Retro & Cyber", fallback: "sans-serif" },
  { name: "Wallpoet", category: "Retro & Cyber", fallback: "cursive" },
  { name: "Faster One", category: "Retro & Cyber", fallback: "cursive" },
  { name: "DotGothic16", category: "Retro & Cyber", fallback: "sans-serif" },
];

export function loadGoogleFont(fontName: string) {
  if (typeof document === "undefined") return;
  const clean = fontName.trim();
  if (clean === "System" || clean.startsWith("-apple")) return;

  const id = `gfont-${clean.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${clean.replace(/ /g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}
