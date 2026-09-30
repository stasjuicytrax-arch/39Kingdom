import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';
import content from '../content.json';
import { pillOrbHtml, outlineButtonHtml } from '../components/buttons';
import { getNextShow, formatShortDate, cityTimeZone } from '../lib/tour-helpers';
import { prefersReducedMotion } from '../lib/reduced-motion';
import { assetUrl } from '../lib/asset-url';

gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

export function mountHero(root: HTMLElement): void {
  const hero = content.hero;
  const nextShow = getNextShow(content.tour.dates);
  const tz = nextShow ? cityTimeZone(nextShow.city) : null;

  const section = document.createElement('section');
  section.id = 'hero';
  section.className = 'hero';
  section.setAttribute('aria-label', 'Hero');

  section.innerHTML = `
    <div class="hero__media">
      <picture class="hero__photo">
        <source type="image/avif" srcset="${srcset('hero', 'hero-main', 'avif')}" sizes="100vw" />
        <source type="image/webp" srcset="${srcset('hero', 'hero-main', 'webp')}" sizes="100vw" />
        <img
          src="${assetUrl('/img/hero/hero-main-1920.jpg')}"
          srcset="${srcset('hero', 'hero-main', 'jpg')}"
          sizes="100vw"
          alt="39 KINGDOM performing on a pyro-lit main stage"
          fetchpriority="high"
          loading="eager"
          decoding="async"
        />
      </picture>
      <video class="hero__video" muted loop playsinline preload="none" poster="${assetUrl('/img/hero/hero-main-1280.jpg')}" aria-hidden="true"></video>
      <canvas class="hero__fx" aria-hidden="true" data-hero-fx></canvas>
      <div class="hero__scrim" aria-hidden="true"></div>
      <div class="hero__darken" aria-hidden="true"></div>
      <div class="hero__frame" aria-hidden="true"></div>
    </div>

    <div class="hero__content container">
      <div class="hero__top">
        <p class="hero__subtitle">${hero.subtitle}</p>
        <div class="hero__stats">
          ${hero.stats
            .map(
              (s) => `
            <div class="glass-card">
              <span class="glass-card__value">${s.value}</span>
              <span class="glass-card__label">${s.label}</span>
            </div>`
            )
            .join('')}
        </div>
      </div>

      <div class="hero__meta-scatter">
        <p class="hero__meta-item">GENRE — ${hero.genre}</p>
        ${
          nextShow
            ? `<p class="hero__meta-item">NEXT: ${formatShortDate(nextShow.date)} ${nextShow.city.toUpperCase()}</p>`
            : ''
        }
        ${tz ? `<p class="hero__meta-item" data-local-time>LOCAL —</p>` : ''}
      </div>

      <div class="hero__bottom">
        <div class="hero__lineup-row">
          ${hero.lineupRow.map((item) => `<span>#${item.num} <b>${item.label}</b></span>`).join('<span class="hero__lineup-sep">·</span>')}
        </div>
        <div class="hero__cta">
          ${pillOrbHtml(hero.cta.book.label, hero.cta.book.href)}
          ${outlineButtonHtml('WATCH LIVE ▶', hero.cta.watch.href)}
        </div>
      </div>

      <p class="hero__scroll-cue">SCROLL ↓</p>
    </div>

    <h1 class="hero__wordmark">
      <span class="hero__wordmark-inner" data-wordmark>${hero.wordmark}</span>
    </h1>
  `;

  root.appendChild(section);

  if (tz) mountLocalClock(section, tz);
  mountMobileVideo(section);
  mountIntroAnimation(section);
  mountScrollAnimations(section);
}

function srcset(section: string, slug: string, ext: string): string {
  const widths = [640, 1280, 1920, 2560];
  return widths.map((w) => `${assetUrl(`/img/${section}/${slug}-${w}.${ext}`)} ${w}w`).join(', ');
}

function mountLocalClock(section: HTMLElement, timeZone: string): void {
  const el = section.querySelector<HTMLElement>('[data-local-time]');
  if (!el) return;
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
  const update = () => {
    el.textContent = `LOCAL ${formatter.format(new Date())}`;
  };
  update();
  setInterval(update, 30_000);
}

function mountMobileVideo(section: HTMLElement): void {
  const video = section.querySelector<HTMLVideoElement>('.hero__video');
  if (!video) return;

  const mq = window.matchMedia('(max-width: 767px)');
  let loaded = false;

  function sync() {
    if (mq.matches && !loaded) {
      loaded = true;
      const source = document.createElement('source');
      source.src = assetUrl('/video/hero-loop.mp4');
      source.type = 'video/mp4';
      video!.appendChild(source);
      video!.load();
      video!.play().catch(() => {});
    }
  }

  sync();
  mq.addEventListener('change', sync);
}

function mountIntroAnimation(section: HTMLElement): void {
  const wordmark = section.querySelector<HTMLElement>('[data-wordmark]');
  if (!wordmark) return;

  if (prefersReducedMotion()) {
    gsap.set(section.querySelectorAll('.hero__subtitle, .glass-card, .hero__meta-item, .hero__lineup-row, .hero__cta, .hero__scroll-cue'), {
      opacity: 1,
      y: 0,
    });
    return;
  }

  const split = new SplitText(wordmark, { type: 'chars' });
  gsap.set(split.chars, { yPercent: 115, fontVariationSettings: '"wdth" 125, "wght" 300' });

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to(split.chars, {
    yPercent: 0,
    fontVariationSettings: '"wdth" 62, "wght" 850',
    duration: 1.1,
    stagger: 0.03,
  })
    .from(
      section.querySelectorAll('.hero__subtitle, .glass-card'),
      { opacity: 0, y: 16, duration: 0.7, stagger: 0.08 },
      '-=0.7'
    )
    .from(
      section.querySelectorAll('.hero__meta-item, .hero__lineup-row, .hero__cta'),
      { opacity: 0, y: 12, duration: 0.6, stagger: 0.06 },
      '-=0.5'
    )
    .from(section.querySelector('.hero__scroll-cue'), { opacity: 0, duration: 0.6 }, '-=0.3');
}

function mountScrollAnimations(section: HTMLElement): void {
  const img = section.querySelector<HTMLImageElement>('.hero__photo img');
  const video = section.querySelector<HTMLVideoElement>('.hero__video');
  const darken = section.querySelector<HTMLElement>('.hero__darken');
  const frame = section.querySelector<HTMLElement>('.hero__frame');
  const wordmark = section.querySelector<HTMLElement>('.hero__wordmark');
  const headerLogo = document.querySelector<HTMLElement>('.site-header__logo');

  if (prefersReducedMotion()) return;

  const media = [img, video].filter(Boolean) as HTMLElement[];

  gsap.to(media, {
    scale: 1.15,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
  });

  if (darken) {
    gsap.to(darken, {
      opacity: 0.55,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  if (frame) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        const maxInset = gsap.utils.clamp(16, 48, window.innerWidth * 0.03);
        frame.style.boxShadow = `inset 0 0 0 ${(self.progress * maxInset).toFixed(1)}px var(--c-void)`;
      },
    });
  }

  if (wordmark && headerLogo) {
    mountWordmarkDocking(wordmark, headerLogo, section);
  }
}

/**
 * "Flies into header" effect: rather than scrubbing a single precomputed Flip
 * tween (which goes stale the instant the page scrolls, since the header logo
 * is `position: fixed` but the wordmark moves with normal document flow), we
 * trigger a one-shot Flip.from() at the moment the hero has scrolled past —
 * capturing live state in each direction so the math never depends on how far
 * the page has scrolled.
 */
function mountWordmarkDocking(wordmark: HTMLElement, headerLogo: HTMLElement, section: HTMLElement): void {
  let docked = false;

  function dock() {
    if (docked) return;
    docked = true;
    const state = Flip.getState(wordmark, { props: 'opacity' });
    wordmark.classList.add('hero__wordmark--docked');
    // clearProps: Flip would otherwise leave opacity as an inline style after
    // the tween, which (at highest specificity) would permanently block the
    // reverse transition from ever restoring opacity via the undocked class.
    // No `absolute` option needed — the wordmark is already position:absolute
    // (fixed when docked), never in normal flow, so nothing else reflows.
    Flip.from(state, { duration: 0.6, ease: 'power2.inOut', scale: true, clearProps: 'opacity' });
  }

  function undock() {
    if (!docked) return;
    docked = false;
    const state = Flip.getState(wordmark, { props: 'opacity' });
    wordmark.classList.remove('hero__wordmark--docked');
    Flip.from(state, { duration: 0.6, ease: 'power2.inOut', scale: true, clearProps: 'opacity' });
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'bottom top+=80',
    onEnter: dock,
    onLeaveBack: undock,
  });

  // Keep the docked target anchored to the header logo if it reflows (resize).
  window.addEventListener('resize', () => {
    if (docked) {
      const rect = headerLogo.getBoundingClientRect();
      gsap.set(wordmark, { '--dock-top': `${rect.top}px`, '--dock-left': `${rect.left}px` });
    }
  });

  const rect = headerLogo.getBoundingClientRect();
  gsap.set(wordmark, { '--dock-top': `${rect.top}px`, '--dock-left': `${rect.left}px` });
}
