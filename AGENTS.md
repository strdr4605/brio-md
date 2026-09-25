# DB Migrations

When modifying `packages/db/src/schema.ts`, always generate a migration:

```bash
cd packages/db
npm run generate   # or: npx drizzle-kit generate
```

Review the generated SQL in `packages/db/drizzle/` before committing.

# PR Sizing and Decomposition

- **PR Target Size:** Prefer keeping changes under ~200 lines of code per PR, excluding auto-generated files such as lockfiles and migrations. This is a guideline, not a hard limit.

- **Propose Plan First:** If a task is expected to require substantially more than ~200 lines of code or involves multiple independent concerns, do not start coding immediately. First propose a breakdown into small, standalone PRs and wait for approval.

- **Slicing Principles:**
  - **Refactor first:** Preparatory refactoring or cleanup should be a separate PR with no behavior changes.
  - **Dependencies first:** In this monorepo, changes to shared `packages/*` must precede changes to consuming `apps/*`.
  - **Contract first:** Define shared types, configs, interfaces, or schemas before implementing the logic that depends on them.
  - **Incremental depth:** Implement the minimal working path first. Handle edge cases, complex validation, error handling, and polish in follow-up PRs when practical.
  - **Avoid Artificial Splitting:** Do not split a tightly coupled change merely to satisfy the line-count target. Keep logically dependent changes together when separating them would make the PR harder to understand, review, test, or maintain.
  - **No Speculative Work:** Do not implement future features, unnecessary abstractions, or unrelated refactors unless they are required for the current task.

- **PR Scope:** Each PR should address one clear purpose or logical change. Avoid mixing unrelated features, refactors, dependency upgrades, formatting changes, or cleanup into the same PR.

- **Before Coding:** For tasks that require decomposition, present the proposed PR sequence, explain the purpose of each PR, and identify dependencies between them. Do not write code until the plan is approved.

- **After Each PR:** Verify that the affected code compiles, passes `npm run lint`, and builds successfully before considering the PR complete.

# UI & Design System Standards

- **Single Source of Truth:** All UI work must adhere strictly to [`docs/DESIGN_SYSTEM.md`](file:///Users/Apple/Documents/Homework/Practice/project/brio-md/docs/DESIGN_SYSTEM.md) (**Precision Slate Minimal** standard).
- **Shared Primitives First:** Never invent custom ad-hoc button, card, badge, or modal styles using raw Tailwind strings in feature pages. Always consume shared primitives from `@brio-md/ui`:
  - `<Button variant="primary" | "secondary" | "warning" | "ghost">`
  - `<Card>` (`<CardHeader>`, `<CardContent>`, `<CardFooter>`)
  - `<StatusDot status="active" | "warning" | "error" | "neutral">`
  - `<Tabs>`
  - `<StatCard>`
  - `<AlertBanner>`
- **Low Cognitive Load:** Follow Progressive Disclosure. Do not dump historical tables and deep settings directly onto the main page; defer secondary details into tabs, slide-over drawers, or modal dialogs.
- **Stitch Design Alignment:** When generating screens in Stitch, use the `Precision Slate Minimal` tokens (Canvas `#F8FAFC`, Surface `#FFFFFF`, Border `#E2E8F0`, Primary Button `#0F172A`).
- **Zero AI-Slop:** Strictly no emojis in buttons, no rainbow badge pills, no glowing orbs, no nested cards inside cards. Group by whitespace.

