import { DEFAULT_SITE_CONTENT } from "./defaults";
import type { ContentHistoryEntry, SiteContent } from "./types";

const CURRENT = "content:current";
const HISTORY = "content:history";
const MAX_HISTORY = 10;

export async function getPublished(kv: KVNamespace | undefined): Promise<SiteContent> {
  if (!kv) return structuredClone(DEFAULT_SITE_CONTENT);
  const raw = await kv.get(CURRENT);
  if (!raw) return structuredClone(DEFAULT_SITE_CONTENT);
  try {
    return JSON.parse(raw) as SiteContent;
  } catch {
    return structuredClone(DEFAULT_SITE_CONTENT);
  }
}

export async function saveContent(kv: KVNamespace, content: SiteContent): Promise<SiteContent> {
  const now = new Date().toISOString();
  const next: SiteContent = { ...content, updatedAt: now, schemaVersion: content.schemaVersion || 1 };

  const currentRaw = await kv.get(CURRENT);
  if (currentRaw) {
    const historyRaw = (await kv.get(HISTORY)) || "[]";
    let history: ContentHistoryEntry[] = [];
    try {
      history = JSON.parse(historyRaw);
    } catch {
      history = [];
    }
    history.unshift({ savedAt: now, content: JSON.parse(currentRaw) as SiteContent });
    history = history.slice(0, MAX_HISTORY);
    await kv.put(HISTORY, JSON.stringify(history));
  }

  await kv.put(CURRENT, JSON.stringify(next));
  return next;
}

export async function getHistory(kv: KVNamespace): Promise<ContentHistoryEntry[]> {
  const raw = await kv.get(HISTORY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ContentHistoryEntry[];
  } catch {
    return [];
  }
}

export async function restoreFromHistory(kv: KVNamespace, savedAt: string): Promise<SiteContent | null> {
  const history = await getHistory(kv);
  const entry = history.find((h) => h.savedAt === savedAt);
  if (!entry) return null;
  return saveContent(kv, entry.content);
}

export async function restoreDefaults(kv: KVNamespace): Promise<SiteContent> {
  return saveContent(kv, structuredClone(DEFAULT_SITE_CONTENT));
}
