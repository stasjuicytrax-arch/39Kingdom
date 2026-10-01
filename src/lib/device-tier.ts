/** Per TZ §8: WebGL/particle layers stay off on slow hardware, falling back
 * to the simplified CSS variant instead. `deviceMemory` is Chromium-only —
 * absence doesn't imply a weak device, so it only downgrades when present. */
export function isLowPowerDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 8;
  const mem = nav.deviceMemory;
  return cores < 4 || (mem !== undefined && mem < 4);
}

export function isMobileViewport(): boolean {
  return window.matchMedia('(max-width: 767px)').matches;
}

export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
