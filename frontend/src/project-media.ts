/**
 * Shared product / web-app screenshot data.
 *
 * Used by the featured-work showcase (render.ts) and the panoramic gallery
 * (gallery-panorama.ts) so app designs are defined in exactly one place.
 */

export type DeviceMedia = { image: string; frames?: string[] };

const frame = (dir: string, names: string[]): string[] =>
  names.map((n) => `/images/projects/frames/${dir}/${n}`);

export const COOKXPERT_DESKTOP_FRAMES = frame("cookxpert/desktop", [
  "01-discover-dark.webp",
  "02-discover-light.webp",
  "03-library.webp",
  "04-notifications.webp",
  "05-settings-appearance-dark.webp",
  "06-settings-appearance-light.webp",
  "07-settings-membership.webp",
  "08-fridge.webp",
  "09-recipe-detail.webp",
]);

export const COOKXPERT_MOBILE_FRAMES = frame("cookxpert/mobile", [
  "01-discover-dark.webp",
  "02-discover-light.webp",
  "03-library.webp",
  "04-notifications.webp",
  "05-settings-appearance-dark.webp",
  "06-settings-appearance-light.webp",
  "07-settings-membership.webp",
  "08-fridge.webp",
]);

export const FORGE_DESKTOP_FRAMES = frame("forge/desktop", [
  "01-profile.webp",
  "02-dashboard.webp",
  "03-calendar.webp",
  "04-scheduling.webp",
  "05-ideas.webp",
  "06-idea-board.webp",
  "07-hook-generator.webp",
  "08-trends.webp",
]);

export const FORGE_MOBILE_FRAMES = frame("forge/mobile", [
  "01-profile.webp",
  "02-dashboard.webp",
  "03-scheduling.webp",
]);

/** MIB prototype flow: splash → home → services → analytics → wallet → transfer → receipt → create account → settings */
export const FAISA_FRAMES = [
  "/images/projects/frames/faisa/01-splash.webp",
  "/images/projects/frames/faisa/02-home.webp",
  "/images/projects/frames/faisa/04-services.webp",
  "/images/projects/frames/faisa/03-budget.webp",
  "/images/projects/frames/faisa/05-wallet.webp",
  "/images/projects/frames/faisa/06-transfer.webp",
  "/images/projects/frames/faisa/07-receipt.webp",
  "/images/projects/frames/faisa/08-create-account.webp",
  "/images/projects/frames/faisa/09-settings.webp",
];

export const PROJECT_MEDIA: Record<string, { desktop?: DeviceMedia; mobile?: DeviceMedia }> = {
  cookxpert: {
    desktop: { image: "/images/projects/cookxpert_desktop.webp", frames: COOKXPERT_DESKTOP_FRAMES },
    mobile: { image: "/images/projects/cookxpert_mobile.webp", frames: COOKXPERT_MOBILE_FRAMES },
  },
  forge: {
    desktop: { image: "/images/projects/forge_desktop.webp", frames: FORGE_DESKTOP_FRAMES },
    mobile: { image: "/images/projects/forge_mobile.webp", frames: FORGE_MOBILE_FRAMES },
  },
  faisa: {
    mobile: { image: "/images/projects/faisa_mobile.webp", frames: FAISA_FRAMES },
  },
};

export const PROJECT_LIVE_URL: Record<string, string> = {
  cookxpert: "cookxpert.chaoticstudio.workers.dev",
  forge: "forge.chaoticstudio.workers.dev",
  faisa: "Adobe XD prototype",
};

export const PROJECT_LOGOS: Record<string, string> = {
  cookxpert: "/images/projects/logos/cookxpert.webp",
  forge: "/images/projects/logos/forge.webp",
  kora: "/images/projects/logos/kora.svg",
};
