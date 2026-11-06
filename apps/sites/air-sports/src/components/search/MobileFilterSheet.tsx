'use client';

import { useState, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@multi-site-cms/ui';

interface MobileFilterSheetProps {
  readonly activeCount: number;
  readonly children: ReactNode;
}

/** Phones: the same filters in a bottom sheet; closes after a filter is picked. */
export function MobileFilterSheet({ activeCount, children }: MobileFilterSheetProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Remember which URL the sheet was opened on: picking a filter navigates,
  // the URL changes, and the sheet is closed without an effect.
  const urlKey = `${pathname}?${searchParams.toString()}`;
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === urlKey;
  const setOpen = (next: boolean) => setOpenFor(next ? urlKey : null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-xs lg:hidden"
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        Filters
        {activeCount > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle>Filter dispatches</SheetTitle>
            <SheetDescription>Pick a category or tag.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-8">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
