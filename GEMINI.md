# Brio.md Project Directives & Design System

You are an expert full-stack developer working on the Brio.md educational portal monorepo.

## 1. UI & Design System (Strict Enforcement)
Whenever creating or editing UI components or pages:
- **Single Source of Truth:** Strictly follow `DESIGN_SYSTEM.md`.
- **Monochrome & Slate First:**
  - Page Backgrounds: `bg-slate-50` (`#F8FAFC`).
  - Cards & Containers: `bg-white`, `border border-slate-200/80`, `rounded-2xl`, `p-6`, `hover:border-slate-300 hover:shadow-sm`.
  - Icon Containers: strictly `w-12 h-12 rounded-xl bg-slate-100 text-slate-700` with icons `w-6 h-6` to `w-7 h-7`.
  - Typography: KPI values `text-3xl sm:text-4xl font-black text-slate-900`, Card titles `text-base font-semibold text-slate-800`, section headings `text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide`.
- **Absolute Bans:**
  - NEVER use rainbow gradient card backgrounds (no blue/purple/orange card gradients).
  - NEVER use background glow blur orbs.
  - NEVER introduce unnecessary quick-action blocks or decorative unclickable status pills.
- **Semantic Colors Only:**
  - Emerald (`emerald-600`): Positive growth, fully paid, operational.
  - Rose (`rose-600`): Overdue debt, arrears, errors.
  - Slate (`slate-500` / `slate-600`): General metrics, counts.
- **Component Reuse:** Use `@/components/dashboard/MetricCard` for metric indicators.

## 2. Code Budget & Quality Gates
- **Max 350 Lines per File:** Any source file must not exceed 350 lines. Break complex pages into modular components.
- **Type Safety:** Always ensure `npx tsc --noEmit` and `npx vitest run` pass before finishing.
- **DB Migrations:** When changing `packages/db/src/schema.ts`, always run `npm run generate` in `packages/db`.
