export type AppRoute = "portfolio" | "studio";

const STUDIO_PATH = "/studio";

export function getRoute(): AppRoute {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  return path === STUDIO_PATH ? "studio" : "portfolio";
}

export function studioUrl(): string {
  return STUDIO_PATH;
}

export function portfolioUrl(): string {
  return "/";
}

export function navigateTo(route: AppRoute, replace = false): void {
  const path = route === "studio" ? STUDIO_PATH : "/";
  const current = window.location.pathname.replace(/\/$/, "") || "/";
  if (current === path) return;
  if (replace) {
    history.replaceState({ route }, "", path);
  } else {
    history.pushState({ route }, "", path);
  }
}
