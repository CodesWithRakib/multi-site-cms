import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';

import { appIconElement } from '@multi-site-cms/ui';

/** Installable-app icons at fixed URLs referenced by app/manifest.ts. */
const ICONS = {
  'icon-192.png': { size: 192, maskable: false },
  'icon-512.png': { size: 512, maskable: false },
  'maskable-512.png': { size: 512, maskable: true },
} as const;

type IconName = keyof typeof ICONS;

function isIconName(value: string): value is IconName {
  return Object.hasOwn(ICONS, value);
}

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ICONS).map((name) => ({ name }));
}

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!isIconName(name)) {
    notFound();
  }
  const { size, maskable } = ICONS[name];
  return new ImageResponse(appIconElement({ site: 'air-sports', monogram: 'AS', size, maskable }), {
    width: size,
    height: size,
  });
}
