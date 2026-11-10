/* Full-bleed hero video reel — one decoder, preload next, motion HUD. */
window.HeroVideoReel = (function () {
  function canPlayWebm() {
    const v = document.createElement("video");
    return v.canPlayType('video/webm; codecs="vp9"') !== "";
  }

  function createPool(host) {
    const el = document.createElement("div");
    el.className = "hero-video-pool";
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
      let clips = [];
      let index = -1;
      let active = null;
      let preloadId = null;

      const track = document.createElement("canvas");
      const trackCtx = track.getContext("2d", { willReadFrequently: true });
      const TW = mobile ? 40 : 64;
      const TH = mobile ? 23 : 36;
      track.width = TW;
      track.height = TH;
      let prev = new Uint8ClampedArray(TW * TH);
      let tracks = [];
      let hudT = 0;

      function srcFor(clip) {
        return useWebm ? clip.webm : clip.mp4;
      }

      function ensureVideo(clip, { preload } = { preload: false }) {
        if (videos.has(clip.id)) return videos.get(clip.id);
        const v = document.createElement("video");
        v.muted = true;
        v.playsInline = true;
        v.loop = false;
        v.preload = preload ? "auto" : "metadata";
        v.crossOrigin = "anonymous";
        v.poster = clip.poster;
        v.src = srcFor(clip);
        poolEl.appendChild(v);
        videos.set(clip.id, v);
        return v;
      }

      function pauseExcept(id) {
        videos.forEach((v, cid) => {
          if (cid !== id) {
            v.pause();
            try {
              v.currentTime = 0;
            } catch {
              /* */
            }
          }
        });
      }

      function preloadNext(nextClip) {
        if (!nextClip || preloadId === nextClip.id) return;
        preloadId = nextClip.id;
        const v = ensureVideo(nextClip, { preload: true });
        v.load();
      }

      async function prepareFirst(all) {
        clips = reduced ? all.slice(0, 1) : all;
        if (!clips.length) return;
        index = -1;
        ensureVideo(clips[0], { preload: true });
        preloadNext(clips[1] || clips[0]);
      }

      function nextClip() {
        if (clips.length < 2) return clips[0];
        return clips[(index + 1) % clips.length];
      }

      async function setScene(clip) {
        const i = clips.findIndex((c) => c.id === clip.id);
        if (i >= 0) index = i;
        pauseExcept(clip.id);
        const v = ensureVideo(clip, { preload: true });
        active = { clip, video: v, started: performance.now() };
        tracks = [];
        try {
          v.currentTime = 0;
          await v.play();
        } catch {
          /* until visible */
        }
        preloadNext(nextClip());
      }

      function pickClip() {
        if (!clips.length) return null;
        index = (index + 1) % clips.length;
        return clips[index];
      }

      function detectMotion() {
        const v = active && active.video;
        if (!v || v.readyState < 2) {
          tracks = tracks.slice(0, 0);
          return;
        }
        trackCtx.drawImage(v, 0, 0, TW, TH);
        const img = trackCtx.getImageData(0, 0, TW, TH);
        const grid = mobile ? 5 : 7;
        const bw = TW / grid;
        const bh = TH / grid;
        const found = [];
        for (let gy = 0; gy < grid; gy++) {
          for (let gx = 0; gx < grid; gx++) {
            let sum = 0;
            let n = 0;
            for (let y = (gy * bh) | 0; y < ((gy + 1) * bh) | 0; y++) {
              for (let x = (gx * bw) | 0; x < ((gx + 1) * bw) | 0; x++) {
                const i = y * TW + x;
                sum += Math.abs(img.data[i * 4] - prev[i]);
                n++;
              }
            }
            const avg = sum / Math.max(1, n);
            if (avg > (mobile ? 12 : 9)) {
              found.push({
                x: gx / grid,
                y: gy / grid,
                w: 1 / grid,
                h: 1 / grid,
                conf: Math.min(99, Math.round(52 + avg * 2.2)),
                vx: (Math.sin(hudT * 0.02 + gx) * 0.012).toFixed(3),
                vy: (Math.cos(hudT * 0.017 + gy) * 0.012).toFixed(3),
              });
            }
          }
        }
        for (let i = 0; i < img.data.length / 4; i++) prev[i] = img.data[i * 4];
        const merge = [];
        found.slice(0, mobile ? 5 : 9).forEach((b, i) => {
          const old = tracks[i];
          if (old) {
            merge.push({
              ...b,
              x: old.x * 0.72 + b.x * 0.28,
              y: old.y * 0.72 + b.y * 0.28,
            });
          } else merge.push(b);
        });
        tracks = merge;
      }

      function drawVideo(wctx, sw, sh, palette) {
        const v = active && active.video;
        if (!v || v.readyState < 2) {
          if (active && active.clip) {
            const img = new Image();
            img.src = active.clip.poster;
            wctx.fillStyle = palette.bg;
            wctx.fillRect(0, 0, sw, sh);
            if (img.complete) {
              const iw = img.naturalWidth || 1280;
              const ih = img.naturalHeight || 720;
              const sc = Math.max(sw / iw, sh / ih);
              const dw = iw * sc;
              const dh = ih * sc;
              wctx.drawImage(img, (sw - dw) / 2, (sh - dh) / 2, dw, dh);
              return true;
            }
          }
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
        hudT++;
        if (hudT % (mobile ? 2 : 1) === 0) detectMotion();
        return true;
      }

      function bracket(ctx, x, y, w, h, col) {
        const len = Math.min(mobile ? 22 : 28, w * 0.26, h * 0.26);
        ctx.strokeStyle = col;
        ctx.lineWidth = mobile ? 2 : 2.25;
        ctx.beginPath();
        ctx.moveTo(x, y + len);
        ctx.lineTo(x, y);
        ctx.lineTo(x + len, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w - len, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + len);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + h - len);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + len, y + h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w - len, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y + h - len);
        ctx.stroke();
      }

      function drawHud(ctx, w, h, palette, clip) {
        ctx.save();
        const mono = `${mobile ? 11 : 13}px "Space Mono", monospace`;
        const t = performance.now() / 1000;
        ctx.font = mono;
        ctx.fillStyle = palette.fg;
        ctx.globalAlpha = 0.92;
        const tag = (clip && clip.category) || "FEED";
        const pad = mobile ? 14 : 18;
        ctx.fillText(`CHAOS.TRK // ${tag.toUpperCase()}`, pad, mobile ? 22 : 26);
        const tc = `TC ${t.toFixed(2)}`;
        ctx.fillText(tc, w - ctx.measureText(tc).width - pad, mobile ? 22 : 26);
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = palette.mid;
        ctx.lineWidth = 1;
        const cx = w * (mobile ? 0.72 : 0.78);
        const cy = h * (mobile ? 0.28 : 0.32);
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy);
        ctx.lineTo(cx + 14, cy);
        ctx.moveTo(cx, cy - 14);
        ctx.lineTo(cx, cy + 14);
        ctx.stroke();
        ctx.globalAlpha = 1;

        tracks.forEach((b, i) => {
          const rx = b.x * w;
          const ry = b.y * h;
          const bw = Math.max(28, b.w * w * 0.92);
          const bh = Math.max(24, b.h * h * 0.92);
          const pad = 3;
          bracket(ctx, rx + pad, ry + pad, bw - pad * 2, bh - pad * 2, palette.accent);
          ctx.fillStyle = palette.fg;
          ctx.globalAlpha = 0.92;
          ctx.font = mono;
          const id = 100 + i;
          ctx.fillText(`OBJ-${id} ${b.conf}%`, rx + 6, ry + bh - 5);
          ctx.globalAlpha = 0.65;
          ctx.fillText(`${b.vx}, ${b.vy}`, rx + 6, ry + 12);
          ctx.globalAlpha = 1;
        });

        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = palette.accent;
        for (let y = 0; y < h; y += mobile ? 5 : 4) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        ctx.restore();
      }

      function pauseAll() {
        videos.forEach((v) => v.pause());
      }

      function stillFrame(wctx, sw, sh, palette, clip) {
        const img = new Image();
        img.src = clip.poster;
        wctx.fillStyle = palette.bg;
        wctx.fillRect(0, 0, sw, sh);
        if (img.complete) {
          wctx.drawImage(img, 0, 0, sw, sh);
        } else {
          img.onload = () => wctx.drawImage(img, 0, 0, sw, sh);
        }
      }

      return {
        get clips() {
          return clips;
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
