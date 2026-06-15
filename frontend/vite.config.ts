import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const SPA_ROUTES = ["studio", "gallery"];

function copySpaRoutes(): Plugin {
  return {
    name: "copy-spa-routes",
    writeBundle(options) {
      const outDir = options.dir ?? "dist";
      const index = join(outDir, "index.html");
      for (const route of SPA_ROUTES) {
        const dir = join(outDir, route);
        mkdirSync(dir, { recursive: true });
        copyFileSync(index, join(dir, "index.html"));
      }
    },
  };
}

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [
    copySpaRoutes(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.svg",
        "pwa-icon.svg",
        "pwa-icon-maskable.svg",
        "icons/favicon-16.png",
        "icons/favicon-32.png",
        "icons/apple-touch-icon.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-maskable-512.png",
      ],
      manifest: {
        id: "/",
        name: "Ibrahim Wafig · Graphic Design Portfolio",
        short_name: "Portfolio",
        description:
          "Ibrahim Wafig — graphic designer. Brand identity, campaigns, and product design. ChaosStudio.mv",
        theme_color: "#4e1370",
        background_color: "#faf8fc",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "en",
        categories: ["portfolio", "design", "business"],
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,webp,png,json,woff2}"],
        globIgnores: ["**/admin/**", "**/*.pano.webp", "**/preview.mp4"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/admin(\/|$)/],
        additionalManifestEntries: [
          { url: "/studio/", revision: null },
          { url: "/gallery/", revision: null },
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /\/api\/portfolio$/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "portfolio-api",
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 5 },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|webp|svg)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "portfolio-images",
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
});
