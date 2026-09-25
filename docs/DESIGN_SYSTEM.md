# Brio.md Design System & UI Standard (Stripe Atlas × MengTo)

> **Single Source of Truth** for UI/UX across Brio.md (Portal, Learn, Landing).  
> Powered by the **Stripe-Craft** framework (`.agents/skills/stripe-craft`).  
> All developers and AI agents must strictly adhere to this specification.

---

## 1. Design Philosophy: "Stripe-Grade Clarity & MengTo Restraint"

- **Aesthetic Benchmark:** Stripe Atlas + Linear precision. A system that feels technical, luxurious, and calm.
- **Core Principle: Proximity Over Containers (MengTo Law).** Group elements by spatial distance rather than putting every field inside a border/box.
- **Core Principle: Hierarchy Over Labels (MengTo Law).** Font scale, weight, and color distinguish primary content from metadata; remove redundant labels like `Name:` and `Status:`.
- **Strict Anti-Patterns (Tells of AI-generated UI):**
  - ❌ **No emojis in buttons or labels:** Never use `📞`, `💬`, `⚠️`. Use clean 1.5px stroke SVG outline icons.
  - ❌ **No rainbow badge pills:** Use subtle 6px status dots (`inline-block rounded-full bg-emerald-500 mr-1.5`) with neutral text.
  - ❌ **No identical clone cards:** Differentiate the primary KPI metric with an SVG sparkline; secondary metrics remain neutral.
  - ❌ **No ALL CAPS headers:** Use natural sentence case (`Active students`, `Attendance status`) for faster cognitive scanning.
  - ❌ **No pure black on pure white:** Use deep navy `#061b31` headings on a soft canvas `#f4f6f8`.

---

## 2. Design Tokens (Stripe Atlas Preset)

### 2.1 Surfaces & Neutrals

| Token | Class / Hex | Usage |
| :--- | :--- | :--- |
| **Canvas** | `bg-[#f4f6f8]` | Main page background across all apps |
| **Surface / Card** | `bg-white` (`#ffffff`) | Card containers, tables, slide-over drawers |
| **Subdued Surface**| `bg-[#f8fafc]` | Table header background, secondary utility panels |
| **Borders** | `border-[#e5edf5]` | 1px clean card and table dividers |
| **Primary Accent** | `bg-[#635bff]` (`#534be8` hover) | Stripe Violet-Indigo for primary actions, active tabs |
| **Text Primary**   | `text-[#061b31]` | Deep navy headings, strong titles, key metrics |
| **Text Body**      | `text-[#334155]` | Slate 700 standard text |
| **Text Muted**     | `text-[#64748d]` | Slate 500 secondary labels, timestamps |

### 2.2 Elevation & Shadows

Stripe's signature blue-tinted elevation:
- **Card resting:** `box-shadow: 0 2px 5px rgba(50, 50, 93, 0.04), 0 1px 1px rgba(0, 0, 0, 0.03);`
- **Drawer & Overlay:** `box-shadow: 0 10px 30px rgba(50, 50, 93, 0.08), 0 4px 10px rgba(0, 0, 0, 0.04);`

### 2.3 Typography & Numbers

- **Font Family:** `Inter`, `-apple-system`, sans-serif.
- **Numbers & Prices:** Always use `tabular-nums` (`font-variant-numeric: tabular-nums`) so numbers in tables and KPIs align perfectly.
- **Letter Spacing:** `tracking-tight` (`-0.02em`) on large metrics.

---

## 3. Dedicated Workspace Skills for Agents

The workspace is equipped with the following skills in `.agents/skills/`:
- **`/stripe-craft`** — Core skill for building Stripe Atlas / MengTo interfaces.
- **`/no-ai-design-slop`** — Passive quality gate rejecting generic AI patterns.
- **`/design-first-ui-prompting`** — Spec-driven prompt generator for Stitch and AI models.
- **`/ui-craft`** & **`/ui-craft-dense-dashboard`** — Layout recipes and density standards.
- **`/polish`** & **`/finalize`** — 10-step finish bar before merging code.

---

## 4. Master Stitch Prompt Template (Stripe Atlas × MengTo)

```text
GOAL
- Product: Brio.md School Management Platform
- Surface: [Insert screen name: e.g. Student Profile / Operating Dashboard]
- Persona: [Insert: e.g. School Administrator / Teacher]
- Key Objective: [Insert: e.g. Mark class attendance in 30 seconds with 0 cognitive load]

FORMAT
- Viewport: Desktop 1440px (or Mobile 390px for teacher mobile view)
- Layout Grid: Asymmetric 12-column (7 cols primary hero, 5 cols secondary queue)

TYPE SYSTEM
- Font Family: Inter / System Sans
- Headings: Deep navy #061b31, font-semibold (weight 600), tracking -0.02em
- Body: 14px font-normal, text-slate-600
- Numbers & Dates: Strictly tabular-nums

COLOR & MATERIAL
- Canvas: #f4f6f8
- Cards: #ffffff with 1px border #e5edf5, soft 2px blue-tinted shadow
- Accent: Stripe violet #635bff for primary actions
- Status: 6px inline dots (emerald/amber/rose), never thick badge pills

LAYOUT & SECTIONS
- [Describe Section 1: Hero or Primary Table]
- [Describe Section 2: Secondary Queue or Details Drawer]

NEGATIVE PROMPT
- Strictly no emojis in buttons or labels
- No rainbow colored badge pills
- No glowing neon orbs or gradient backgrounds
- No marketing filler words or decorative filler text
```
