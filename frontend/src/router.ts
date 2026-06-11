export type AppRoute = "portfolio" | "studio" | "gallery";

const STUDIO_PATH = "/studio";
const GALLERY_PATH = "/gallery";

export function getRoute(): AppRoute {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path === STUDIO_PATH) return "studio";
  if (path === GALLERY_PATH) return "gallery";
  return "portfolio";
}

export function studioUrl(): string {
  return STUDIO_PATH;
}

export function galleryUrl(): string {
  return GALLERY_PATH;
}

export function portfolioUrl(): string {
  return "/";
}

export function navigateTo(route: AppRoute, replace = false): void {
  const path = route === "studio" ? STUDIO_PATH : route === "gallery" ? GALLERY_PATH : "/";
  const current = window.location.pathname.replace(/\/$/, "") || "/";
  if (current === path) return;
  if (replace) {
    history.replaceState({ route }, "", path);
  } else {
    history.pushState({ route }, "", path);
  }
}
