'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe, Check, Layers, AlertCircle } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';

export function SiteSwitcher() {
  const { activeSite, activeSiteId, setActiveSiteId, availableSites, isSuperAdmin, t } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (siteId: string | null) => {
    const switched = setActiveSiteId(siteId);
    if (switched) {
      setIsOpen(false);
    }
  };

  const primaryDomain = activeSite?.domains?.find((d) => d.isPrimary)?.hostname;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-card-foreground shadow-2xs hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t.nav.switchSite}
      >
        <div className="flex items-center justify-center w-5 h-5 rounded-md bg-primary/10 text-primary">
          {activeSiteId ? <Globe className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
        </div>

        <div className="flex flex-col items-start text-left leading-tight">
          <span className="font-bold truncate max-w-[130px] sm:max-w-[180px]">
            {activeSite ? activeSite.name : isSuperAdmin ? t.nav.allSites : t.nav.switchSite}
          </span>
          {primaryDomain && (
            <span className="text-[10px] text-muted-foreground font-normal truncate max-w-[130px] sm:max-w-[180px]">
              {primaryDomain}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 mt-1.5 w-64 rounded-xl border border-border bg-card p-1.5 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t.nav.switchSite}
          </div>

          {/* Super Admin Platform Option */}
          {isSuperAdmin && (
            <button
              type="button"
              role="option"
              aria-selected={activeSiteId === null}
              onClick={() => handleSelect(null)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                activeSiteId === null
                  ? 'bg-primary/10 text-primary'
                  : 'text-card-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>{t.nav.allSites}</span>
              </div>
              {activeSiteId === null && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          )}

          <div className="my-1 border-t border-border" />

          {/* Available Sites List */}
          {availableSites.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>No assigned sites found.</span>
            </div>
          ) : (
            availableSites.map((site) => {
              const isSelected = activeSiteId === site.id;
              const domain = site.domains?.find((d) => d.isPrimary)?.hostname;

              return (
                <button
                  key={site.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(site.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'text-card-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-semibold text-foreground">{site.name}</span>
                    {domain && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {domain}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
