/** Resolves a CSS custom property (e.g. "--c-bone") to its literal computed
 * color string, so GSAP can smoothly interpolate it (tweening `var(...)`
 * directly is not reliably animatable). */
export function tokenColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
