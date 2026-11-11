/* Full-bleed hero video reel — dual-decoder crossfade, preload, HUD. */
window.HeroVideoReel = (function () {
  const CLIP_HOLD_MS = 6200;
  const CROSSFADE_MS = 880;
  const IN_POINT = 0.15;

  function canPlayWebm() {
    const v = document.createElement("video");
    return v.canPlayType('video/webm; codecs="vp9"') !== "";
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function createPool(host) {
    const el = document.createElement("div");
    el.className = "hero-video-pool";
    el.hidden = true;
    el.setAttribute("aria-hidden", "true");
    host.appendChild(el);
    return el;
  }

  function drawCover(wctx, sw, sh, palette, src, vw, vh) {
    const scale = Math.max(sw / vw, sh / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    const dx = (sw - dw) / 2;
    const dy = (sh - dh) / 2;
    wctx.fillStyle = palette.bg;
    wctx.fillRect(0, 0, sw, sh);
    wctx.drawImage(src, dx, dy, dw, dh);
  }

  return {
    async loadManifest() {
      const r = await fetch("/assets/hero-clips/manifest.json");
      if (!r.ok) throw new Error("manifest");
      const data = await r.json();
      const v = data.version;
      if (v && Array.isArray(data.clips)) {
        data.clips = data.clips.map((c) => ({ ...c, version: c.version || v }));
      }
      return data;
    },

    createState({ hero, mobile, reduced }) {
      const poolEl = createPool(hero);
      const videos = new Map();
      const useWebm = canPlayWebm();
      let clips = [];
      let index = -1;
      let active = null;
      let incoming = null;
      let blendT = 0;
      let blending = false;
      let blendStart = 0;
      let sceneStart = 0;
      let posterFade = 1;
      let loadFade = 0;

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
        const path = useWebm ? clip.webm : clip.mp4;
        return clip.version ? `${path}${path.includes("?") ? "&" : "?"}v=${clip.version}` : path;
      }

      function ensureVideo(clip, { preload } = { preload: false }) {
        if (videos.has(clip.id)) return videos.get(clip.id);
        const v = document.createElement("video");
        v.muted = true;
        v.playsInline = true;
        v.loop = false;
        v.preload = preload ? "auto" : "metadata";
        v.playbackRate = 1;
        v.crossOrigin = "anonymous";
        v.poster = clip.poster;
        v.src = srcFor(clip);
        poolEl.appendChild(v);
        videos.set(clip.id, v);
        return v;
      }

      function dropVideo(id) {
        const v = videos.get(id);
        if (!v) return;
        v.pause();
        v.removeAttribute("src");
        v.load();
        v.remove();
        videos.delete(id);
      }

      function pauseExcept(...ids) {
        videos.forEach((v, cid) => {
          if (!ids.includes(cid)) v.pause();
        });
      }

      function preloadNext(nextClip) {
        if (!nextClip) return;
        const v = ensureVideo(nextClip, { preload: true });
        v.load();
      }

      async function prepareFirst(all) {
        clips = reduced ? all.slice(0, 1) : all;
        if (!clips.length) return;
        index = 0;
        const v = ensureVideo(clips[0], { preload: true });
        active = { clip: clips[0], video: v };
        tracks = [];
        sceneStart = performance.now();
        posterFade = reduced ? 0 : 1;
        loadFade = 0;
        try {
          v.currentTime = IN_POINT;
          await v.play();
        } catch {
          /* wait for visibility */
        }
        preloadNext(clips[1] || clips[0]);
        if (!reduced) {
          requestAnimationFrame(() => {
            loadFade = 1;
          });
        }
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
        active = { clip, video: v };
        incoming = null;
        blending = false;
        blendT = 0;
        tracks = [];
        sceneStart = performance.now();
        try {
          v.currentTime = IN_POINT;
          await v.play();
        } catch {
          /* */
        }
        preloadNext(nextClip());
      }

      function pickClip() {
        if (!clips.length) return null;
        index = (index + 1) % clips.length;
        return clips[index];
      }

      function beginCrossfade(next) {
        if (!next || blending || !active) return;
        const v = ensureVideo(next, { preload: true });
        blending = true;
        blendT = 0;
        blendStart = performance.now();
        incoming = { clip: next, video: v };
        try {
          v.currentTime = IN_POINT;
          v.play().catch(() => {});
        } catch {
          /* */
        }
        pauseExcept(active.clip.id, next.id);
      }

      function tickTiming() {
        if (reduced || !active) return;
        const now = performance.now();
        if (blending) {
          blendT = Math.min(1, (now - blendStart) / CROSSFADE_MS);
          if (blendT >= 1) {
            const outId = active.clip.id;
            active = incoming;
            incoming = null;
            blending = false;
            blendT = 0;
            sceneStart = now;
            index = clips.findIndex((c) => c.id === active.clip.id);
            preloadNext(nextClip());
            if (mobile) dropVideo(outId);
          }
          return;
        }
        if (now - sceneStart >= CLIP_HOLD_MS) {
          beginCrossfade(nextClip());
        }
      }

      function getBlendMix() {
        return blending ? easeInOut(blendT) : 0;
      }

      function posterAlpha() {
        if (reduced) return 0;
        const load = Math.min(1, loadFade);
        return posterFade * (1 - load) * 0.92;
      }

      function tickPoster(dt) {
        if (posterFade <= 0) return;
        posterFade = Math.max(0, posterFade - dt / (reduced ? 400 : 700));
      }

      function detectMotion(v) {
        if (!v || v.readyState < 2) {
          tracks = [];
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
          if (old) merge.push({ ...b, x: old.x * 0.72 + b.x * 0.28, y: old.y * 0.72 + b.y * 0.28 });
          else merge.push(b);
        });
        tracks = merge;
      }

      function drawOne(wctx, sw, sh, palette, layer) {
        if (!layer) return false;
        const v = layer.video;
        if (v && v.readyState >= 2) {
          drawCover(wctx, sw, sh, palette, v, v.videoWidth || 1280, v.videoHeight || 720);
          return true;
        }
        const poster = layer.clip.poster;
        if (poster) {
          const img = new Image();
          img.src = poster;
          if (img.complete && img.naturalWidth) {
            drawCover(wctx, sw, sh, palette, img, img.naturalWidth, img.naturalHeight);
            return true;
          }
        }
        wctx.fillStyle = palette.bg;
        wctx.fillRect(0, 0, sw, sh);
        return false;
      }

      function drawVideo(wctx, sw, sh, palette) {
        tickTiming();
        const mix = getBlendMix();
        const off = document.createElement("canvas");
        off.width = sw;
        off.height = sh;
        const octx = off.getContext("2d");

        if (mix > 0 && incoming) {
          drawOne(octx, sw, sh, palette, active);
          wctx.drawImage(off, 0, 0);
          octx.clearRect(0, 0, sw, sh);
          drawOne(octx, sw, sh, palette, incoming);
          wctx.save();
          wctx.globalAlpha = mix;
          wctx.drawImage(off, 0, 0);
          wctx.restore();
        } else if (active) {
          drawOne(wctx, sw, sh, palette, active);
        } else {
          wctx.fillStyle = palette.bg;
          wctx.fillRect(0, 0, sw, sh);
        }

        const pf = posterAlpha();
        if (pf > 0.02 && active && active.clip.poster) {
          const img = new Image();
          img.src = active.clip.poster;
          if (img.complete && img.naturalWidth) {
            wctx.save();
            wctx.globalAlpha = pf;
            drawCover(wctx, sw, sh, palette, img, img.naturalWidth, img.naturalHeight);
            wctx.restore();
          }
        }

        const hudV = incoming && mix > 0.35 ? incoming.video : active && active.video;
        hudT++;
        if (hudT % (mobile ? 2 : 1) === 0) detectMotion(hudV);
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

      function drawHud(ctx, w, h, palette) {
        const clip = (incoming && blendT > 0.5 ? incoming.clip : active && active.clip) || { category: "FEED" };
        ctx.save();
        const mono = `${mobile ? 11 : 13}px "Space Mono", monospace`;
        const t = performance.now() / 1000;
        ctx.font = mono;
        ctx.fillStyle = palette.fg;
        ctx.globalAlpha = 0.92;
        const tag = clip.category || "FEED";
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
          const p = 3;
          bracket(ctx, rx + p, ry + p, bw - p * 2, bh - p * 2, palette.accent);
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
        if (img.complete) wctx.drawImage(img, 0, 0, sw, sh);
        else img.onload = () => wctx.drawImage(img, 0, 0, sw, sh);
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
        tickPoster,
        getBlendMix,
        get active() {
          return active;
        },
      };
    },
  };
})();
