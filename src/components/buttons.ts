import { gsap } from 'gsap';
import { isTouchDevice, prefersReducedMotion } from '../lib/reduced-motion';

export function pillOrbHtml(label: string, href: string, opts: { cursor?: boolean } = {}): string {
  const cursorAttr = opts.cursor === false ? '' : 'data-cursor="link"';
  return `<a class="btn-pill-orb" href="${href}" ${cursorAttr}>
    <span class="btn-pill-orb__label">${label}</span>
    <span class="btn-pill-orb__orb" aria-hidden="true">↗</span>
  </a>`;
}

export function outlineButtonHtml(label: string, href: string): string {
  return `<a class="btn-outline" href="${href}" data-cursor="link">${label}</a>`;
}

export function redOrbHtml(label: string, href: string, cursorState = 'play'): string {
  return `<a class="btn-red-orb" href="${href}" data-cursor="${cursorState}"><span>${label}</span></a>`;
}

export function pillTagHtml(label: string): string {
  return `<span class="pill-tag">${label}</span>`;
}

/** Attach a subtle magnetic pull to pill-orb / red-orb / outline buttons. Skips touch + reduced-motion. */
export function initMagneticButtons(root: ParentNode = document): void {
  if (isTouchDevice() || prefersReducedMotion()) return;

  const targets = root.querySelectorAll<HTMLElement>('.btn-pill-orb, .btn-red-orb');
  targets.forEach((el) => {
    const strength = el.classList.contains('btn-red-orb') ? 0.35 : 0.25;
    const maxOffset = el.classList.contains('btn-red-orb') ? 20 : 12;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      xTo(gsap.utils.clamp(-maxOffset, maxOffset, relX * strength));
      yTo(gsap.utils.clamp(-maxOffset, maxOffset, relY * strength));
    });

    el.addEventListener('mouseleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}
