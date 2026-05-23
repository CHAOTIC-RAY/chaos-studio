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
    schedule();
  };
  const onLeave = () => {
    mouse.active = false;
    schedule();
  };

  const tick = () => {
    raf = 0;
    const dx = mouse.x - smooth.x;
    const dy = mouse.y - smooth.y;
    smooth.x += dx * 0.1;
    smooth.y += dy * 0.1;

    const settling =
      !mouse.active &&
      Math.abs(dx) < 0.00025 &&
      Math.abs(dy) < 0.00025 &&
      Math.abs(smooth.x - 0.5) < 0.00025 &&
      Math.abs(smooth.y - 0.5) < 0.00025;

    if (!settling) schedule();
  };

  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  window.addEventListener("mousemove", onMove, { passive: true });
  document.documentElement.addEventListener("mouseleave", onLeave);
  schedule();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("mousemove", onMove);
    document.documentElement.removeEventListener("mouseleave", onLeave);
  };
}

export function getSmoothMouse(): { x: number; y: number } {
  return { x: smooth.x, y: smooth.y };
}
