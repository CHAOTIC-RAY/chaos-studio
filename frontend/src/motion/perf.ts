/** Pause heavy work when the tab is hidden. */
export function onVisibilityChange(handler: (visible: boolean) => void): () => void {
  const run = () => handler(!document.hidden);
  document.addEventListener("visibilitychange", run);
  return () => document.removeEventListener("visibilitychange", run);
}

/** Run callback only while `root` intersects the viewport. */
export function observeInView(
  root: Element | null,
  onVisible: () => void,
  onHidden: () => void,
  ratio = 0.08,
): () => void {
  if (!root) return () => {};
  let visible = false;
  const observer = new IntersectionObserver(
    (entries) => {
      const next = entries.some((e) => e.isIntersecting);
      if (next === visible) return;
      visible = next;
      if (next) onVisible();
      else onHidden();
    },
    { threshold: [0, ratio, 0.25] },
  );
  observer.observe(root);
  return () => observer.disconnect();
}
