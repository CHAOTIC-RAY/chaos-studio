/**
 * Sveltia CMS list widgets require { name: value } objects; the site uses string[].
 * These helpers convert both ways and migrate JSON content files.
 */

export function toCmsList(arr, prop) {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    if (typeof item === "string") return { [prop]: item };
    if (item && typeof item === "object" && prop in item) return item;
    return { [prop]: String(item ?? "") };
  });
}

export function toStringList(arr, prop) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && prop in item) return String(item[prop] ?? "");
      return "";
    })
    .filter(Boolean);
}
