# Brio.md Design System & UI Standard (UI-Craft Graphite)

> **Single Source of Truth** for UI/UX across Brio.md.  
> Powered by the **UI-Craft** design engineering framework (`.agents/skills/ui-craft`).  
> All developers and AI agents must strictly adhere to this specification.

---

## 1. Design Philosophy: "No AI Slop"

- **Inspiration:** Production-grade tools (Linear, Stripe, Raycast, Supabase).
- **Core Principle: Signal-to-Noise Ratio.** The UI must disappear behind the school's actual data.
- **Strict Anti-Patterns (Tells of AI-generated UI):**
  - ❌ **No emojis in buttons or labels:** Never use `📞`, `💬`, `⚠️`. Use clean 1.5px stroke SVG outline icons.
  - ❌ **No rainbow badge pills:** Never wrap every word in thick colored badges. Use subtle 6px status dots (`inline-block rounded-full bg-emerald-500 mr-1.5`) with neutral text.
  - ❌ **No identical clone cards:** Differentiate the primary KPI metric with a sparkline or subtle tint; secondary metrics stay neutral.
  - ❌ **No ALL CAPS headers:** Use natural sentence case (`Active students`, `Attendance status`) for faster cognitive scanning.
  - ❌ **No decorative neon gradients or heavy drop-shadows:** Use clean 1px hairline borders (`#e4e4e7`) with subtle ambient elevation.

---

## 2. Design Tokens (Graphite Preset)

### 2.1 Surfaces & Neutrals

| Token | Class / Hex | Usage |
| :--- | :--- | :--- |
| **Canvas** | `bg-[#fafafa]` | Clean, cool neutral page background |
| **Surface / Card** | `bg-white` (`#ffffff`) | Main card surface, tables, modal dialogs |
| **Subdued Surface**| `bg-[#f4f4f5]` | Table headers, secondary nested panels, filter buttons |
| **Hairline Border**| `border-[#e4e4e7]` | 1px border for all cards, table rows, and dividers |
| **Primary Accent** | `bg-[#18181b]` / `bg-indigo-600` | Primary action buttons, active navigation, focus rings |
| **Text Primary**   | `text-[#09090b]` | Primary headings, table row values, key metrics |
| **Text Secondary** | `text-[#71717a]` | Subtitles, table headers, metadata |
| **Text Muted**     | `text-[#a1a1aa]` | Inactive states, timestamps, placeholders |

### 2.2 Typography & Numbers

- **Font Family:** `Inter`, `-apple-system`, `sans-serif`.
- **Numbers:** Always use `tabular-nums` (`font-variant-numeric: tabular-nums`) for dates, phone numbers, prices, and metrics so columns align vertically.
- **Letter Spacing:** `tracking-tight` (`-0.02em`) on large numbers and headings.

---

## 3. UI-Craft Skills Available in Project

The workspace includes the full `.agents/skills` suite:
- `/craft <surface>` — generate designer-grade dashboards, tables, and settings.
- `/critique` — audit a screen against Nielsen's 10 usability heuristics and design laws.
- `/polish` — run the 10-point acceptance bar before merging.
- `/distill` — cut visual clutter and simplify an over-built screen.
- `/tokens` — inspect and manage design tokens.

---

## 4. Master Stitch Prompt Template (Craft-Grade)

```text
[SYSTEM DESIGN SPECIFICATION - BRIO.MD (GRAPHITE)]
Role: Lead Design Engineer for Brio.md educational management system.
Aesthetic: Linear/Stripe-grade minimal SaaS. Highly functional, quiet, data-dense, zero AI-slop.
Design Tokens:
- Canvas: #fafafa.
- Surface: #ffffff with 1px border #e4e4e7, hairline shadow (0 1px 2px rgba(0,0,0,0.03)), radius 8px-10px.
- Typography: Inter/Sans-serif, sentence-case headers only. Tabular figures for all numbers.
- Palette: 90% monochrome neutrals (#09090b text, #71717a secondary), single deep indigo (#4f46e5) or zinc accent.
- Statuses: 6px inline dots (emerald for active/paid, amber for late/unmarked, rose for debt/absent), never bulky colored pills.
- Icons: 1.5px stroke SVG line icons. Strict prohibition of emoji characters in UI controls.

[SCREEN-SPECIFIC SPECIFICATION]
Screen Name: [e.g. School Dashboard / Student Dossier]
User Persona: [e.g. School Administrator / Teacher]
Primary User Action: [e.g. Mark today's class attendance]

Composition:
1. Navigation: Clean collapsed/expanded sidebar with subtle active state tint.
2. Header: Quiet breadcrumb, search trigger (Cmd+K), branch indicator.
3. Content Area:
   - Primary metric with sparkline trend.
   - Dense, scannable table with sentence-case headers and inline status dots.
   - Secondary details deferred to slide-over drawer or clean tabs.
```
