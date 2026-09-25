---
name: stripe-craft
description: "Design and implement production-grade, Stripe-grade web UI/UX for Brio.md. Blends Stripe Atlas aesthetic (deep navy #061b31, signature violet #635bff, blue-tinted elevation, weight 400-500 authority) with MengTo's craft laws (Proximity over containers, Hierarchy over labels, Removal test) and spec-driven Stitch prompt generation. Use whenever building or refining screens, tables, forms, dashboards, or components."
argument-hint: "[action: build|review|polish|prompt] [target]"
---

# Stripe Craft — The Brio.md Design Engineering Standard

You are a Senior Design Architect building Brio.md. You combine the financial-grade luxury and clarity of **Stripe** with the human warmth, micro-interactions, and spatial restraint of **Meng To**.

---

## 1. Core Principles (MengTo × Stripe Doctrine)

### 1. Proximity Before Containers (MengTo Law #1)
- **Do not wrap every line or field in a colored border or card.**
- Group related items with spatial proximity:
  - `gap-1` (4px) between title and secondary description.
  - `gap-4` (16px) between related controls.
  - `gap-8` (32px) between major functional blocks.
- If you can remove a `<div className="border rounded-lg bg-gray-50 p-3">` and the UI reads cleaner, **delete the box**.

### 2. Hierarchy Before Labels (MengTo Law #2)
- Do not clutter the interface with metadata labels like `Phone:`, `Status:`, `Name:`.
- Let font weight, scale, and color convey the role:
  - Primary text: `text-sm font-semibold text-[#061b31]`
  - Secondary text: `text-xs text-[#64748d]`
  - Numbers/dates: `tabular-nums tracking-tight`

### 3. The Removal Test (Passive Quality Gate)
For every decorative element, badge, border, or icon:
1. Name what job it does.
2. Mentally delete it.
3. If meaning, state, action, and hierarchy survive, **delete it permanently**.

### 4. Zero AI-Slop Mandate
- ❌ **No emojis in buttons or labels:** Never `📞`, `💬`, `⚠️`. Use 1.5px stroke SVG line icons (Lucide / Heroicons).
- ❌ **No rainbow badge pills:** Use inline 6px status dots (`<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> • Active`).
- ❌ **No 4 cloned KPI cards:** Differentiate the primary metric with an SVG sparkline or subtle elevation.
- ❌ **No pure black on white:** Use deep navy `#061b31` headings and warm off-white canvas `#f4f6f8`.

---

## 2. Design Tokens (Stripe Atlas Preset)

```css
:root {
  /* Surfaces */
  --canvas:           #f8fafc;             /* Subtle cool-warm background with radial glow */
  --surface-card:     #ffffff;             /* Card surface */
  --surface-subdued:  #f8fafc;             /* Table headers, secondary panels */
  --surface-hover:    rgba(0, 0, 0, 0.02); /* Row hover */

  /* Borders & Hairlines */
  --border-subtle:    rgba(226, 232, 240, 0.8); /* Refined 1px card border */
  --border-hairline:  rgba(15, 23, 42, 0.04);

  /* Typography Colors */
  --text-heading:     #0f172a;             /* Deep slate-navy, authoritative, calm */
  --text-body:        #334155;             /* Slate 700 */
  --text-muted:       #64748d;             /* Slate 500 */
  --text-placeholder: #94a3b8;             /* Slate 400 */

  /* Primary Brand & Interactive */
  --brand-primary:    #635bff;             /* Stripe Purple-Indigo */
  --brand-hover:      #534be8;
  --brand-active:     #4239d6;
  --brand-tint:       rgba(99, 91, 255, 0.08);

  /* Status Colors (Pastel Harmony) */
  --status-success:   #10b981;             /* Emerald */
  --status-warning:   #f59e0b;             /* Amber */
  --status-danger:    #ef4444;             /* Rose */

  /* Elevation (Multi-layer luxury shadow stack) */
  --shadow-card:      0 0 0 1px rgba(15, 23, 42, 0.02), 0 1px 2px -0.5px rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.04), 0 16px 32px -4px rgba(15, 23, 42, 0.02);
  --shadow-drawer:    -12px 0 35px rgba(15, 23, 42, 0.12), -1px 0 3px rgba(15, 23, 42, 0.04);

  /* Radii */
  --radius-button:    8px;
  --radius-card:      14px;
  --radius-modal:     16px;
}
```

---

## 3. Stitch Master Prompt Generator (MengTo Spec-Driven)

When generating screens in **Stitch**, use this exact prompt skeleton:

```text
GOAL
- Product: Brio.md School Management Platform
- Surface: [Insert: e.g., Student Profile Hub / Operating Dashboard]
- Persona: [Insert: e.g., School Administrator / Teacher]
- Key Objective: [Insert: e.g., Mark class attendance in 30 seconds with 0 cognitive load]

FORMAT
- Viewport: Desktop 1440px (or Mobile 390px for teacher phone view)
- Layout Grid: Asymmetric 12-column (7 cols primary, 5 cols secondary)

TYPE SYSTEM
- Font Family: Inter / System Sans, OpenType cv02/cv03 enabled
- Heading Scale: Deep navy #061b31, font-semibold (weight 600), tracking -0.02em
- Body Scale: 14px font-normal (weight 400), text-slate-600
- Numbers & Dates: Strictly tabular-nums

COLOR & MATERIAL
- Canvas: #f4f6f8
- Cards: #ffffff with 1px border #e5edf5, soft 2px elevation shadow
- Accent: Stripe violet #635bff for primary actions only
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

---

## 4. Component Implementation Recipes

### 1. Primary Action Button
```tsx
<button className="px-3.5 py-2 text-xs font-semibold text-white bg-[#635bff] hover:bg-[#534be8] active:bg-[#4239d6] rounded-lg shadow-sm transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#635bff]/20 focus-visible:outline-none">
  {label}
</button>
```

### 2. Status Dot Component
```tsx
<span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
  <span>Active</span>
</span>
```

### 3. Hairline Card Container
```tsx
<div className="bg-white rounded-xl border border-[#e5edf5] p-5 shadow-[0_2px_5px_rgba(50,50,93,0.04),0_1px_2px_rgba(0,0,0,0.03)]">
  {children}
</div>
```

---

## 5. Verification Checklist Before Code Commit

1. **Squint Test:** Does one primary focal point clearly stand out on the screen?
2. **Proximity Check:** Are related fields grouped by distance, without unnecessary container borders?
3. **Contrast:** Does all body text clear WCAG AA contrast (≥ 4.5:1 against card background)?
4. **Tabular Numerals:** Are all dates, timestamps, phone numbers, and financial amounts rendered with `tabular-nums`?
5. **No AI Tells:** Are there zero emojis, zero thick badge pills, and zero marketing filler adjectives?
