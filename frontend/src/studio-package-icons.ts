/** Unique stroke icons per Chaos Studio package (currentColor). */

const svg = (paths: string) =>
  `<svg class="icon studio-package-icon-svg" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const STUDIO_PACKAGE_ICONS: Record<string, string> = {
  starter: svg(
    `<path d="M12 2v4"/><path d="M12 18v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="m16.24 16.24 2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="m16.24 7.76 2.83-2.83"/><circle cx="12" cy="12" r="3"/>`,
  ),
  "business-booster": svg(
    `<path d="M3 3v18h18"/><path d="m7 14 4-5 4 3 5-7"/>`,
  ),
  "complete-branding": svg(
    `<path d="M12 2 4.5 6.5v7L12 18l7.5-4.5v-7L12 2z"/><path d="M4.5 11.5 12 16l7.5-4.5"/><path d="M4.5 16.5 12 21l7.5-4.5"/>`,
  ),
  "event-marketing": svg(
    `<path d="m3 11 3-7 12 5 8-3 5-8-12-5-8z"/><path d="M11 11v5a2.5 2.5 0 0 0 5 0"/>`,
  ),
  "monthly-social": svg(
    `<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/>`,
  ),
};

export function studioPackageIcon(id: string): string {
  return STUDIO_PACKAGE_ICONS[id] ?? STUDIO_PACKAGE_ICONS.starter;
}
