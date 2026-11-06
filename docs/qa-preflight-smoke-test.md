# QA Pre-Flight Sweep & Team Manual Smoke Test Protocol

> **Reference Issue:** [#251](https://github.com/strdr4605/brio-md/issues/251)  
> **Target Devices:**
> - Android (Samsung / Xiaomi Redmi): `360 x 800`
> - iOS (iPhone 14 / 15): `390 x 844`
> - Desktop / Laptop: `1440 x 900`

---

## Phase 1: Automated Scout Sweep (Playwright)

Before distributing any pilot links or merging release branches, run the automated sweep:

```bash
# Run full pre-flight sweep headlessly
npm run test:preflight
```

### Automated Verifications Covered:
1. **Zero Horizontal Viewport Overflow:**  
   Verifies `document.documentElement.scrollWidth <= window.innerWidth` across all 3 viewports on core routes (`/dashboard`, `/dashboard/students`, `/dashboard/invoices`, `/dashboard/attendance`, `/dashboard/schedule`, `/dashboard/courses`, `/dashboard/users`).
2. **Console & Hydration Sentry:**  
   Fails immediately on unhandled exceptions, console errors, or React hydration mismatch errors.
3. **Network Sentry:**  
   Fails on any `404` or `500` HTTP status codes for critical resources.
4. **Form Smoke Run:**  
   Tests creating and deleting a student with a valid Moldovan phone number (`+373 69 123456`).
5. **Visual Screenshots:**  
   Full-page screenshots of all pages on all 3 viewports are automatically saved to `test-results/preflight/`.

---

## Phase 2: Team Manual Smoke Test (15 Minutes)

Once Phase 1 passes, team members should perform an intuitive 15-minute manual check on their physical mobile phones and laptops:

### Checklist:
- [ ] **Language & Tone:** Switch between RO and RU in the header/settings. Ensure educational terms make sense for Moldovan schools (no clumsy machine translations).
- [ ] **Thumb Usability:** Are action buttons easy to tap with one thumb? Does the on-screen keyboard push form inputs into view without breaking the layout?
- [ ] **Empty State Clarity:** Search for a non-existent student name in the catalog. Does the UI show a clean, friendly empty state?
- [ ] **First Impression "Gut Check":** Does the platform feel fast, trustworthy, and enterprise-grade?

### Bug Reporting Template:
Post any findings as comments on Issue #251:
```text
- Screen: /dashboard/...
- Device: [e.g. iPhone 14 Safari / Xiaomi Redmi Note Chrome]
- Issue: [What felt broken or looks off]
- Screenshot: [Attach image]
```
