export type Theme = "dark";

export function getStoredTheme(): Theme {
  return "dark";
}

/** Default is dark mode site-wide. */
export function getPreferredTheme(): Theme {
  return "dark";
}

export function applyTheme(_theme: Theme): void {
  document.documentElement.setAttribute("data-theme", "dark");
}

export function initTheme(): () => void {
  applyTheme("dark");
  return () => {};
}
