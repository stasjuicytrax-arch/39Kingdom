/** Resolves a CSS custom property (e.g. "--c-bone") to its literal computed
 * color string, so GSAP can smoothly interpolate it (tweening `var(...)`
 * directly is not reliably animatable). */
export function tokenColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Same lookup, normalized to a [r, g, b] float triplet (0–1) for WebGL
 * uniforms — keeps shader colors reading from `tokens.css` instead of
 * duplicating hex values as a second source of truth. */
export function tokenColorRGB(name: string): [number, number, number] {
  const hex = tokenColor(name).replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  return [r, g, b];
}
