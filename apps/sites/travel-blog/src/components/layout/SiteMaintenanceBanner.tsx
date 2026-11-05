import type { ApiSuccess, PublicPlatformSettings } from '@multi-site-cms/types';
import { MaintenanceBanner } from '@multi-site-cms/ui';
import { apiTimeoutSignal } from '@/lib/api-timeout';

const API_BASE_URL = (
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

/** Public platform settings; null when the API cannot be reached. */
async function fetchPublicPlatformSettings(): Promise<PublicPlatformSettings | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/settings/public`, {
      signal: apiTimeoutSignal(),
      headers: { Accept: 'application/json' },
      next: { revalidate: 30, tags: ['platform-settings'] },
    });
    if (!res.ok) return null;
    return ((await res.json()) as ApiSuccess<PublicPlatformSettings>).data;
  } catch {
    return null;
  }
}

/**
 * Shows the maintenance notice while the platform is in maintenance mode
 * (admin: Settings → Maintenance). Content stays readable; if the settings
 * cannot be fetched, no banner is shown.
 */
export async function SiteMaintenanceBanner() {
  const settings = await fetchPublicPlatformSettings();
  if (!settings?.maintenanceMode) return null;
  return (
    <MaintenanceBanner
      notice={settings.maintenanceNoticeEn}
      noticeBn={settings.maintenanceNoticeBn || undefined}
    />
  );
}
