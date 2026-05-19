export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function onReducedMotionChange(callback: (reduced: boolean) => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = () => callback(mq.matches);
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
