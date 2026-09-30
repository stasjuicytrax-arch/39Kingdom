import { SECTIONS, sectionNumberLabel } from './sections-registry';

const HIDE_THRESHOLD = 12; // px of scroll delta before toggling visibility

export function mountHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="site-header__zone site-header__zone--left">
      <a href="#hero" class="site-header__logo" data-cursor="link" aria-label="39 KINGDOM — back to top">
        <span class="site-header__logo-mark" aria-hidden="true"></span>
        <span>39KINGDOM</span>
      </a>
    </div>
    <div class="site-header__zone site-header__zone--center">
      <span>PRESS KIT 2026</span>
      <span class="site-header__divider" aria-hidden="true">—</span>
      <span>WELCOME TO OUR KINGDOM</span>
    </div>
    <div class="site-header__zone site-header__zone--right">
      <span class="site-header__section-number" data-section-number>01/11</span>
      <a href="#contact" class="site-header__book" data-cursor="link">BOOK ↗</a>
    </div>
  `;
  document.body.appendChild(header);

  let lastY = window.scrollY;
  let hidden = false;

  function onScroll() {
    const y = window.scrollY;
    const delta = y - lastY;

    if (y < HIDE_THRESHOLD * 4) {
      if (hidden) {
        hidden = false;
        header.classList.remove('site-header--hidden');
      }
    } else if (delta > HIDE_THRESHOLD && !hidden) {
      hidden = true;
      header.classList.add('site-header--hidden');
    } else if (delta < -HIDE_THRESHOLD && hidden) {
      hidden = false;
      header.classList.remove('site-header--hidden');
    }

    if (Math.abs(delta) > 1) lastY = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  return header;
}

/** Call once section elements exist in the DOM (header is mounted before
 * hero, so the header logo is available as a Flip target early). */
export function observeSections(header: HTMLElement): void {
  const numberEl = header.querySelector<HTMLElement>('[data-section-number]');
  if (!numberEl) return;

  const observer = new IntersectionObserver(
    (entries) => {
      let best: IntersectionObserverEntry | null = null;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
        }
      }
      if (best) {
        const section = SECTIONS.find((s) => s.id === best!.target.id);
        if (section) numberEl.textContent = sectionNumberLabel(section.index);
      }
    },
    { threshold: [0.25, 0.5, 0.75] }
  );

  for (const section of SECTIONS) {
    const el = document.getElementById(section.id);
    if (el) observer.observe(el);
  }
}
