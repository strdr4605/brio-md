# Brio Design System (Brio DS)

> **Official User Interface Design Standard for the Brio.md Portal**  
> This document is a mandatory guide for all developers and AI assistants (Antigravity, Cursor, Copilot, Claude).  
> **Any deviation from the rules, tokens, and structures described below is strictly prohibited.**

---

## 1. Design Philosophy: Clean Monochrome Enterprise

The design of Brio.md is built upon the principles of Swiss typography, restrained minimalism, and high information density without visual clutter.

### Core Tenets:
1. **Monochrome Foundation (Slate First):** Primary background is neutral ultra-light `bg-[#F8FAFC]` (`slate-50`), cards are pure white `bg-white`, typography is deep contrast `text-slate-900`.
2. **Absolute Prohibition of Gradients & Rainbow Colors:**
   - ❌ **FORBIDDEN:** Gradient card backgrounds (blue-purple, orange-pink, neon backdrops).
   - ❌ **FORBIDDEN:** Blurry glowing background orbs/blobs.
   - ❌ **FORBIDDEN:** Inconsistent colored icon backgrounds (one blue, one pink, one green).
   - ✅ **ALLOWED:** Metric card icon containers must be strictly monochrome: `bg-slate-100 text-slate-700`.
3. **Functional Semantic Accents Only:**
   Color is used strictly for meaningful status indication:
   - 🟢 **Emerald (`emerald-600` / `bg-emerald-500`):** Positive trend, confirmed payment, "Connected / Online / Active" status.
   - 🔴 **Rose (`rose-600` / `bg-rose-500`):** Arrears, overdue invoices, critical errors.
   - 🟡 **Amber (`amber-600` / `bg-amber-500`):** Partial payment, warnings, pending.
   - 🔘 **Slate (`slate-500` / `slate-600`):** General statistics, record counts, neutral indicators.
4. **Zero-Clutter Policy:**
   - No unclickable decorative status badges (e.g. "Sistem Operațional" in headers).
   - No redundant quick-action blocks ("Acțiuni Rapide") if actions are already reachable via navigation or page controls.
   - Maximize whitespace and clear geometric margins.

---

## 2. Color Palette & Tailwind Tokens

| Element | Tailwind Classes | Description |
|---|---|---|
| **Page Background** | `bg-slate-50` (`#F8FAFC`) | Global backdrop for the workspace |
| **Card Background** | `bg-white` | Containers for cards, modals, tables |
| **Card Borders** | `border border-slate-200/80` | Subtle hairline boundary |
| **Border Hover** | `hover:border-slate-300 hover:shadow-sm` | Deliberate hover feedback |
| **Dividers** | `border-slate-100` | Division between card body and footer |
| **Icon Container** | `bg-slate-100 text-slate-700` | Neutral backdrop for pictograms |
| **Primary KPI Numbers** | `text-slate-900 font-black` | Deep contrast accent for key indicators |
| **Metric Titles** | `text-slate-800 font-semibold` | Crisp, legible header |
| **Secondary Text** | `text-slate-500 text-xs sm:text-sm` | Explanations, dates, card footers |
| **Header / Avatar** | `bg-slate-900 text-white` | Monochrome high-contrast avatar |

---

## 3. Font Hierarchy

Strict typography ensures instantaneous scannability:

- **H1 (Page Title):**
  `text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900`
- **Page Subtitle / Description:**
  `text-xs sm:text-sm text-slate-500 mt-1`
- **H2 (Section Header):**
  `text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide`
- **Section Action Link ("Vezi orar complet >"):**
  `text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition flex items-center gap-1`
- **Card Metric Title:**
  `text-base font-semibold text-slate-800`
- **KPI Value:**
  `text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3`
- **Card Footer (Context / Trend):**
  `text-xs sm:text-sm text-slate-500` with trend icon `w-4 h-4` or `w-5 h-5`

---

## 4. Benchmark Component: `MetricCard`

Every metric card on the portal must use the shared component `MetricCard.tsx`:

```tsx
import Link from "next/link";
import React from "react";

type MetricCardProps = {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  footer?: React.ReactNode;
  href?: string;
};

export function MetricCard({ title, value, icon, footer, href }: MetricCardProps) {
  const content = (
    <div className="bg-white rounded-[8px] p-5 border border-[#E2E8F0] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] hover:border-slate-300 transition-colors h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          <div className="w-10 h-10 rounded-[6px] bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6">
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums mt-2">
          {value}
        </div>
      </div>
      {footer && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
```

### Icon Sizing Rules:
- Icon container: strictly `w-12 h-12 rounded-xl bg-slate-100 text-slate-700`.
- SVG icon: strictly `w-6 h-6` (24px) to `w-7 h-7` (28px). Never use tiny `w-4 h-4` (16px) inside primary level cards!

---

## 5. Dashboard Structure (4-Section Model)

The main dashboard organizes analytics into 4 logical sections with 3 cards per row (3×1 on desktop, 2×2 on tablet, 1 on mobile):

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
  <MetricCard ... />
  <MetricCard ... />
  <MetricCard ... />
</div>
```

1. **Section 1: Analitică Utilizatori & Elevi**
   - Card 1: `Total Utilizatori` (`UsersIcon`, count of active accounts).
   - Card 2: `Studenți Înregistrați` (`StudentsIcon`, course reach).
   - Card 3: `Personal & Profesori` (`UserCheckIcon`, access status).

2. **Section 2: Activitate Academică & Orar**
   - Card 1: `Cursuri & Programe` (`BookOpenIcon`, curriculum count).
   - Card 2: `Grupe de Studiu` (`CalendarIcon`, room schedules).
   - Card 3: `Prezență & Frecvență` (`SchoolIcon`, enrollment/attendance rate).

3. **Section 3: Finanțe & Abonamente**
   - Card 1: `Încasări Confirmate` (`CheckCircleIcon`, collected revenue in MDL).
   - Card 2: `Facturat Total (Abonamente)` (`BarChartIcon`, total billed volume).
   - Card 3: `Restanțe Active (Datorii)` (`AlertTriangleIcon`, overdue debt with navigation to `tab=overdue`).

4. **Section 4: Stare Sistem & Securitate (Split Grid 2 Columns)**
   - Column 1: PostgreSQL Database (Drizzle ORM) + Multi-tenant isolation.
   - Column 2: Perimeter control (Tasmota Smart Door) + PBAC NextAuth authorization.

---

## 6. Top Header (`TopHeader.tsx`)

Header remains clean and minimal:
- **Clickable Breadcrumbs:**
  `Brio Portal > Prezentare > Panou Principal`
- **Global Search (`GlobalSearch`):**
  Centered, `rounded-lg` or `rounded-full`, hotkey `CTRL + K`.
- **User Profile:**
  Monochrome pill with avatar `bg-slate-900 text-white font-bold`, showing name and role.
- ❌ **Forbidden:** External links ("Portal Cursuri"), school selector buttons ("Toate Școlile") if not required for the active role, and decorative badges in the header.

---

## 7. AI Agent Directives

When generating or modifying any UI code in this repository, AI agents **MUST** follow:

1. **Strict File Budget (<350 lines):**
   Any component or page exceeding 350 lines must be rejected. Complex interfaces must be broken down into atomic subcomponents (like `MetricCard.tsx`).
2. **No Arbitrary Gradients:**
   Never add `bg-gradient-to-*`, `from-blue-*`, `via-purple-*`, `to-pink-*` classes to card backgrounds or sections.
3. **Strict Icon Typing:**
   All icons must be imported from `@/components/ui/icons`. Do not import unverified external icon packages (lucide-react, heroicons) without approval.
4. **Interactive States (Hover & Transitions):**
   All interactive elements must feature subtle hover effects:
   `transition-all hover:border-slate-300 hover:shadow-sm active:scale-[0.99]`
5. **Mobile-First Responsiveness:**
   Always test behavior on `xs`, `sm`, `md`, `lg`, and `xl` viewports. Card grids must consistently use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
