import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import content from '../content.json';
import { isTouchDevice, prefersReducedMotion } from '../lib/reduced-motion';
import { assetUrl } from '../lib/asset-url';

gsap.registerPlugin(ScrollTrigger, SplitText);

const ORB_MAX_TRAVEL = 90; // px, how far the BOOK orb can drift from its resting spot

export function mountContact(root: HTMLElement): void {
  const contact = content.contact;

  const section = document.createElement('section');
  section.id = 'contact';
  section.className = 'contact';
  section.setAttribute('aria-label', 'Contact');

  section.innerHTML = `
    <img class="contact__symbol" src="${assetUrl('/img/brand/symbol-180.png')}" alt="" aria-hidden="true" width="90" height="90" />

    <div class="container contact__inner">
      <h2 class="contact__heading" data-heading>${contact.heading}</h2>
      <p class="contact__subheading">${contact.subheading}</p>

      <button type="button" class="contact__email" data-email data-cursor="link">
        ${contact.email}
        <span class="contact__copy-toast" data-toast aria-live="polite">COPIED ✱</span>
      </button>

      <div class="contact__downloads">
        ${downloadHtml(contact.downloads.mediaKit)}
        ${downloadHtml(contact.downloads.pressRelease)}
        ${downloadHtml(contact.downloads.pressKit)}
      </div>

      <div class="contact__orb-wrap" data-orb-wrap>
        <a class="btn-red-orb" href="mailto:${contact.email}" data-cursor="link" data-custom-magnet="true"><span>BOOK</span></a>
      </div>
    </div>
  `;

  root.appendChild(section);

  mountEmailCopy(section, contact.email);
  mountHeatingText(section);
  mountOrbChase(section);
}

function downloadHtml(d: { label: string; href: string }): string {
  const pending = !d.href;
  const href = pending ? '#' : assetUrl(d.href);
  return `<a class="btn-outline contact__download" href="${href}" ${pending ? 'data-todo="link"' : 'download'} data-cursor="link">${d.label} ↓</a>`;
}

function mountEmailCopy(section: HTMLElement, email: string): void {
  const btn = section.querySelector<HTMLButtonElement>('[data-email]');
  const toast = section.querySelector<HTMLElement>('[data-toast]');
  if (!btn || !toast) return;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — mailto below
      // still works as a fallback, so copy failure isn't fatal.
    }
    gsap.killTweensOf(toast);
    gsap.fromTo(
      toast,
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.25, onComplete: () => gsap.to(toast, { autoAlpha: 0, delay: 1.2, duration: 0.4 }) }
    );
    window.setTimeout(() => {
      window.location.href = `mailto:${email}`;
    }, 150);
  });
}

function mountHeatingText(section: HTMLElement): void {
  const heading = section.querySelector<HTMLElement>('[data-heading]');
  if (!heading || prefersReducedMotion()) return;

  // aria: 'none' — see the matching note in lib/preloader.ts: avoids GSAP
  // putting an aria-label on `heading`, which has no role to carry it.
  const split = new SplitText(heading, { type: 'chars', aria: 'none' });
  gsap.set(split.chars, { opacity: 0, yPercent: 40 });

  ScrollTrigger.create({
    trigger: heading,
    start: 'top 85%',
    once: true,
    onEnter: () =>
      gsap.to(split.chars, { opacity: 1, yPercent: 0, duration: 0.8, stagger: 0.025, ease: 'power3.out' }),
  });
}

function mountOrbChase(section: HTMLElement): void {
  if (isTouchDevice() || prefersReducedMotion()) return;

  const wrap = section.querySelector<HTMLElement>('[data-orb-wrap]');
  const orb = section.querySelector<HTMLElement>('.btn-red-orb');
  if (!wrap || !orb) return;

  const xTo = gsap.quickTo(orb, 'x', { duration: 0.7, ease: 'power3.out' });
  const yTo = gsap.quickTo(orb, 'y', { duration: 0.7, ease: 'power3.out' });

  section.addEventListener('mousemove', (e) => {
    const rect = wrap.getBoundingClientRect();
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const dx = gsap.utils.clamp(-ORB_MAX_TRAVEL, ORB_MAX_TRAVEL, (e.clientX - center.x) * 0.25);
    const dy = gsap.utils.clamp(-ORB_MAX_TRAVEL, ORB_MAX_TRAVEL, (e.clientY - center.y) * 0.25);
    xTo(dx);
    yTo(dy);
  });

  section.addEventListener('mouseleave', () => {
    xTo(0);
    yTo(0);
  });
}
