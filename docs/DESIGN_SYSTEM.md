# Brio.md Design System & UI Standard (Linear Precision × MengTo)

> **Single Source of Truth** for UI/UX across Brio.md (Portal, Learn, Landing).  
> All developers and AI agents must strictly adhere to this specification.

---

## 1. Brand & Style

This design system delivers a high-density, keyboard-first visual environment engineered for developers, engineering leaders, and high-velocity product teams. Its aesthetic is grounded in absolute visual restraint, architectural rigor, and functional efficiency.

- **Design Philosophy:** Minimalist precision engineering. Visual chrome is minimized to eliminate cognitive friction; hierarchy is reinforced strictly through typographic scales, deliberate micro-spacing, and structural 1px borders rather than saturated fills or aggressive drop shadows.
- **Atmosphere & Tone:** Hyper-focused, rapid, quiet, and dependable. The interface feels like a finely tuned instrument—subtle, instant, and frictionless.
- **Interaction Priority:** Speed and predictability. Keyboard shortcuts, command palettes (`Cmd+K`), dense tabular listings, and low-latency interaction states sit at the center of the experience.
- **MengTo Laws (Zero AI-Slop):**
  - **1. Близость вместо коробок (Proximity over containers):** Не нужно упаковывать каждую строчку в рамочку. Связанные элементы группируются отступами (4px между заголовком и текстом, 24px между смысловыми блоками).
  - **2. Иерархия вместо ярлыков (Hierarchy over labels):** Размер, контраст и позиция шрифта говорят пользователю больше, чем плашки «Категория», «Статус» и «Телефон».
  - **3. Тест на удаление (Removal Test):** Каждый визуальный элемент должен решать задачу. Если убрать плашку, и смысл не потеряется — мы ее удаляем.
  - **Anti-Slop Mandate:** Строго запрещены эмодзи в кнопках (`📞`, `⚠️`), толстые радужные пилюли, градиентные светящиеся шары и декоративный мусор.

---

## 2. Design Tokens

### 2.1 Colors & Surfaces

```yaml
colors:
  canvas: '#F8FAFC'                  # Slate 50 clean base canvas
  surface: '#FFFFFF'                 # Pure white card surface
  surface-subdued: '#F1F5F9'         # Slate 100 for active tracks/headers
  surface-hover: '#F8FAFC'           # Row hover
  border: '#E2E8F0'                  # Slate 200, strictly 1px
  border-focus: '#0F172A'            # Slate 900
  on-surface: '#0F172A'              # Slate 900 primary text
  on-surface-variant: '#475569'      # Slate 600 secondary text
  text-muted: '#94A3B8'              # Slate 400 tertiary metadata
  primary: '#0F172A'                 # Crisp dark slate / black interactive action
  on-primary: '#FFFFFF'
  accent-indigo: '#4F46E5'           # Deep indigo focus
  status-active: '#10B981'           # Emerald 500
  status-warning: '#F59E0B'          # Amber 500
  status-warning-bg: '#FFFBEB'       # Amber 50
  status-warning-border: '#FEF08A'   # Amber 200
  status-warning-btn: '#D97706'      # Amber 600 CTA
  status-error: '#F43F5E'            # Rose 500
```

### 2.2 Elevation & Depth

Visual hierarchy is primarily articulated through planar 1px borders and contrasting fills rather than heavy drop shadows:
- **Micro-Elevation (Level 1):** `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04);` paired strictly with `border: 1px solid #E2E8F0`.
- **Raised Surfaces (Level 2):** `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05);` with `border: 1px solid #CBD5E1`.
- **Command Overlays & Modals (Level 3):** `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05);` with backdrop `rgba(15, 23, 42, 0.25)` and `backdrop-filter: blur(4px)`.

### 2.3 Shapes & Radii

- **Base Radius (`rounded-md`, 4px–6px):** Buttons, inputs, badge tags, inline code snippets.
- **Container Radius (`rounded-lg`, 8px):** Cards, list containers, dropdown menus.
- **Dialog Radius (`rounded-xl`, 12px):** Modals, slide-over panels.
- **Pill Radius (`rounded-full`, 9999px):** Status dots and circular avatars only.

---

## 3. Typography & Numbers

- **Headlines & Section Titles:** `Geist` or `Inter`, font-weight 600, `tracking-tight` (-0.02em).
- **Body & Controls:** `Inter`, font-weight 400, 13px–14px, line-height 20px–22px.
- **Metrics, Timestamps, Identifiers:** `JetBrains Mono` or `Inter` with `tabular-nums` (`font-feature-settings: "tnum" on, "cv02" on, "cv03" on, "cv04" on`).

---

## 4. Components

- **Primary Button:** `#0F172A` background, `#FFFFFF` text, 1px border `#0F172A`, height 32px–36px, font `Inter` 13px medium, radius 6px.
- **Secondary Button:** `#FFFFFF` background, `#0F172A` text, 1px border `#E2E8F0`, hover `#F8FAFC`, radius 6px.
- **Warning Callout Button:** `#D97706` background, `#FFFFFF` text, radius 6px.
- **Status Dots:** 6px solid dots (`bg-emerald-500`, `bg-amber-500`, `bg-slate-400`) accompanied by clean neutral text.
- **Data Tables:** Row division `1px solid #E2E8F0`, header row background `#FFFFFF` or `#F8FAFC`, row hover `#F8FAFC`. Monospace tabular numbers right-aligned.
