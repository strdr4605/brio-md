# Brio.md Design System & UI Standard

> **Single Source of Truth** for UI/UX across Brio.md (Portal, Learn, Landing).  
> All developers and AI agents must strictly adhere to this specification.

---

## 1. Design Philosophy

- **Inspiration:** Modern minimalist SaaS (Linear, Stripe, Supabase).
- **Core Principle: Low Cognitive Load.** Show the user what matters *now* (80% use case). Hide detailed histories, secondary forms, and deep settings behind tabs, drawers, or modal dialogs (Progressive Disclosure).
- **No Decorative Clutter:** No rainbow gradients, no neon glowing orbs, no heavy drop-shadows, and no excessive uppercase labels. The content and clean typography must lead the user.

---

## 2. Design Tokens

### 2.1 Color Palette

| Token | Class / Hex | Usage |
| :--- | :--- | :--- |
| **Page Background** | `bg-slate-50` (`#f8fafc`) | Main background for all application pages |
| **Surface / Card** | `bg-white` (`#ffffff`) | Background for cards, tables, modal dialogs, drawers |
| **Surface Subdued** | `bg-slate-50/75` (`#f8fafc`) | Table headers, secondary nested panels, filter toolbars |
| **Borders** | `border-slate-200/80` (`#e2e8f0`) | 1px border for all cards, table rows, and dividers |
| **Primary Accent** | `bg-blue-600` (`#2563eb`) | Primary action buttons, active navigation indicators, focus rings |
| **Primary Hover** | `bg-blue-700` (`#1d4ed8`) | Hover state for primary actions |
| **Text Heading** | `text-slate-900` (`#0f172a`) | Page titles, card headings, key metrics |
| **Text Body** | `text-slate-600` (`#475569`) | Standard content, table cell data, descriptions |
| **Text Muted** | `text-slate-400` (`#94a3b8`) | Timestamps, secondary metadata, placeholders |

### 2.2 Semantic Status Colors

All status indicators, badges, and alerts must use matching pastel background + strong text:

| Status | Background | Border | Text | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `bg-emerald-50` | `border-emerald-200` | `text-emerald-700` | Present, Paid in full, Active group, Saved |
| **Danger** | `bg-rose-50` | `border-rose-200` | `text-rose-700` | Absent, Overdue invoice, Cancelled, Critical alert |
| **Warning** | `bg-amber-50` | `border-amber-200` | `text-amber-700` | Late arrival, Pending payment, Unmarked session |
| **Neutral** | `bg-slate-100` | `border-slate-200` | `text-slate-700` | Archived, Inactive, Standard informational tag |
| **Brand/Info** | `bg-blue-50` | `border-blue-200` | `text-blue-700` | Excused absence, In progress, Selected filter |

### 2.3 Radii & Elevation

- **Cards & Modals:** `rounded-xl` (12px).
- **Buttons & Form Inputs:** `rounded-lg` (8px).
- **Badges & Avatars:** `rounded-full`.
- **Shadows:** Only `shadow-sm` on resting cards. `shadow-md` on hover cards or floating drawers. Never use `shadow-xl` or colored glow shadows.

---

## 3. Shared UI Primitives (`@brio-md/ui`)

Developers must import components from `@brio-md/ui` instead of writing raw Tailwind markup for recurring UI elements:

1. `<Button variant="primary | secondary | outline | ghost | danger" size="sm | md | lg">`
2. `<Card>` (supports `<Card.Header>`, `<Card.Body>`, `<Card.Footer>`)
3. `<Badge variant="success | danger | warning | neutral | info">`
4. `<StatCard title="..." value="..." trend="..." icon={...}>`
5. `<Tabs tabs={[{ id, label, count }]} activeTab={...} onChange={...}>`
6. `<EmptyState icon={...} title="..." description="..." action={...}>`
7. `<Drawer isOpen={...} onClose={...} title="...">` (Slide-over panel)

---

## 4. Master Stitch Prompt Template

When generating screens in Stitch, all team members must use this template to guarantee visual alignment:

```text
[SYSTEM DESIGN SPECIFICATION - BRIO.MD]
Role: Lead UI/UX Designer for Brio.md educational SaaS platform.
Canvas: Desktop 1440px (or Mobile 390px for mobile attendance view).
Aesthetic: Modern, clean, minimal SaaS (inspired by Linear and Stripe). High contrast, generous whitespace, zero visual clutter.
Design Tokens:
- Background: #f8fafc (Slate 50).
- Surfaces: #ffffff with 1px border #e2e8f0, subtle shadow (0 1px 2px rgba(0,0,0,0.05)), border radius 12px (rounded-xl).
- Primary Accent: #2563eb (Royal Blue).
- Semantics: Emerald for Success/Paid, Rose for Danger/Overdue, Amber for Warning/Late, Slate for Neutral.
- Typography: Inter/Sans-serif, clean hierarchy, max 3 font sizes per container.
- Anti-patterns: Avoid heavy background gradients, glowing neon orbs, or rainbow-colored borders.

[SCREEN-SPECIFIC SPECIFICATION]
Screen Name: [Insert Screen Name: e.g. Student Profile Hub]
User Persona: [Insert: e.g. School Administrator / Teacher]
Primary User Action: [What is the #1 thing user does on this screen?]

Layout Structure:
1. Navigation: Standard collapsible left sidebar (Logo "Brio.md", clean icon links).
2. Top Header: Breadcrumbs ("Dashboard / [Section] / [Screen]"), search bar (Cmd+K style), school switcher, user avatar.
3. Content Area:
   - [Specify 2-3 primary cards or two-column split layout]
   - [Specify what is deferred to tabs or slide-over drawer to prevent clutter]
```

---

## 5. Anti-Patterns (What NOT to do)

- ❌ **Do NOT** place more than 4 KPI cards on any screen.
- ❌ **Do NOT** put full tables of historical data on the main overview (use "Last 5 records" + link/tab to full history).
- ❌ **Do NOT** write ad-hoc button or badge classes (e.g. `<button className="bg-gradient-to-r from-blue-600 to-indigo-600 ...">`). Use standard `@brio-md/ui` primitives.
- ❌ **Do NOT** create pages longer than 500 lines without breaking them into modular subcomponents (e.g., tabs, cards, widgets).
