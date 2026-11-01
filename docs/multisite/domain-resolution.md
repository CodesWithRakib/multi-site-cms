# Domain Management & Resolution

## 1. Domain Registry Architecture

Sites can be associated with multiple hostnames stored in the `site_domains` relation:

- **One Primary Domain**: The canonical domain used for primary navigation and canonical SEO links.
- **Aliases**: Secondary domains redirected to or serving the primary site.
- **Preview / Staging Domains**: Internal domains for staging and preview deployments.

---

## 2. Hostname Validation and Normalization

Incoming hostnames must be normalized and validated via `@multi-site-cms/validation:normalizeHostname` before persistence or database lookups.

### Normalization Rules

1. **RFC 1035 / RFC 1123 Compliance**: Labels must match `^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$`.
2. **Case Normalization**: All hostnames are transformed to lowercase ASCII.
3. **Port Stripping**: Development ports (e.g., `localhost:5000` -> `localhost`, `travel.local:3000` -> `travel.local`) are cleanly stripped.
4. **Protocol Stripping**: Erroneous prefixes (e.g., `https://` or `//`) are stripped.
5. **Rejection of Dangerous Patterns**:
   - URL paths (`/blog`), query strings (`?q=1`), and fragments (`#anchor`) are rejected.
   - User credentials (`user:pass@host`) are rejected.
   - Wildcard domains (`*`, `*.example.com`) are rejected.
   - Maximum length is constrained to 253 characters.
6. **PostgreSQL Check Constraint**: Enforced by `CHK_site_domains_hostname_format` (`^[a-z0-9.-]+$`).

---

## 3. Primary Domain Integrity

Each site must have **no more than one primary domain**.

### PostgreSQL Partial Unique Index

```sql
CREATE UNIQUE INDEX "UQ_site_domains_primary_per_site"
  ON "site_domains" ("site_id")
  WHERE ("is_primary" = true);
```

### Transactional Promotion & Demotion

When a domain is created or updated with `is_primary = true`, `SitesAdminService` executes the mutation inside a PostgreSQL transaction:

```typescript
await this.dataSource.transaction(async (manager) => {
  // 1. Demote any current primary domain for this site
  await manager.update(SiteDomain, { siteId, isPrimary: true }, { isPrimary: false });

  // 2. Set the target domain as primary
  await manager.update(SiteDomain, { id: domainId, siteId }, { isPrimary: true });
});
```

This guarantees atomicity and prevents concurrency violations against `UQ_site_domains_primary_per_site`.

---

## 4. Challenge-Based Domain Verification Workflow

To prevent unauthorized tenants from claiming third-party hostnames:

1. **Token Generation**: When a domain is registered, an unpredictable cryptographically random 32-byte hex token is generated (`verification_token`) along with a 7-day expiration timestamp (`verification_token_expires_at`).
2. **DNS Challenge**: The domain owner must create a DNS `TXT` record on their domain:
   ```text
   Record Type: TXT
   Host: @ (or sub-domain)
   Value: cms-verify=<verification_token>
   ```
3. **Verification State**: The database maintains `is_verified` (boolean), `verification_token`, `verification_token_expires_at`, and `verified_at`.
4. **Verification Operation**:
   - `POST /api/v1/sites/:siteId/domains/:domainId/verify` (Super Admin).
   - Validates the challenge state, sets `is_verified = true`, sets `verified_at = now()`, clears the token, and emits audit event `domain.verify`.

---

## 5. Domain Resolution Service

`DomainResolutionService` is the centralized backend service for resolving incoming HTTP requests to active tenant sites:

```typescript
@Injectable()
export class DomainResolutionService {
  async resolveByHostname(rawHostname: string): Promise<Site | null> {
    const { isValid, normalized } = normalizeHostname(rawHostname);
    if (!isValid || !normalized) return null;

    const domain = await this.domainRepository.findOne({
      where: { hostname: normalized, isVerified: true },
      relations: ['site', 'site.domains'],
    });

    if (!domain || !domain.site || domain.site.status !== 'active') {
      return null;
    }

    return domain.site;
  }
}
```

### Reverse Proxy & Hosting Platform Handling

- When behind a reverse proxy (e.g. Cloudflare, NGINX, AWS ALB), the client's original host is received via the `X-Forwarded-Host` or `Host` header.
- The NestJS application extracts the hostname, strips ports, normalizes via `normalizeHostname`, and invokes `DomainResolutionService`.
- If the domain is unknown, unverified, or belongs to an inactive tenant, the resolver returns `null` and the API responds with `404 NOT FOUND`.
