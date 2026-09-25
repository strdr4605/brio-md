# Brio.md Design System & UI Standard (Precision Slate Minimal)

> **Single Source of Truth** for UI/UX across Brio.md (Portal, Learn, Landing).  
> Calibrated with **Google Stitch**, **Linear Precision**, and **MengTo Spatial Restraint**.  
> All developers (Dev 1, 2, 3, 4) and AI coding agents must strictly adhere to this specification.

---

## 1. Brand & Style Philosophy

This design system delivers a high-density, keyboard-first visual environment engineered for academy administrators, teachers, and operations teams. Its aesthetic is grounded in absolute visual restraint, architectural rigor, and functional efficiency.

- **Restraint Over Decoration:** Zero decorative fluff, no gratuitous glow or neon gradients, no stacked card-in-card containers, and no emojis in operational UI.
- **Architectural Utility:** Hierarchy is achieved via strict typographic cadence, intentional whitespace grouping, and delicate 1px perimeter definition rather than competing backgrounds.
- **MengTo Laws (Zero AI-Slop):**
  - **1. Близость вместо коробок (Proximity over containers):** Не нужно упаковывать каждую строчку в рамочку. Связанные элементы группируются отступами (4px между заголовком и текстом, 24px между смысловыми блоками).
  - **2. Иерархия вместо ярлыков (Hierarchy over labels):** Размер, контраст и позиция шрифта говорят пользователю больше, чем плашки «Категория», «Статус» и «Телефон».
  - **3. Тест на удаление (Removal Test):** Каждый визуальный элемент должен решать задачу. Если убрать плашку, и смысл не потеряется — мы ее удаляем.
  - **Anti-Slop Mandate:** Строго запрещены эмодзи в кнопках (`📞`, `💬`, `⚠️`), толстые радужные пилюли, градиентные светящиеся шары и декоративный мусор.

---

## 2. Design Tokens (Stitch Master Specification)

```yaml
name: Precision Slate Minimal
colors:
  canvas: '#F8FAFC'                  # Slate 50 base layer (calm, non-glaring)
  surface: '#FFFFFF'                 # Pure white functional plane for cards, sheets, modals
  surface-subdued: '#F1F5F9'         # Slate 100 for active tracks/table headers
  surface-hover: '#F8FAFC'           # Row hover
  border: '#E2E8F0'                  # Slate 200, strictly 1px structural hairline
  border-focus: '#0F172A'            # Slate 900
  on-surface: '#0F172A'              # Slate 900 primary text
  on-surface-variant: '#475569'      # Slate 600 secondary text
  text-muted: '#94A3B8'              # Slate 400 tertiary metadata
  primary: '#0F172A'                 # Crisp dark slate / black interactive action
  on-primary: '#FFFFFF'
  accent-indigo: '#4F46E5'           # Deep indigo focus / brand mark
  status-active: '#10B981'           # Emerald 500 live/active status
  status-warning: '#F59E0B'          # Amber 500 pending/warning
  status-warning-bg: '#FFFBEB'       # Amber 50 alert callout background
  status-warning-border: '#FEF08A'   # Amber 200 alert border
  status-warning-btn: '#D97706'      # Amber 600 urgent action button
  status-error: '#F43F5E'            # Rose 500 error state
```

### 2.1 Elevation & Shadows

Depth is minimal and razor-sharp, favoring planar clarity over heavy drop shadows:
- **Layer 0 (Canvas):** Flat `#F8FAFC` without shadow or stroke.
- **Layer 1 (Card & Inline Surfaces):** `#FFFFFF` paired with `1px solid #E2E8F0` hairline border and micro-shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Layer 2 (Dropdowns, Popovers & Context Menus):** `#FFFFFF` with `1px solid #E2E8F0` and `0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Layer 3 (Modals & Command Palettes):** `#FFFFFF` with `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)` with neutral backdrop (`rgba(15, 23, 42, 0.25)` and `backdrop-filter: blur(4px)`).

### 2.2 Radii & Geometry

Consistent, compact curvature:
- **Controls & Buttons:** Strictly `6px` (`rounded-[6px]`).
- **Cards & Data Surfaces:** Strictly `8px` (`rounded-lg` / `rounded-[8px]`).
- **Status Dots / Avatars:** Circular (`rounded-full`, `9999px`).

---

## 3. Typography & Numbers

- **Headlines & Section Titles:** `Geist` or `Inter`, font-weight 600, negative letter-spacing (`-0.03em` to `-0.015em`).
- **Body & Controls:** `Inter` or `Geist`, font-weight 400, 13px–15px, line-height 20px–24px.
- **Metrics, Timestamps, Identifiers:** Strictly `tabular-nums` (`font-feature-settings: "cv02", "cv03", "cv04", "cv11", "tnum"`). Prevents numerical column jitter.
- **Sentence Case:** Always sentence case (`Отметить урок`, `Смотреть`, `Активные ученики`). Never ALL CAPS.

---

## 4. Shared Component Library (`@brio-md/ui`)

All feature pages must import and consume components from `@brio-md/ui`:

| Component | Responsibility & Variants |
| :--- | :--- |
| **`Button`** | `variant: "primary"` (`#0F172A`), `"secondary"` (white with `#E2E8F0` border), `"warning"` (`#D97706`), `"ghost"`. Sizes: `"sm"`, `"md"`, `"lg"`. Radius `6px`. |
| **`Card`** | Base surface with `bg-white border border-[#E2E8F0] rounded-[8px] micro-shadow`. Slots: `CardHeader`, `CardContent`, `CardFooter`. |
| **`StatusDot`** | 6px circular dot (`emerald`, `amber`, `rose`, `slate`) + text label. Optional soft pill wrapper. |
| **`Tabs`** | Horizontal tab navigation with solid `#0F172A` active bottom border (`border-b-2`). |
| **`StatCard`** | High-density dashboard KPI card: title, badge delta, tabular metric, sparkline/description, footer note. |
| **`AlertBanner`** | Urgent operational alert banner (`#FFFBEB`, `#FEF08A`) with pulsing amber dot and action CTA button. |
