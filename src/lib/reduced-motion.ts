const query = window.matchMedia('(prefers-reduced-motion: reduce)');

export function prefersReducedMotion(): boolean {
  return query.matches;
}

export function onReducedMotionChange(cb: (reduced: boolean) => void): () => void {
  const handler = () => cb(query.matches);
  query.addEventListener('change', handler);
  return () => query.removeEventListener('change', handler);
}

export function isTouchDevice(): boolean {
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}
