/* Nature clip layer for generative hero — lazy video, HUD, terminal, grading hooks. */
window.HeroVideoReel = (function () {
  const CHARS = " .:-=+*#%@";

  function canPlayWebm() {
    const v = document.createElement("video");
    return v.canPlayType('video/webm; codecs="vp9"') !== "";
  }

  function createPool(host) {
    const el = document.createElement("div");
    el.id = "hero-video-pool";
    el.hidden = true;
    el.setAttribute("aria-hidden", "true");
    host.appendChild(el);
    return el;
  }

  return {
    async loadManifest() {
      const r = await fetch("/assets/hero-clips/manifest.json");
      if (!r.ok) throw new Error("manifest");
      return r.json();
    },

  createState({ hero, mobile, reduced }) {
      const poolEl = createPool(hero);
      const videos = new Map();
      const useWebm = canPlayWebm();
      const state = { clips: [] };
      let loaded = new Set();
      const track = document.createElement("canvas");
      const trackCtx = track.getContext("2d", { willReadFrequently: true });
      const TW = mobile ? 48 : 80;
      const TH = mobile ? 27 : 45;
      track.width = TW;
      track.height = TH;
      let prev = new Uint8ClampedArray(TW * TH);
      let boxes = [];
      let active = null;
      let fx = { hud: true, terminal: true, ascii: false };

      function clipList(all) {
        if (mobile) return all.filter((c) => ["waves", "aerial", "palms"].includes(c.id));
        return all;
      }

      function ensureVideo(clip, preload) {
        if (videos.has(clip.id)) return videos.get(clip.id);
        const v = document.createElement("video");
        v.muted = true;
        v.playsInline = true;
        v.loop = true;
        v.preload = preload ? "auto" : "none";
        v.crossOrigin = "anonymous";
        v.poster = clip.poster;
        const src = document.createElement("source");
        src.src = useWebm ? clip.webm : clip.mp4;
        src.type = useWebm ? "video/webm" : "video/mp4";
        v.appendChild(src);
        poolEl.appendChild(v);
        videos.set(clip.id, v);
        return v;
      }

      async function prepareFirst(all) {
        state.clips = clipList(all);
        if (!state.clips.length) return;
        const v = ensureVideo(state.clips[0], true);
        try {
          await v.play();
          v.pause();
          v.currentTime = 0;
          loaded.add(state.clips[0].id);
        } catch {
          /* autoplay policy — ok until visible */
        }
      }

      async function setScene(clip) {
        const v = ensureVideo(clip, loaded.has(clip.id));
        if (!loaded.has(clip.id)) {
          v.load();
          loaded.add(clip.id);
        }
        active = { clip, video: v, started: performance.now() };
        fx = {
          hud: Math.random() < 0.85,
          terminal: !mobile && Math.random() < 0.7,
          ascii: !mobile && Math.random() < 0.35,
        };
        try {
          v.currentTime = 0;
          await v.play();
        } catch {
          /* will play on user gesture / visible */
        }
      }

      function detectMotion() {
        const v = active && active.video;
        if (!v || v.readyState < 2) {
          boxes = [];
          return;
        }
        trackCtx.drawImage(v, 0, 0, TW, TH);
        const img = trackCtx.getImageData(0, 0, TW, TH);
        const grid = 8;
        const bw = TW / grid;
        const bh = TH / grid;
        const next = [];
        for (let gy = 0; gy < grid; gy++) {
          for (let gx = 0; gx < grid; gx++) {
            let sum = 0;
            let n = 0;
            for (let y = gy * bh; y < (gy + 1) * bh; y++) {
              for (let x = gx * bw; x < (gx + 1) * bw; x++) {
                const i = y * TW + x;
                const d = Math.abs(img.data[i * 4] - prev[i]);
                sum += d;
                n++;
              }
            }
            const avg = sum / Math.max(1, n);
            if (avg > (mobile ? 14 : 10)) {
              next.push({
                x: gx / grid,
                y: gy / grid,
                w: 1 / grid,
                h: 1 / grid,
                conf: Math.min(99, Math.round(55 + avg * 2)),
              });
            }
          }
        }
        for (let i = 0; i < img.data.length / 4; i++) prev[i] = img.data[i * 4];
        boxes = next.slice(0, mobile ? 6 : 12);
      }

      function drawVideo(wctx, sw, sh, palette) {
        const v = active && active.video;
        if (!v || v.readyState < 2) {
          wctx.fillStyle = palette.bg;
          wctx.fillRect(0, 0, sw, sh);
          return false;
        }
        const vw = v.videoWidth || 1280;
        const vh = v.videoHeight || 720;
        const scale = Math.max(sw / vw, sh / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (sw - dw) / 2;
        const dy = (sh - dh) / 2;
        wctx.fillStyle = palette.bg;
        wctx.fillRect(0, 0, sw, sh);
        wctx.drawImage(v, dx, dy, dw, dh);
        detectMotion();

        if (fx.terminal) {
          wctx.save();
          wctx.globalAlpha = 0.12;
          wctx.fillStyle = palette.accent;
          wctx.font = `${mobile ? 9 : 11}px "Space Mono", monospace`;
          const t = performance.now() / 1000;
          for (let i = 0; i < (mobile ? 4 : 8); i++) {
            const y = 16 + i * 14;
            const lat = (3 + Math.sin(t * 0.7 + i) * 0.8).toFixed(3);
            wctx.fillText(`${String(i).padStart(2, "0")} | TC ${t.toFixed(2)} | ${lat}N 073.2E`, 12, y);
          }
          wctx.restore();
        }

        if (fx.ascii && prev.length) {
          wctx.save();
          wctx.globalAlpha = 0.16;
          wctx.fillStyle = palette.fg;
          wctx.font = `10px "Space Mono", monospace`;
          const cols = TW;
          const rows = TH;
          for (let y = 0; y < rows; y++) {
            let line = "";
            for (let x = 0; x < cols; x++) {
              const lum = prev[y * TW + x];
              const chIdx = Math.floor((lum / 255) * (CHARS.length - 1));
              line += CHARS[chIdx];
            }
            wctx.fillText(line, 8, 14 + y * 11);
          }
          wctx.restore();
        }
        return true;
      }

      function drawHud(ctx, w, h, palette) {
        if (!fx.hud || !boxes.length) return;
        ctx.save();
        ctx.strokeStyle = palette.accent;
        ctx.fillStyle = palette.fg;
        ctx.font = `${mobile ? 9 : 11}px "Space Mono", monospace`;
        boxes.forEach((b, i) => {
          const rx = b.x * w;
          const ry = b.y * h;
          const bw = b.w * w;
          const bh = b.h * h;
          const pad = 4;
          ctx.strokeRect(rx + pad, ry + pad, Math.max(8, bw - pad * 2), Math.max(8, bh - pad * 2));
          ctx.fillText(`OBJ-${100 + i} ${b.conf}%`, rx + 6, ry + bh - 4);
          const corner = 10;
          ctx.beginPath();
          ctx.moveTo(rx, ry + corner);
          ctx.lineTo(rx, ry);
          ctx.lineTo(rx + corner, ry);
          ctx.stroke();
        });
        ctx.restore();
      }

      function pickClip() {
        if (!state.clips.length) return null;
        return state.clips[(Math.random() * state.clips.length) | 0];
      }

      function pauseAll() {
        videos.forEach((v) => {
          v.pause();
        });
      }

      function stillFrame(wctx, sw, sh, palette, clip) {
        const img = new Image();
        img.src = clip.poster;
        wctx.fillStyle = palette.bg;
        wctx.fillRect(0, 0, sw, sh);
        if (img.complete) {
          wctx.drawImage(img, 0, 0, sw, sh);
        }
      }

      return {
        get clips() {
          return state.clips;
        },
        prepareFirst,
        setScene,
        drawVideo,
        drawHud,
        pickClip,
        pauseAll,
        stillFrame,
        get active() {
          return active;
        },
      };
    },
  };
})();
