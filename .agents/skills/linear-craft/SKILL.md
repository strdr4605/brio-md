---
name: linear-craft
description: "Design and implement production-grade, minimalist, high-density web UI/UX for Brio.md. Blends Linear Precision engineering (pure white/slate-50 canvas, crisp 1px #E2E8F0 borders, dark slate #0F172A primary buttons, JetBrains Mono numbers) with MengTo's craft laws (Proximity over containers, Hierarchy over labels, Removal test) and UI-Craft dense dashboard standards. Zero AI-slop."
argument-hint: "[action: build|review|polish|prompt] [target]"
---

# Linear Precision — The Brio.md Official Design Engineering Standard

You are a Senior SaaS Architect building Brio.md. You strictly implement the **Linear Precision × MengTo UI-Craft Synthesis** aesthetic: ultra-clean, minimalist, high-density, and dependable.

---

## 1. Absolute Visual Restraint & Anti-Slop Doctrine

- ❌ **No AI-slop decorations:** Strictly NO purple glowing gradients, NO floating radial blur orbs, NO emojis in buttons (`📞`, `⚠️`), NO rainbow badge pills.
- ❌ **No artificial heavy shadows:** Use micro-elevation only: `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04);` paired with `1px solid #E2E8F0`.
- ❌ **No nested container clutter (MengTo Law #1):** Do not wrap every field or row in a colored box. Group with whitespace: `gap-1` (4px) for label/description, `gap-4` (16px) between controls, `gap-6` (24px) between sections.
- ❌ **No redundant labels (MengTo Law #2):** Delete prefixes like `Status:`, `Phone:`, `Category:`. Font size, position, and color convey hierarchy.
- ❌ **The Removal Test (MengTo Law #3):** Mentally delete every border, chip, and badge. If meaning and action survive, delete the element permanently.

---

## 2. Design Tokens (Linear Precision Standard)

```css
:root {
  /* Canvas & Surfaces */
  --canvas:           #f8fafc;             /* Slate 50 clean canvas */
  --surface-card:     #ffffff;             /* Pure white card surface */
  --surface-subdued:  #f1f5f9;             /* Slate 100 for tracks/headers */
  --surface-hover:    #f8fafc;             /* Row hover */

  /* Structural 1px Borders */
  --border:           #e2e8f0;             /* Slate 200, strictly 1px */
  --border-focus:     #0f172a;             /* Slate 900 */

  /* Typography Colors */
  --text-heading:     #0f172a;             /* Slate 900 for titles and key metrics */
  --text-body:        #334155;             /* Slate 700 standard text */
  --text-muted:       #64748b;             /* Slate 500 secondary labels */
  --text-tertiary:    #94a3b8;             /* Slate 400 timestamps & metadata */

  /* Interactive Actions */
  --btn-primary-bg:   #0f172a;             /* Crisp dark slate / black */
  --btn-primary-text: #ffffff;
  --btn-secondary-bg: #ffffff;
  --btn-secondary-border: #e2e8f0;
  --btn-secondary-text: #0f172a;
  --btn-warning-bg:   #d97706;             /* Amber 600 for urgent callouts */

  /* Status Colors */
  --status-active:    #10b981;             /* Emerald 500 */
  --status-warning:   #f59e0b;             /* Amber 500 */
  --status-neutral:   #94a3b8;             /* Slate 400 */

  /* Elevation */
  --shadow-card:      0 1px 2px 0 rgba(15, 23, 42, 0.04);
  --shadow-dropdown:  0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05);

  /* Radius (Sharp, Restrained) */
  --radius-sm:        4px;                 /* Buttons, badges, inputs */
  --radius-md:        6px;                 /* Sub-cards, controls */
  --radius-lg:        8px;                 /* Main cards, panels */
  --radius-full:      9999px;              /* Status dots, avatars */
}
```

---

## 3. Typography & Micro-Typography Rules

- **Display & Headings:** Geist or Inter (`font-semibold`, tracking `-0.02em`).
- **Body & Controls:** Inter (`font-normal` 13px–14px, line-height 20px–22px).
- **Numbers, Prices, Dates:** JetBrains Mono or Inter with `tabular-nums` (`font-feature-settings: "tnum" on, "cv02" on, "cv03" on, "cv04" on`).
- **Sentence Case:** Never write ALL CAPS in buttons or headers. Write `Отметить урок`, `Смотреть`, `Активные ученики`.

---

## 4. Canonical Component Implementations

### Primary Button (Solid Black / Slate 900)
```tsx
<button className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#0f172a] hover:bg-[#1e293b] active:bg-[#000000] rounded-md transition shadow-xs">
  Отметить урок
</button>
```

### Secondary Button (White Outline)
```tsx
<button className="px-3.5 py-1.5 text-xs font-medium text-[#0f172a] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1] rounded-md transition shadow-xs">
  Смотреть
</button>
```

### Warning Banner & Action Button
```tsx
<div className="p-3.5 rounded-lg border border-[#fef08a] bg-[#fffbeb] flex items-center justify-between gap-3 text-xs text-[#92400e]">
  <div className="flex items-center gap-2">
    <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
    <span><strong>2 урока за вчера не отмечены в журнале:</strong> Robotics Junior B и Scratch Start</span>
  </div>
  <button className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#d97706] hover:bg-[#b45309] rounded-md transition shrink-0">
    Заполнить журнал →
  </button>
</div>
```

### Clean Status Indicator
```tsx
<span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
  <span className="w-2 h-2 rounded-full bg-emerald-500" />
  <span>Активен</span>
</span>
```

### 1px Border Card
```tsx
<div className="bg-white rounded-lg border border-[#e2e8f0] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
  {children}
</div>
```

---

## 5. Master Prompt Template for Stitch & AI Agents

When generating interfaces in Stitch or prompt-driven AI tools:

```text
GOAL
- Product: Brio.md School Management Platform
- Surface: [Insert screen: e.g. Operating Dashboard / Student Profile Hub]
- Aesthetic: Linear Precision × MengTo UI-Craft Synthesis
- Tone: Technical, minimal, dependable, hyper-focused

DESIGN TOKENS
- Canvas: #f8fafc (Slate 50)
- Surface: #ffffff pure white cards with 1px border #e2e8f0
- Primary Action: Crisp dark slate #0f172a button with white text
- Secondary Action: White button with 1px border #e2e8f0
- Elevation: Ultra-subtle 0 1px 2px 0 rgba(15, 23, 42, 0.04)
- Numbers: Tabular figures, JetBrains Mono font-variant

NEGATIVE CONSTRAINTS
- Strictly no emojis in buttons or labels
- No purple or neon gradients, no glowing ambient orbs
- No thick rainbow badge pills
- No rounded-3xl cartoon shapes (strictly 6px–8px radius)
- No nested colored boxes inside cards (Proximity over containers)
```
