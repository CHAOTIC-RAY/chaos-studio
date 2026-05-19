/** Shared smoothed pointer position (0–1 normalized + px) */
export const mouse = {
  x: 0.5,
  y: 0.5,
  px: 0,
  py: 0,
  active: false,
};

const smooth = { x: 0.5, y: 0.5 };
let raf = 0;

export function initMouseState(): () => void {
  const onMove = (e: MouseEvent) => {
    mouse.active = true;
    mouse.px = e.clientX;
    mouse.py = e.clientY;
    mouse.x = e.clientX / window.innerWidth;
    mouse.y = e.clientY / window.innerHeight;
  };
  const onLeave = () => {
    mouse.active = false;
  };

  const tick = () => {
    smooth.x += (mouse.x - smooth.x) * 0.08;
    smooth.y += (mouse.y - smooth.y) * 0.08;
    raf = requestAnimationFrame(tick);
  };

  window.addEventListener("mousemove", onMove, { passive: true });
  document.documentElement.addEventListener("mouseleave", onLeave);
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("mousemove", onMove);
    document.documentElement.removeEventListener("mouseleave", onLeave);
  };
}

export function getSmoothMouse(): { x: number; y: number } {
  return { x: smooth.x, y: smooth.y };
}
