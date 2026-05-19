import type { SiteConfig } from "../types/site";

const CONFIG_URL = "/assets/site.config.json";
const DEFAULT_COVER = "/assets/work/_placeholders/default-cover.svg";

let cached: SiteConfig | null = null;

export async function loadSiteConfig(): Promise<SiteConfig> {
  if (cached) return cached;
  const res = await fetch(CONFIG_URL);
  if (!res.ok) throw new Error("Failed to load site config");
  cached = (await res.json()) as SiteConfig;
  return cached;
}

export function coverFallback(): string {
  return DEFAULT_COVER;
}
