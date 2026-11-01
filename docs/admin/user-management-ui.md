# User & Role Administration UI

## 1. Overview

User & Role Administration (`/users`) allows the Platform Super Admin to provision administrative accounts, toggle account statuses, assign role-based access control (RBAC) privileges, and protect platform governance.

---

## 2. Screens & Capabilities

### 1. User Directory (`/users`)

- Real-time search across display name, email, and assigned roles.
- Role filters: All Roles, Platform Super Admins, Site Admins, Site Editors.
- Status filters: Active, Suspended, Locked.
- Role summary pills distinguishing Platform Scope (Purple Shield) from Site Scope (Blue Globe with site name).
- Last login timestamp tracking.

### 2. User Provisioning (`/users/new`)

- Input fields: Display Name, Email address, Initial Password (minimum 8 characters).
- Initial role assignment selector:
  - **Platform Super Admin**: Unrestricted platform-wide authority.
  - **Site-Scoped Admin**: Bound to a specific website selected from the site dropdown.

### 3. User Details & Role Assignment (`/users/[userId]`)

- **Account Status Toggle**: One-click action to suspend or reactivate an account. Suspended accounts are immediately evicted from active sessions.
- **Account Metrics**: Failed login count, lock status, creation date, last login timestamp.
- **Role Assignment**:
  - Assign additional roles (`super_admin`, `site_admin`, `site_editor`, `site_viewer`).
  - Site selector enabled for site-scoped roles.
- **Role Revocation**: Remove role assignments with explicit confirmation.

---

## 3. The Last Super Admin Safeguard

A critical security and governance requirement is preventing accidental platform lockout:

1. **Detection**:
   - The UI continuously computes the count of active Platform Super Admins (`superAdminCount`).
2. **Alerting**:
   - If `superAdminCount <= 1`, an alert banner is rendered: `"The last active Super Admin account cannot be deactivated or deleted."`
3. **Enforcement**:
   - The status toggle for the sole Super Admin is disabled or rejected by backend guards.
   - Revocation of the platform Super Admin role from the sole Super Admin is blocked by the backend API with an explicit domain error.
