---
name: accessibility-wcag
description: Guarantee that all admin dashboard pages, components, data tables, dialogs, forms, and navigation controls meet WCAG 2.2 Level AA accessibility standards by default.
---

# Skill: accessibility-wcag

## Purpose

Guarantee that all admin dashboard pages, components, data tables, dialogs, forms, and navigation controls meet WCAG 2.2 Level AA accessibility standards by default.

## When to use

Use during the design, implementation, and quality assurance of any user interface element, form input, modal, data table, or screen reader experience.

## Mandatory rules

1. **Semantic HTML Structure**:
   - Exactly one `<h1>` per page representing the view title.
   - Proper heading hierarchy (`<h1>` followed by `<h2>`, `<h3>` without skipping levels).
   - Use landmark elements: `<header>`, `<main>`, `<nav>`, `<aside>`, `<section>`, `<footer>`.
2. **Keyboard Navigation & Focus Management**:
   - Every interactive control must be reachable and operable via keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`, arrow keys).
   - Never suppress focus rings with `outline-none` or `focus:ring-0` unless replacing them with an explicit, high-contrast custom focus ring (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`).
   - Dialogs and sheets must trap focus while open, autofocus the first logical input or close button, and restore focus to the trigger upon dismissal.
3. **Form Controls & Labels**:
   - Every input, select, textarea, checkbox, and switch must have an associated `<Label>` via `htmlFor`/`id` or `aria-labelledby`.
   - Error messages must be linked to inputs using `aria-describedby` and flagged with `aria-invalid="true"`.
   - Form submission buttons must declare explicit `type="submit"`.
4. **Color Contrast & Indicators**:
   - Contrast ratio of text and interactive controls against their background must be at least 4.5:1 for normal text (14pt/18px regular) and 3:1 for large text or essential graphical elements.
   - Never use color alone to convey state or status. Accompany status badges with icons, text, or screen-reader descriptions (e.g., green dot + "Published" label).
5. **Screen Reader Support**:
   - Icon-only buttons must include an `aria-label` or `<span className="sr-only">Label</span>`.
   - Dynamic live updates (e.g., toast alerts, real-time counters) must use `role="status"` or `aria-live="polite"`.

## Workflow

1. Map keyboard tab order through the view.
2. Check for missing labels and aria descriptors on form elements.
3. Run axe-core / Playwright accessibility checks during test runs.
4. Test with keyboard only (without mouse): Tab into, interact, and Tab out.
5. Inspect both light and dark mode colors for WCAG AA contrast compliance.

## Anti-patterns

- `div` or `span` with an `onClick` handler without `role="button"`, `tabIndex={0}`, and `onKeyDown`.
- Removing focus outlines (`outline: none` without focus-visible styles).
- Form inputs without corresponding labels or with placeholder-only labels.
- Invisible screen reader labels or vague labels like "click here" or "edit".

## Review checklist

- [ ] Exactly one `h1` landmark per route.
- [ ] Visible focus indicator on all interactive elements.
- [ ] Screen-reader accessible labels on icon buttons.
- [ ] Color contrast verified in both light and dark modes.
- [ ] Modal dialogs trap focus and restore focus on close.
