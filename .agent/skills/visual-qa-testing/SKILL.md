---
name: visual-qa-testing
description: Standardize visual QA, multi-viewport responsive checks (1440px desktop, 768px tablet, 375px mobile), and dual-theme verification.
---

# Skill: visual-qa-testing

## Purpose

Standardize automated and semi-automated visual verification, responsive breakpoint testing, and regression prevention for the CMS administration dashboard and public websites.

## When to use

Use whenever validating new UI features, refactored components, theme changes, or before committing production code.

## Mandatory rules

1. **Multi-Viewport Matrix**:
   - Every route and responsive component must be validated across three primary standard viewports:
     - **Desktop**: 1440 × 900 px (Primary admin density target).
     - **Tablet**: 768 × 1024 px (Sidebar collapsed / mobile drawer navigation).
     - **Mobile**: 375 × 667 px (Full stack, scrollable tables, accessible touch targets min 44×44px).
2. **Dual-Theme Verification**:
   - Both `light` and `dark` themes must be verified for contrast, legibility, borders, shadows, and status colors.
3. **Automated Browser Automation Protocol**:
   - Leverage `chrome-devtools-mcp` MCP tools or Playwright test suites for real visual checks.
   - Ports:
     - Admin: `http://localhost:5000`
     - Travel Blog: `http://localhost:5001`
     - Air Sports: `http://localhost:5002`
     - API: `http://localhost:4000/api/v1`
4. **Console & Network Zero-Error Baseline**:
   - Visual QA is not complete until `list_console_messages` or browser logs show zero uncaught JavaScript exceptions, zero React hydration errors, and zero failed network requests (HTTP 4xx/5xx).
5. **No Visual Regressions**:
   - Check alignment of headers, icon baselines, table cell padding, dropdown overlay z-indices, and sticky header offsets.

## Workflow

1. Start dev server or ensure target port is active and healthy.
2. Navigate to target URL using browser tools or Playwright.
3. Execute viewport resize to Desktop (1440px), Tablet (768px), and Mobile (375px).
4. Inspect console logs and network activity.
5. Capture screenshots at critical states (empty, loaded, modal open, dropdown open).
6. Verify layout stability and touch target sizes.

## Anti-patterns

- Declaring a page "verified" without testing on mobile and tablet widths.
- Ignoring React hydration errors (`Warning: Text content did not match`).
- Overlapping sticky headers obscuring modal dialogs due to incorrect z-index layering.
- Horizontal scrolling on mobile screens caused by unconstrained table widths.

## Review checklist

- [ ] Tested on 1440px desktop, 768px tablet, and 375px mobile.
- [ ] Light and dark modes verified.
- [ ] Zero console errors or warnings.
- [ ] No unwanted horizontal scrollbars on mobile.
