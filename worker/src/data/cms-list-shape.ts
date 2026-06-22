/** Normalize CMS list fields (object[]) to string[] for the live site. */
export function toStringList(arr: unknown, prop: string): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && prop in item) {
        return String((item as Record<string, unknown>)[prop] ?? "");
      }
      return "";
    })
    .filter(Boolean);
}
