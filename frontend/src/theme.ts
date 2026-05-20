export type Theme = "light" | "dark";

const STORAGE_KEY = "portfolio-theme";

export function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return null;
}

/** Default is light mode per product request. */
export function getPreferredTheme(): Theme {
  return getStoredTheme() ?? "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

function updateToggleState(theme: Theme): void {
  const isDark = theme === "dark";
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    btn.setAttribute("aria-pressed", String(isDark));
    btn.classList.toggle("theme-toggle--dark", isDark);
  });
}

export function initTheme(): () => void {
  const theme = getPreferredTheme();
  applyTheme(theme);
  updateToggleState(theme);

  const handler = () => {
    const current =
      document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next: Theme = current === "dark" ? "light" : "dark";
    applyTheme(next);
    updateToggleState(next);
    window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
  };

  const toggles = document.querySelectorAll("[data-theme-toggle]");
  toggles.forEach((btn) => btn.addEventListener("click", handler));
  return () => toggles.forEach((btn) => btn.removeEventListener("click", handler));
}
