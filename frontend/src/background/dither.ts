/** 4×4 Bayer matrix (values 0–15) */
const BAYER_4: readonly number[] = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

/**
 * Ordered dither on canvas alpha — gives blobs a grainy, printed gradient look.
 */
export function applyBayerDither(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength = 0.22,
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const w = width;
  const h = height;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a < 4) continue;

      const threshold = (BAYER_4[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5;
      const shift = threshold * strength * 255;
      let na = a + shift;

      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum > 8) {
        data[i] = Math.min(255, Math.max(0, data[i] + shift * 0.35));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + shift * 0.35));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + shift * 0.35));
      }
      data[i + 3] = Math.min(255, Math.max(0, na));
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
