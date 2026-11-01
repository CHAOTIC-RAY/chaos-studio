#!/usr/bin/env node
/**
 * Copy index.html to SPA route folders so /studio and /gallery resolve as real files
 * (avoids relying only on service-worker / not_found_handling for direct deep links).
 */
import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const dist = process.argv[2] || join(process.cwd(), "frontend/dist");
const index = join(dist, "index.html");
// /studio and /gallery are static Chaos Studio pages (frontend/public/{studio,gallery}) — keep them.
const routes = [];

for (const route of routes) {
  const dir = join(dist, route);
  await mkdir(dir, { recursive: true });
  await copyFile(index, join(dir, "index.html"));
  console.log(`SPA route: /${route}/index.html`);
}
