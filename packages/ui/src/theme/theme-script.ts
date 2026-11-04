import type { ThemeMode } from './theme-provider';

/**
 * Source for a pre-hydration script that applies the stored or system theme
 * before the first paint, so pages never flash light before switching to dark.
 *
 * Render it with Next.js `<Script id="theme-init" strategy="beforeInteractive">`
 * in the root layout; a raw <script> in the React tree is not executed on the
 * client and triggers a React warning. Inputs are JSON-encoded, so no caller
 * value is interpreted as code.
 */
export function themeInitScript(storageKey: string, defaultTheme: ThemeMode = 'system'): string {
  return `(function(){try{var k=${JSON.stringify(storageKey)},d=${JSON.stringify(defaultTheme)};var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'&&t!=='system')t=d;var r=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';var e=document.documentElement;e.classList.toggle('dark',r==='dark');e.setAttribute('data-theme',r);e.style.colorScheme=r;}catch(_){}})();`;
}
