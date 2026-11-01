# Multi-Site Authorization Matrix & Tenant Isolation

## 1. Access Levels & Roles

`multi-site-cms` defines two administrative access levels:

1. **Super Admin**: The platform owner/developer with global authority over all websites, users, domain verification, and platform-wide settings.
2. **Client Admin**: The site owner or client, strictly restricted to explicitly assigned sites in `user_role_assignments`.

---

## 2. Permissions Matrix

| Endpoint                                         | Method   | Required Permission    | Super Admin  | Assigned Client Admin  | Unassigned Client Admin |
| ------------------------------------------------ | -------- | ---------------------- | ------------ | ---------------------- | ----------------------- |
| `/api/v1/sites`                                  | `POST`   | `site:create`          | ✅ Allowed   | ❌ 403 Forbidden       | ❌ 403 Forbidden        |
| `/api/v1/sites`                                  | `GET`    | Authenticated          | ✅ All sites | ✅ Assigned sites only | ❌ Empty list           |
| `/api/v1/sites/:siteId`                          | `GET`    | Authenticated          | ✅ Allowed   | ✅ Allowed             | ❌ **404 Not Found**    |
| `/api/v1/sites/:siteId`                          | `PATCH`  | `site:update`          | ✅ Allowed   | ❌ 403 Forbidden       | ❌ **404 Not Found**    |
| `/api/v1/sites/:siteId`                          | `DELETE` | `site:delete`          | ✅ Allowed   | ❌ 403 Forbidden       | ❌ **404 Not Found**    |
| `/api/v1/sites/:siteId/domains`                  | `GET`    | Authenticated          | ✅ Allowed   | ✅ Allowed             | ❌ **404 Not Found**    |
| `/api/v1/sites/:siteId/domains`                  | `POST`   | `domain:manage`        | ✅ Allowed   | ❌ 403 Forbidden       | ❌ **404 Not Found**    |
| `/api/v1/sites/:siteId/domains/:domainId`        | `PATCH`  | `domain:manage`        | ✅ Allowed   | ❌ 403 Forbidden       | ❌ **404 Not Found**    |
| `/api/v1/sites/:siteId/domains/:domainId`        | `DELETE` | `domain:manage`        | ✅ Allowed   | ❌ 403 Forbidden       | ❌ **404 Not Found**    |
| `/api/v1/sites/:siteId/domains/:domainId/verify` | `POST`   | `domain:verify`        | ✅ Allowed   | ❌ 403 Forbidden       | ❌ **404 Not Found**    |
| `/api/v1/sites/:siteId/settings/*`               | `PATCH`  | `site:update_settings` | ✅ Allowed   | ✅ Allowed             | ❌ **404 Not Found**    |
| `/api/v1/public/sites/*`                         | `GET`    | None (Public)          | ✅ Allowed   | ✅ Allowed             | ✅ Allowed              |

---

## 3. Cross-Tenant IDOR Prevention (404 vs 403 Policy)

A core security invariant of this architecture is **zero tenant enumeration**:

- If an ordinary Client Admin issues a request targeting a `siteId` to which they have **no assignment**, the API responds with **`404 NOT FOUND`** rather than `403 FORBIDDEN`.
- **Reasoning**: A `403 FORBIDDEN` response confirms to an attacker that the targeted resource UUID exists on the platform. A `404 NOT FOUND` completely conceals the existence of unassigned tenant resources.

```typescript
// Authorization check in SitesAdminService
if (!user.isSuperAdmin && !user.authorizedSiteIds.includes(siteId)) {
  throw new ApiException('NOT_FOUND', 'Site not found', HttpStatus.NOT_FOUND, 'SITE_NOT_FOUND');
}
```

---

## 4. Audit Logging for Multi-Site Events

All site and domain administrative mutations record an append-only audit entry in `audit_events`.

| Action Name              | Target Entity | Metadata Recorded                          |
| ------------------------ | ------------- | ------------------------------------------ |
| `site.create`            | `site`        | `{ key, name, defaultLocale }`             |
| `site.update`            | `site`        | `{ changes: [...] }`                       |
| `site.delete`            | `site`        | `{ reason: 'archived' }`                   |
| `site.update_branding`   | `site`        | `{ updatedFields: ['primaryColor', ...] }` |
| `site.update_navigation` | `site`        | `{ itemCount: 4 }`                         |
| `site.update_seo`        | `site`        | `{ titleTemplate, canonicalHost }`         |
| `site.update_locales`    | `site`        | `{ defaultLocale, supportedLocales }`      |
| `domain.create`          | `site_domain` | `{ hostname, isPrimary }`                  |
| `domain.update`          | `site_domain` | `{ isPrimary }`                            |
| `domain.delete`          | `site_domain` | `{ hostname }`                             |
| `domain.verify`          | `site_domain` | `{ hostname, verifiedAt }`                 |
