/** 4×4 Bayer (0–15) */
const BAYER_4: readonly number[] = [
  0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5,
];

/** 8×8 Bayer (0–63) — smoother gradients, finer grain when upscaled */
const BAYER_8: readonly number[] = [
  0, 48, 12, 60, 3, 51, 15, 63, 32, 16, 44, 28, 35, 19, 47, 31, 8, 56, 4, 52, 11, 59, 7, 55, 40, 24, 36, 20, 43, 27, 39, 23,
  2, 50, 14, 62, 1, 49, 13, 61, 34, 18, 46, 30, 33, 17, 45, 29, 10, 58, 6, 54, 9, 57, 5, 53, 42, 26, 38, 22, 41, 25, 37, 21,
];

export type DitherProfile = "default" | "studio";

export type DitherOptions = {
  profile?: DitherProfile;
  /** 0–1 — how strongly thresholds bite into alpha/color */
  strength?: number;
  /** 0–1 — extra random grain on top of ordered dither */
  noise?: number;
  /** Bias noise toward edges (studio logo vignette) */
  vignetteNoise?: boolean;
  cx?: number;
  cy?: number;
  /** Animated dither phase (ms) — studio logo shimmer */
  time?: number;
};

function bayerThreshold(x: number, y: number, size: 4 | 8): number {
  if (size === 8) {
    const v = BAYER_8[(y & 7) * 8 + (x & 7)];
    return (v + 0.5) / 64 - 0.5;
  }
  const v = BAYER_4[(y & 3) * 4 + (x & 3)];
  return (v + 0.5) / 16 - 0.5;
}

/** Hash-based stable noise per pixel (no flicker between frames unless re-seeded) */
function hashNoise(x: number, y: number, seed: number): number {
  let n = x * 374761393 + y * 668265263 + seed * 982451653;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

/**
 * Ordered dither on canvas — grainy, printed gradient on blob layers.
 */
export function applyBayerDither(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strengthOrOptions: number | DitherOptions = 0.22,
): void {
  const opts: DitherOptions =
    typeof strengthOrOptions === "number" ? { strength: strengthOrOptions } : strengthOrOptions;

  const profile = opts.profile ?? "default";
  const strength = opts.strength ?? (profile === "studio" ? 0.42 : 0.22);
  const noise = opts.noise ?? (profile === "studio" ? 0.55 : 0.08);
  const vignette = opts.vignetteNoise ?? profile === "studio";
  const cx = opts.cx ?? 0.5;
  const cy = opts.cy ?? 0.42;
  const matrix: 4 | 8 = profile === "studio" ? 8 : 4;
  const seed = profile === "studio" ? 9137 : 42;
  const timePhase = opts.time ?? 0;
  const animate = profile === "studio" && timePhase > 0;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const w = width;
  const h = height;
  const maxR = Math.hypot(w, h) * 0.5;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a < 4) continue;

      const nx = x / w;
      const ny = y / h;
      const dist = Math.hypot(nx - cx, ny - cy) * maxR;
      const edge = vignette ? Math.min(1, Math.pow(dist / (maxR * 0.85), 1.35)) : 0.35;

      const tx = animate ? x + Math.floor(timePhase * 0.04) : x;
      const ty = animate ? y + Math.floor(timePhase * 0.03) : y;
      const ordered = bayerThreshold(tx, ty, matrix);
      const grain = (hashNoise(tx, ty, seed + Math.floor(timePhase * 0.02)) - 0.5) * 2;
      const grain2 = profile === "studio" ? (hashNoise(tx * 3 + 7, ty * 5 + 11, seed + 3 + Math.floor(timePhase * 0.015)) - 0.5) * 1.2 : 0;
      const noiseMix = (ordered * (1 - noise * 0.65) + grain * noise + grain2 * noise * 0.45) * (0.65 + edge * 0.55);

      const shift = noiseMix * strength * 255;
      let na = a + shift;

      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const chromaShift = shift * (profile === "studio" ? 0.5 : 0.35);
      if (lum > 8) {
        data[i] = Math.min(255, Math.max(0, data[i] + chromaShift));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + chromaShift));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + chromaShift));
      }
      data[i + 3] = Math.min(255, Math.max(0, na));
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
