'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser, SiteItem } from '@multi-site-cms/types';
import { useGetMeQuery, useListSitesQuery } from './cms-api';
import { translations, type Locale, type TranslateFunction } from './i18n';

interface AdminContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFunction;
  activeSiteId: string | null;
  setActiveSiteId: (siteId: string | null) => boolean;
  activeSite: SiteItem | null;
  availableSites: SiteItem[];
  user: AuthUser | null;
  isLoadingUser: boolean;
  isSuperAdmin: boolean;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (val: boolean) => void;
  can: (permission: string, siteId?: string) => boolean;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedLocale = localStorage.getItem('cms_admin_locale') as Locale | null;
        if (savedLocale === 'en' || savedLocale === 'bn') {
          return savedLocale;
        }
      } catch {
        // Ignore
      }
    }
    return 'en';
  });

  const [activeSiteId, setActiveSiteIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('cms_admin_active_site_id');
      } catch {
        // Ignore
      }
    }
    return null;
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('cms_admin_locale', newLocale);
    } catch {
      // Ignore
    }
  }, []);

  // Fetch current user and available sites
  const { data: user, isLoading: isLoadingUser } = useGetMeQuery(undefined, {
    pollingInterval: 60000,
  });
  const { data: allSites = [] } = useListSitesQuery(undefined, {
    skip: !user,
  });

  // Filter available sites based on user permissions
  const availableSites = useMemo(() => {
    if (!user) return [];
    if (user.isSuperAdmin) return allSites;
    const allowed = new Set(user.authorizedSiteIds || []);
    return allSites.filter((s) => allowed.has(s.id));
  }, [user, allSites]);

  // Derive effective active site without cascading setState in an effect
  const effectiveActiveSiteId = useMemo(() => {
    if (availableSites.length === 0) return null;
    if (activeSiteId && availableSites.some((s) => s.id === activeSiteId)) {
      return activeSiteId;
    }
    // If not super admin, must default to first assigned site
    if (!user?.isSuperAdmin) {
      return availableSites[0]?.id ?? null;
    }
    return null;
  }, [availableSites, activeSiteId, user]);

  const activeSite = useMemo(() => {
    if (!effectiveActiveSiteId) return null;
    return availableSites.find((s) => s.id === effectiveActiveSiteId) || null;
  }, [availableSites, effectiveActiveSiteId]);

  const setActiveSiteId = useCallback(
    (newSiteId: string | null): boolean => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          translations[locale].nav.unsavedWarning ||
            'You have unsaved changes. Are you sure you want to switch sites?',
        );
        if (!confirmed) return false;
      }
      setHasUnsavedChanges(false);
      setActiveSiteIdState(newSiteId);
      try {
        if (newSiteId) {
          localStorage.setItem('cms_admin_active_site_id', newSiteId);
        } else {
          localStorage.removeItem('cms_admin_active_site_id');
        }
      } catch {
        // Ignore
      }
      return true;
    },
    [hasUnsavedChanges, locale],
  );

  const isSuperAdmin = Boolean(user?.isSuperAdmin);

  // Centralized permission checking helper
  const can = useCallback(
    (permission: string, siteId?: string): boolean => {
      if (!user) return false;
      if (user.isSuperAdmin) return true;

      // Check global capabilities
      if (user.permissions?.includes(permission)) {
        if (!siteId) return true;
        return user.authorizedSiteIds?.includes(siteId) ?? false;
      }

      return false;
    },
    [user],
  );

  const t = useMemo<TranslateFunction>(() => {
    const dict = translations[locale];
    const tFunc = (path: string): string => {
      const parts = path.split('.');
      let current: unknown = dict;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = (current as Record<string, unknown>)[part];
        } else {
          return path;
        }
      }
      return typeof current === 'string' ? current : path;
    };
    return Object.assign(tFunc, dict);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      activeSiteId: effectiveActiveSiteId,
      setActiveSiteId,
      activeSite,
      availableSites,
      user: user || null,
      isLoadingUser,
      isSuperAdmin,
      hasUnsavedChanges,
      setHasUnsavedChanges,
      can,
    }),
    [
      locale,
      setLocale,
      t,
      effectiveActiveSiteId,
      setActiveSiteId,
      activeSite,
      availableSites,
      user,
      isLoadingUser,
      isSuperAdmin,
      hasUnsavedChanges,
      can,
    ],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return ctx;
}
