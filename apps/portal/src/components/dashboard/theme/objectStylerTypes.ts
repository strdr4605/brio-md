export type ElementCustomStyle = {
  bg?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: string; // e.g. "0px", "1px", "2px", "3px"
  borderRadius?: string; // e.g. "0px", "8px", "16px", "24px", "999px"
  shadow?: string;
  blur?: string; // e.g. "none", "blur(8px)", "blur(16px)"
  padding?: string;
  scale?: string;
};

export type PresetTarget = {
  id: string;
  name: string;
  description: string;
  selector: string;
  icon: string;
};

export const PRESET_TARGETS: PresetTarget[] = [
  {
    id: "attendance-header",
    name: "Antet Catalog",
    description: "Bara principală cu titlul grupei și salvare",
    selector: '[data-brio-id="attendance-header"], #journal-header-card',
    icon: "📋",
  },
  {
    id: "attendance-toolbar",
    name: "Bara Filtre & Căutare",
    description: "Filtrele Toți/Restanțieri și căutarea",
    selector: '[data-brio-id="attendance-toolbar"], #journal-toolbar-card',
    icon: "🔍",
  },
  {
    id: "attendance-table",
    name: "Tabelul Catalogului",
    description: "Containerul tabelului cu studenți și prezențe",
    selector: '[data-brio-id="attendance-table"], #journal-table-card',
    icon: "📊",
  },
  {
    id: "billing-badge",
    name: "Insigne Plată / Facturi",
    description: "Baidj-urile Restanță / Achitat / Per lecție",
    selector: '[data-brio-id="billing-badge"]',
    icon: "🏷️",
  },
  {
    id: "top-header",
    name: "Bara Superioară",
    description: "Header-ul de navigare cu breadcrumbs",
    selector: "#dashboard-root header.sticky",
    icon: "🔝",
  },
  {
    id: "sidebar-nav",
    name: "Meniu Lateral",
    description: "Sidebar-ul principal cu link-uri",
    selector: "#dashboard-root aside",
    icon: "📑",
  },
];

export type ObjectStylesMap = Record<string, ElementCustomStyle>;
