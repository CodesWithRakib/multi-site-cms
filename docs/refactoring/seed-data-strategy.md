# Deterministic Seed Data Strategy & Test Fixtures

**Date:** 2026-11-01  
**Scope:** Development Database (`multi_site_cms`), Local Automated Testing  
**Database:** PostgreSQL 18.6 (Port 5433)

---

## 1. Objectives & Guiding Principles

To eliminate empty dashboard screens and ensure realistic testing of pagination, filtering, searching, and role-based permissions:

1. **Real Data Only**: No lorem ipsum gibberish or placeholder texts (`asdf`, `test1`). Content must represent genuine editorial publications for Travel Blog and Air Sports.
2. **Deterministic & Idempotent**: Seeding scripts must be repeatable using upsert operations (`ON CONFLICT DO UPDATE` or checking existing keys) so they can run multiple times without creating duplicate records.
3. **Multi-Role User Fixtures**: Dedicated accounts for Super Admin, Site-Specific Admin, and Editor roles to enable end-to-end RBAC verification.
4. **State Diversity**: Cover every lifecycle status across publications: `DRAFT`, `PUBLISHED`, `SCHEDULED`, and `ARCHIVED`.

---

## 2. Platform User Fixtures

| User Role                   | Email                         | Password             | Site Access               | Purpose                                                                     |
| --------------------------- | ----------------------------- | -------------------- | ------------------------- | --------------------------------------------------------------------------- |
| **Super Admin**             | `admin@example.com`           | `SuperAdmin123!`     | All Sites (Platform-Wide) | Testing global sites, settings, user management, and audit logs             |
| **Site Admin (Travel)**     | `travel-admin@example.com`    | `TravelAdmin123!`    | `travel-blog` only        | Verifying site-scoped administration and restriction from platform settings |
| **Site Admin (Air Sports)** | `airsports-admin@example.com` | `AirSportsAdmin123!` | `air-sports` only         | Verifying air sports event management and live update publishing            |
| **Editor**                  | `editor@example.com`          | `EditorPass123!`     | Both Sites                | Verifying content authoring without access to site configuration            |

---

## 3. Seeded Publication Data Matrix

### 3.1 Travel Blog (`travel-blog`)

- **Site ID**: `travel-blog-site-0001`
- **Primary Domain**: `localhost:5001`
- **Categories**:
  - `Destinations` (Parent: null, slug: `destinations`)
    - `Southeast Asia` (Parent: `Destinations`, slug: `southeast-asia`)
    - `European Escapes` (Parent: `Destinations`, slug: `european-escapes`)
  - `Travel Tips & Gear` (Parent: null, slug: `travel-tips`)
  - `Culinary Journeys` (Parent: null, slug: `culinary-journeys`)
- **Seeded Articles**:
  1. _Hidden Temples of Chiang Mai: A 7-Day Northern Thailand Itinerary_ (Status: `PUBLISHED`, Categories: `Southeast Asia`, Tags: `Thailand, Temples, Solo Travel`)
  2. _Sustainable Travel: How to Minimize Your Carbon Footprint Across Europe_ (Status: `PUBLISHED`, Categories: `Travel Tips & Gear`, Tags: `Eco Travel, Rail, Europe`)
  3. _The Culinary Heritage of Oaxaca: Mole, Markets, and Mezcal_ (Status: `SCHEDULED`, Release: Next Monday, Tags: `Mexico, Food, Culture`)
  4. _Winter in Hokkaido: Powder Snow, Onsens, and Sapporo Cuisine_ (Status: `DRAFT`, Tags: `Japan, Winter`)

### 3.2 Air Sports (`air-sports`)

- **Site ID**: `air-sports-site-0002`
- **Primary Domain**: `localhost:5002`
- **Categories**:
  - `Acrobatic Aviation` (slug: `acrobatic-aviation`)
  - `Paragliding & Wingsuit` (slug: `paragliding-wingsuit`)
  - `Championship Racing` (slug: `championship-racing`)
  - `Live Event Feed` (slug: `live-event-feed`)
- **Seeded Articles & Live Events**:
  1. _World Wingsuit Championship 2026: Proximity Flying Finals in Switzerland_ (Status: `PUBLISHED`, Event Timeline Active, Category: `Paragliding & Wingsuit`)
  2. _Red Bull Air Race Returns: New High-G Aircraft Specifications Announced_ (Status: `PUBLISHED`, Category: `Championship Racing`)
  3. _Weather Alert: Alpine Paragliding Grand Prix Suspended Due to Wind Shear_ (Status: `PUBLISHED`, Breaking News Flag: `true`)
  4. _Next-Gen Composite Materials Revolutionizing Competition Gliders_ (Status: `DRAFT`, Category: `Acrobatic Aviation`)

---

## 4. Execution & Integration

- Seeding script location: `apps/api/src/scripts/seed-development.ts`.
- Execution command: `pnpm --filter @multi-site-cms/api seed:dev`.
- Automated test integration: Vitest and Playwright test fixtures load these exact identities for consistent assertions.
