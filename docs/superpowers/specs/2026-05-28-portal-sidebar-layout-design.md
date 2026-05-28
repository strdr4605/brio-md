# Portal Sidebar + Content Layout Design

**Date:** 2026-05-28
**Status:** Approved

## Overview

Mobile-first responsive layout for the portal dashboard app with adaptive navigation.

## Layout Structure

### Mobile (<768px)
- Fixed bottom navigation bar
- Icons only (no text labels on mobile)
- 4 items: Dashboard, Utilizatori, Studenţi, Setări
- Tap targets ≥44px
- Content area fills remaining viewport height

### Tablet+ (≥768px)
- Fixed left sidebar (200px width)
- Icon + label for each nav item
- Sidebar pushes content (no overlay)
- Same navigation items with full labels

## Navigation Items

| Icon | Label | Route (planned) |
|------|-------|-----------------|
| 🏠 | Dashboard | /dashboard |
| 👥 | Utilizatori | /dashboard/utilizatori |
| 👨‍🎓 | Studenţi | /dashboard/studenti |
| ⚙️ | Setări | /dashboard/setari |

## Technical Approach

- Tailwind CSS for responsive breakpoints (`md:`)
- Next.js App Router layout structure
- Mobile bottom nav as persistent client component
- Sidebar as separate component rendered at layout level
- CSS `hidden md:block` pattern for nav switch
- Flex layout: sidebar (fixed) + content (flex-1)

## Component Structure

```
app/
  layout.tsx          # Root layout with auth check
  dashboard/
    layout.tsx        # Dashboard layout with sidebar + bottom nav
    page.tsx          # Dashboard home
    utilizatori/      # Users management
    studenti/         # Students
    setari/           # Settings
```

## Responsive Behavior

| Breakpoint | Nav Type | Sidebar |
|-----------|----------|---------|
| <768px (mobile) | Fixed bottom bar, icons only | None |
| ≥768px (tablet+) | Left sidebar with icons+labels | 200px fixed |

## Next Steps

1. Create dashboard layout component with responsive nav
2. Build bottom nav client component
3. Build sidebar client component
4. Create placeholder pages for each nav item
5. Move dashboard content into child pages
