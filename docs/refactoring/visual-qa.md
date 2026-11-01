# Visual Quality Assurance & Multi-Viewport Testing Protocol

**Date:** 2026-11-01  
**Scope:** Automated and Manual Visual QA for `apps/admin`  
**Tooling:** Playwright, Chrome DevTools Protocol (`chrome-devtools-mcp`), Axe-core

---

## 1. Multi-Viewport Testing Matrix

Every route refactored or updated must pass verification on three required viewport dimensions:

| Viewport Category     | Width × Height  | Device Baseline            | Primary Layout Expectations                                                                                                                                                  |
| --------------------- | --------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Desktop (Primary)** | `1440 × 900 px` | Standard Laptop / Monitor  | Fixed 256px sidebar visible, full table columns visible, multi-column form grids, metric cards 4-across.                                                                     |
| **Tablet**            | `768 × 1024 px` | iPad / Tablet Portrait     | Sidebar collapses into off-canvas drawer triggered by hamburger button. Tables retain key columns; secondary columns fold into popover or row drawer. Metric cards 2-across. |
| **Mobile**            | `375 × 667 px`  | iPhone SE / Compact Mobile | Full-width single column stack. Header sticky with site switcher and hamburger menu. Tables become scrollable or card-stack layout. Touch targets minimum `44 × 44 px`.      |

---

## 2. Dual-Theme Verification

Both themes must be tested across all 15 routes:

1. **Light Theme**:
   - Background: Clean off-white (`oklch(0.99 0.002 240)`).
   - Card borders: Subtle gray (`oklch(0.89 0.008 245)`).
   - Contrast check: Text-to-background ratio $\ge 4.5:1$.
2. **Dark Theme**:
   - Background: Deep slate (`oklch(0.14 0.015 255)`).
   - Card surfaces: Elevated dark card (`oklch(0.18 0.02 255)`).
   - Contrast check: Borders distinguishable from surfaces, text-to-surface contrast $\ge 4.5:1$.

---

## 3. Zero-Tolerance Quality Gates

Before declaring any refactored route complete:

1. **Zero Uncaught Exceptions**:
   - Browser console (`list_console_messages`) must report 0 uncaught exceptions or React hydration mismatches (`Warning: Did not expect server HTML to contain a <div> in <div>`).
2. **Zero Unhandled Network Failures**:
   - Network log (`list_network_requests`) must report 0 failed API requests (HTTP 4xx/5xx).
3. **Accessibility Zero Violations**:
   - Automated axe-core scan must report 0 serious or critical accessibility violations.
   - All interactive controls have visible keyboard focus rings (`focus-visible:ring-2`).

---

## 4. Playwright Visual QA Suite Implementation

A dedicated visual test suite is configured in `e2e/visual-qa.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

for (const vp of VIEWPORTS) {
  test(`Admin Dashboard renders correctly on ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:5000/login');

    // Perform authenticated navigation
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('http://localhost:5000');
    await expect(page.locator('h1')).toBeVisible();

    // Assert no horizontal scrollbar on body
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
}
```
