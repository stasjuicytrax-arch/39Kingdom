import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { prefersReducedMotion } from './reduced-motion';
import { assetUrl } from './asset-url';

gsap.registerPlugin(SplitText);

const SEEN_KEY = '39k-preloader-seen';
const COMPLETE_EVENT = 'preloader:complete';

let resolved = false;

/** Runs `cb` once the preloader has finished (or immediately if it already
 * has, or never runs this session) — lets other modules, like the hero's
 * own intro animation, wait for the reveal moment without main.ts having to
 * delay mounting anything. */
export function onPreloaderComplete(cb: () => void): void {
  if (resolved) {
    cb();
    return;
  }
  window.addEventListener(COMPLETE_EVENT, cb, { once: true });
}

function complete(): void {
  if (resolved) return;
  resolved = true;
  window.dispatchEvent(new CustomEvent(COMPLETE_EVENT));
}

export function mountPreloader(): void {
  if (sessionStorage.getItem(SEEN_KEY)) {
    complete();
    return;
  }
  sessionStorage.setItem(SEEN_KEY, '1');

  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const reduced = prefersReducedMotion();
  const budget = reduced ? 400 : isMobile ? 1500 : 2200;

  const el = document.createElement('div');
  el.className = 'preloader';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <div class="preloader__tear preloader__tear--top"></div>
    <div class="preloader__tear preloader__tear--bottom"></div>
    <div class="preloader__content" data-content>
      <span class="preloader__count" data-count>00</span>
      <div class="preloader__symbol-wrap" data-symbol-wrap>
        <img class="preloader__symbol" src="${assetUrl('/img/brand/symbol-480.png')}" alt="" />
      </div>
      <h1 class="preloader__logo" data-logo>39KINGDOM</h1>
    </div>
  `;
  document.body.appendChild(el);
  document.body.classList.add('preloader-active'); // scroll-lock, see global.css

  if (reduced) {
    gsap.to(el, {
      opacity: 0,
      duration: 0.3,
      delay: budget / 1000,
      onComplete: () => finish(el),
    });
    return;
  }

  const content = el.querySelector<HTMLElement>('[data-content]')!;
  const countEl = el.querySelector<HTMLElement>('[data-count]')!;
  const logo = el.querySelector<HTMLElement>('[data-logo]')!;
  const symbolWrap = el.querySelector<HTMLElement>('[data-symbol-wrap]')!;
  const tearTop = el.querySelector<HTMLElement>('.preloader__tear--top')!;
  const tearBottom = el.querySelector<HTMLElement>('.preloader__tear--bottom')!;

  // aria: 'none' — the plain text is still readable by assistive tech as-is
  // (it's not removed, just wrapped in spans); GSAP's default 'auto' mode
  // adds an aria-label to compensate for hiding the split children, but that
  // label lands on a <h1> here, which has no role to carry it (axe/Lighthouse
  // flag it as invalid) — this sidesteps the whole mechanism instead.
  const split = new SplitText(logo, { type: 'chars', aria: 'none' });
  gsap.set(split.chars, { opacity: 0, fontVariationSettings: '"wdth" 125, "wght" 300' });
  gsap.set(symbolWrap, { clipPath: 'inset(0 100% 0 0)' });

  const counter = { value: 0 };
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    onComplete: () => finish(el),
  });

  const symbolDuration = budget * 0.32;
  const logoDuration = budget * 0.3;
  const holdDuration = budget * 0.13;
  const tearDuration = budget * 0.25;

  tl.to(symbolWrap, { clipPath: 'inset(0 0% 0 0)', duration: symbolDuration / 1000, ease: 'power1.inOut' }, 0)
    .to(
      counter,
      {
        value: 39,
        duration: (symbolDuration + logoDuration) / 1000,
        snap: { value: 1 },
        ease: 'none',
        onUpdate: () => {
          countEl.textContent = String(counter.value).padStart(2, '0');
        },
      },
      0
    )
    .to(
      split.chars,
      {
        opacity: 1,
        fontVariationSettings: '"wdth" 62, "wght" 850',
        duration: logoDuration / 1000,
        stagger: logoDuration / 1000 / split.chars.length,
      },
      symbolDuration / 1000
    )
    // Torn-paper exit: content fades, then the two halves pull apart
    // (a fixed jagged edge, cheap transform-only animation) to reveal hero.
    .to(content, { opacity: 0, duration: holdDuration / 1000 }, `+=${holdDuration / 1000}`)
    .to(tearTop, { yPercent: -100, duration: tearDuration / 1000, ease: 'power3.in' }, '<')
    .to(tearBottom, { yPercent: 100, duration: tearDuration / 1000, ease: 'power3.in' }, '<');
}

function finish(el: HTMLElement): void {
  document.body.classList.remove('preloader-active');
  el.remove();
  complete();
}
