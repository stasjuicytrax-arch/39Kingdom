import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import content from '../content.json';
import { overlineHtml } from '../components/overline';
import { prefersReducedMotion } from '../lib/reduced-motion';
import { isTouchDevice } from '../lib/reduced-motion';

gsap.registerPlugin(ScrollTrigger);

export function mountHighlights(root: HTMLElement): void {
  const h = content.highlights;

  const section = document.createElement('section');
  section.id = 'highlights';
  section.className = 'highlights';
  section.setAttribute('aria-label', h.title);

  section.innerHTML = `
    <div class="container grid highlights__layout">
      <div class="highlights__sticky">
        ${overlineHtml(3)}
        <h2 class="highlights__title">${h.title}</h2>
        <div class="highlights__counters">
          ${h.counters
            .map(
              (c) => `
            <div class="highlights__counter">
              <span class="highlights__counter-value" data-counter data-target="${c.value}" data-suffix="${c.suffix}">0${c.suffix}</span>
              <span class="highlights__counter-label">${c.label}</span>
            </div>`
            )
            .join('')}
        </div>
        <p class="highlights__lead">${h.lead}</p>
      </div>

      <div class="highlights__list-wrap">
        ${marqueeHtml(h.marqueeCities)}
        <div class="highlights__list" data-list>
          ${h.venuesByCountry
            .map((group) =>
              group.venues
                .map(
                  (v, i) => `
              <div class="highlights__row" data-poster="${v.poster ? `/img/lineup/${v.poster}-640.jpg` : ''}">
                <span class="highlights__row-country">${i === 0 ? group.country : ''}</span>
                <span class="highlights__row-venue">${v.name}</span>
                <span class="highlights__row-city">${v.city}</span>
              </div>`
                )
                .join('')
            )
            .join('')}
        </div>
      </div>
    </div>

    <div class="highlights__preview" data-preview aria-hidden="true">
      <img data-preview-img alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7" />
    </div>
  `;

  root.appendChild(section);

  mountCounters(section);
  mountMarquee(section);
  mountRowPreview(section);
}

function marqueeHtml(cities: string[]): string {
  const line = cities.join(' · ') + ' · ';
  const track = line.repeat(2); // duplicated for seamless -50% loop
  return `
    <div class="highlights__marquee" aria-hidden="true">
      <div class="highlights__marquee-row">
        <div class="highlights__marquee-track highlights__marquee-track--a">${track}</div>
      </div>
      <div class="highlights__marquee-row highlights__marquee-row--reverse">
        <div class="highlights__marquee-track highlights__marquee-track--b">${track}</div>
      </div>
    </div>
  `;
}

function mountCounters(section: HTMLElement): void {
  const counters = section.querySelectorAll<HTMLElement>('[data-counter]');
  const reduced = prefersReducedMotion();

  counters.forEach((el) => {
    const target = Number(el.dataset.target ?? 0);
    const suffix = el.dataset.suffix ?? '';

    if (reduced) {
      el.textContent = `${target}${suffix}`;
      return;
    }

    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () =>
        gsap.to(obj, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          snap: { val: 1 },
          onUpdate: () => {
            el.textContent = `${obj.val}${suffix}`;
          },
        }),
    });
  });
}

function mountMarquee(section: HTMLElement): void {
  const tracks = section.querySelectorAll<HTMLElement>('.highlights__marquee-track');
  if (prefersReducedMotion() || tracks.length === 0) return;

  const rows = section.querySelectorAll<HTMLElement>('.highlights__marquee-row');
  const skewTo = gsap.quickTo(rows, 'skewX', { duration: 0.4, ease: 'power3.out' });

  let lastY = window.scrollY;
  let lastT = performance.now();
  let idleTimer: number | undefined;

  window.addEventListener(
    'scroll',
    () => {
      const now = performance.now();
      const y = window.scrollY;
      const dt = Math.max(now - lastT, 1);
      const velocity = (y - lastY) / dt; // px per ms
      lastY = y;
      lastT = now;

      const skew = gsap.utils.clamp(-14, 14, velocity * 60);
      skewTo(skew);

      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => skewTo(0), 150);
    },
    { passive: true }
  );
}

function mountRowPreview(section: HTMLElement): void {
  if (isTouchDevice() || prefersReducedMotion()) return;

  const list = section.querySelector<HTMLElement>('[data-list]');
  const preview = section.querySelector<HTMLElement>('[data-preview]');
  const previewImg = section.querySelector<HTMLImageElement>('[data-preview-img]');
  if (!list || !preview || !previewImg) return;

  const xTo = gsap.quickTo(preview, 'x', { duration: 0.35, ease: 'power3.out' });
  const yTo = gsap.quickTo(preview, 'y', { duration: 0.35, ease: 'power3.out' });
  const rotateTo = gsap.quickTo(preview, 'rotate', { duration: 0.4, ease: 'power3.out' });

  let lastX = 0;
  let activeRow: HTMLElement | null = null;

  list.addEventListener('mousemove', (e) => {
    const row = (e.target as Element)?.closest<HTMLElement>('.highlights__row');
    xTo(e.clientX);
    yTo(e.clientY);
    rotateTo(gsap.utils.clamp(-18, 18, (e.clientX - lastX) * 2));
    lastX = e.clientX;

    if (row !== activeRow) {
      activeRow = row;
      const src = row?.dataset.poster;
      if (row && src) {
        previewImg.src = src;
        gsap.to(preview, { autoAlpha: 1, duration: 0.25 });
      } else {
        gsap.to(preview, { autoAlpha: 0, duration: 0.25 });
      }
    }
  });

  list.addEventListener('mouseleave', () => {
    activeRow = null;
    gsap.to(preview, { autoAlpha: 0, duration: 0.25 });
  });
}
