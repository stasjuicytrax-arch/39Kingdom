import { prefersReducedMotion } from './reduced-motion';
import { isLowPowerDevice, isMobileViewport, supportsWebGL } from './device-tier';

/** Shared go/no-go for every WebGL layer (hero heat-haze, Recognition RGB
 * shift): off under reduced motion, on touch/mobile viewports, on weak
 * hardware, or without WebGL support — each of those falls back to its
 * CSS-only variant per TZ §8. */
export function shouldUseWebGL(): boolean {
  return !prefersReducedMotion() && !isMobileViewport() && !isLowPowerDevice() && supportsWebGL();
}

/** Defers `cb` until the window `load` event (or fires on the next tick if
 * load already happened) — keeps WebGL off the critical path per TZ §8. */
export function afterLoad(cb: () => void): void {
  if (document.readyState === 'complete') {
    window.setTimeout(cb, 0);
  } else {
    window.addEventListener('load', () => cb(), { once: true });
  }
}
