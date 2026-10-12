import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import content from '../content.json';
import { overlineHtml } from '../components/overline';
import { autoplayInViewport } from '../lib/viewport-video';
import { lazyPoster } from '../lib/lazy-poster';
import { isTouchDevice, prefersReducedMotion } from '../lib/reduced-motion';
import { isMobileViewport } from '../lib/device-tier';
import { assetUrl } from '../lib/asset-url';
import { getLenis } from '../lib/smooth-scroll';

gsap.registerPlugin(ScrollTrigger, Flip);

const CARD_WIDTH = 280;
const CARD_GAP = 28;

interface DeckItem {
  kind: 'local' | 'youtube';
  key: string;
  caption: string;
  meta: string;
  thumb: string;
  playSrc: string; // full-quality video src (local) or embed URL (youtube)
  cardVideo?: { mp4: string; webm: string }; // muted preview loop (local only)
}

export function mountLive(root: HTMLElement): void {
  const live = content.live;

  const deck: DeckItem[] = [
    ...live.localVideos.map((v) => ({
      kind: 'local' as const,
      key: v.slug,
      caption: v.caption,
      meta: 'LOCAL SET',
      thumb: v.poster,
      playSrc: v.full,
      cardVideo: v.card,
    })),
    ...live.sets.map((s) => {
      const id = youtubeId(s.url);
      return {
        kind: 'youtube' as const,
        key: id,
        caption: s.title,
        meta: s.duration,
        thumb: id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : '',
        playSrc: id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : s.url,
      };
    }),
  ];

  const section = document.createElement('section');
  section.id = 'live';
  section.className = 'live';
  section.setAttribute('aria-label', live.title);

  section.innerHTML = `
    <div class="live__intro" data-intro>
      <video class="live__intro-video" data-intro-video data-poster="${live.localVideos[0]?.poster ?? ''}" muted loop playsinline preload="none" aria-hidden="true">
        <source src="${live.localVideos[0] ? assetUrl(live.localVideos[0].card.webm) : ''}" type="video/webm" />
        <source src="${live.localVideos[0] ? assetUrl(live.localVideos[0].card.mp4) : ''}" type="video/mp4" />
      </video>
      <p class="live__intro-word" aria-hidden="true">live.</p>
    </div>

    <div class="container live__head">
      ${overlineHtml(6)}
      <h2 class="live__title">${live.title}</h2>
    </div>

    <div class="live__stage" data-stage>
      <div class="live__rail">
        <div class="live__viewport" data-viewport data-cursor="drag" tabindex="0" role="group" aria-label="Live sets — use left and right arrow keys to browse">
          <div class="live__track" data-track>
            ${deck.map((item, i) => cardHtml(item, i)).join('')}
          </div>
        </div>
        <button type="button" class="live__nav live__nav--prev" data-nav="-1" data-cursor="link" aria-label="Previous set">←</button>
        <button type="button" class="live__nav live__nav--next" data-nav="1" data-cursor="link" aria-label="Next set">→</button>
      </div>

      <div class="live__timeline" data-timeline>
        <div class="live__timeline-wave" aria-hidden="true"></div>
        <div class="live__timeline-bar"><div class="live__timeline-fill" data-timeline-fill></div></div>
        <div class="live__timeline-ticks">
          ${deck.map((d, i) => `<button type="button" data-timeline-tick="${i}" data-cursor="link" aria-label="Go to ${d.caption}">${String(i + 1).padStart(2, '0')}</button>`).join('')}
        </div>
      </div>
    </div>

    <p class="live__footnote container">${live.footnote}</p>

    <div class="live-player" data-player aria-hidden="true">
      <button type="button" class="live-player__close" data-cursor="link" aria-label="Close player">CLOSE ✕</button>
      <div class="live-player__stage" data-player-stage></div>
    </div>
  `;

  root.appendChild(section);

  mountIntroReveal(section);
  mountHorizontalScroll(section, deck.length);
  mountCardVideos(section);
  mountPlayer(section, deck);
}

function cardHtml(item: DeckItem, i: number): string {
  const isYoutube = item.kind === 'youtube';
  return `
    <button type="button" class="live__card live__card--${item.kind}" data-card data-index="${i}" data-cursor="play">
      <span class="visually-hidden">Play: </span>
      <span class="live__card-media">
        ${
          item.kind === 'local' && item.cardVideo
            ? `<video class="live__card-video" data-card-video data-poster="${item.thumb}" muted loop playsinline preload="none">
                <source src="${assetUrl(item.cardVideo.webm)}" type="video/webm" />
                <source src="${assetUrl(item.cardVideo.mp4)}" type="video/mp4" />
              </video>`
            : `<img src="${assetUrl(item.thumb)}" alt="" loading="lazy" decoding="async" />`
        }
        <span class="live__card-play" aria-hidden="true">▶</span>
      </span>
      <span class="live__card-meta">
        <span class="live__card-caption">${item.caption}</span>
        <span class="live__card-duration">${isYoutube ? item.meta : 'LIVE CLIP'}</span>
      </span>
      <span class="pill-tag live__card-tag">${isYoutube ? 'FULL SET ↗' : 'WATCH ↗'}</span>
    </button>
  `;
}

function youtubeId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
  return match?.[1] ?? '';
}

/** Sets both the standard and -webkit- prefixed form of a mask property.
 * `setProperty` (unlike the typed CSSStyleDeclaration properties) accepts
 * any property name, so no `as unknown as ...` casts are needed. */
function setMask(el: HTMLElement, prop: string, value: string): void {
  el.style.setProperty(`mask-${prop}`, value);
  el.style.setProperty(`-webkit-mask-${prop}`, value);
}

function mountIntroReveal(section: HTMLElement): void {
  const intro = section.querySelector<HTMLElement>('[data-intro]');
  const video = section.querySelector<HTMLVideoElement>('[data-intro-video]');
  const word = section.querySelector<HTMLElement>('.live__intro-word');
  if (!intro || !video || !word) return;

  if (video.dataset.poster) lazyPoster(video, assetUrl(video.dataset.poster));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="500"><text x="50%" y="52%" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-weight="800" font-size="380" letter-spacing="-16">live.</text></svg>`;
  const maskUrl = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  setMask(video, 'image', maskUrl);
  setMask(video, 'repeat', 'no-repeat');
  setMask(video, 'position', 'center');
  setMask(video, 'size', '58% auto');

  autoplayInViewport(video);

  if (prefersReducedMotion()) {
    gsap.set(word, { opacity: 0 });
    setMask(video, 'size', '2000% auto');
    return;
  }

  ScrollTrigger.create({
    trigger: intro,
    start: 'top 70%',
    once: true,
    onEnter: () => {
      const tl = gsap.timeline({ delay: 0.3 });
      tl.to(word, { opacity: 0, scale: 1.15, duration: 0.5, ease: 'power2.in' }, 0.8)
        .to(
          video,
          {
            duration: 1.3,
            ease: 'power3.inOut',
            onUpdate: function () {
              const p = this.progress();
              const size = 58 + p * 1900; // grows past viewport, mask effectively disappears
              setMask(video, 'size', `${size}% auto`);
            },
          },
          0.9
        );
    },
  });
}

function mountHorizontalScroll(section: HTMLElement, count: number): void {
  const stage = section.querySelector<HTMLElement>('[data-stage]');
  const viewport = section.querySelector<HTMLElement>('[data-viewport]');
  const track = section.querySelector<HTMLElement>('[data-track]');
  const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-card]'));
  const fill = section.querySelector<HTMLElement>('[data-timeline-fill]');
  const ticks = Array.from(section.querySelectorAll<HTMLElement>('[data-timeline-tick]'));
  if (!stage || !viewport || !track) return;

  if (prefersReducedMotion()) return;

  // TZ §8: the scroll-pinned horizontal carousel is a desktop device — on
  // mobile it becomes a plain vertical swipe-slider through the (mostly
  // 9:16) cards, no page-scroll hijacking.
  if (isMobileViewport()) {
    mountVerticalSwipe(viewport, cards, fill, ticks);
    return;
  }

  const trackWidth = count * (CARD_WIDTH + CARD_GAP);
  gsap.set(track, { width: trackWidth });

  function tiltCards(): void {
    // Read all rects before writing any transform — see the matching note
    // in lineup.ts's styleCards().
    const centerX = window.innerWidth / 2;
    const rects = cards.map((card) => card.getBoundingClientRect());
    cards.forEach((card, i) => {
      const rect = rects[i];
      const cardCenter = rect.left + rect.width / 2;
      const dist = gsap.utils.clamp(-1.2, 1.2, (cardCenter - centerX) / centerX);
      gsap.set(card, { rotateY: dist * -14, scale: 1 - Math.abs(dist) * 0.08 });
    });
  }

  const scrollDistance = Math.max(trackWidth - viewport.clientWidth, 400);

  const trigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${scrollDistance}`,
    pin: stage,
    scrub: 1,
    onUpdate: (self) => {
      gsap.set(track, { x: -self.progress * scrollDistance });
      tiltCards();
      if (fill) fill.style.transform = `scaleX(${self.progress})`;
      const activeIndex = Math.min(count - 1, Math.floor(self.progress * count));
      ticks.forEach((t, i) => t.classList.toggle('is-active', i === activeIndex));
    },
  });

  window.addEventListener('resize', () => trigger.refresh());

  // Extra desktop controls. The pinned scrub stays the single source of truth:
  // everything below only moves window scroll (through Lenis when active), so
  // ScrollTrigger keeps driving the strip and the timeline.
  const minY = () => trigger.start;
  const maxY = () => trigger.end;
  const span = () => Math.max(1, maxY() - minY());
  const goTo = (y: number, immediate = false) => {
    const target = Math.min(maxY(), Math.max(minY(), y));
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(target, { immediate, duration: 0.9 });
    else window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' });
  };
  const lastIndex = Math.max(1, count - 1);
  const nearestIndex = () => Math.round(((window.scrollY - minY()) / span()) * lastIndex);
  const goToIndex = (i: number) => goTo(minY() + (Math.min(lastIndex, Math.max(0, i)) / lastIndex) * span());
  // pointer px -> page-scroll px, so 1px of drag moves the strip ~1px
  const dragRatio = () => span() / Math.max(1, trackWidth - viewport.clientWidth);

  section.querySelectorAll<HTMLElement>('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => goToIndex(nearestIndex() + Number(btn.dataset.nav)));
  });
  ticks.forEach((tick, i) => tick.addEventListener('click', () => goToIndex(i)));

  viewport.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    goToIndex(nearestIndex() + (e.key === 'ArrowRight' ? 1 : -1));
  });

  // Sideways wheel / trackpad swipe moves the strip; a plain vertical wheel
  // keeps scrolling the page (and so the pinned scrub) as before.
  viewport.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      goTo(window.scrollY + e.deltaX * dragRatio(), true);
    },
    { passive: false }
  );

  if (!isTouchDevice()) {
    let down = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0; // pointer px/ms, smoothed

    viewport.addEventListener('pointerdown', (e) => {
      down = true;
      moved = false;
      startX = lastX = e.clientX;
      lastT = performance.now();
      velocity = 0;
      startScroll = window.scrollY;
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!down) return;
      if (!moved) {
        if (Math.abs(e.clientX - startX) < 6) return;
        moved = true;
        viewport.setPointerCapture(e.pointerId);
        viewport.classList.add('is-dragging');
      }
      const now = performance.now();
      velocity = velocity * 0.6 + ((e.clientX - lastX) / Math.max(1, now - lastT)) * 0.4;
      lastX = e.clientX;
      lastT = now;
      goTo(startScroll - (e.clientX - startX) * dragRatio(), true);
    });
    const end = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      viewport.classList.remove('is-dragging');
      if (!moved) return;
      // inertia: coast ~350ms worth of the release velocity
      goTo(window.scrollY - velocity * 350 * dragRatio());
      if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
    };
    viewport.addEventListener('pointerup', end);
    viewport.addEventListener('pointercancel', end);
    // a drag must not count as a click on the card underneath
    viewport.addEventListener(
      'click',
      (e) => {
        if (!moved) return;
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      },
      true
    );
  }
}

/** Mobile fallback for the horizontal pinned carousel: a native vertical
 * scroll-snap slider (CSS does the swiping; this just keeps the timeline
 * in sync with whichever card is centered). */
function mountVerticalSwipe(
  viewport: HTMLElement,
  cards: HTMLElement[],
  fill: HTMLElement | null,
  ticks: HTMLElement[]
): void {
  viewport.classList.add('is-vertical-swipe');
  if (!cards.length) return;

  function setActive(i: number): void {
    if (fill) fill.style.transform = `scaleX(${(i + 1) / cards.length})`;
    ticks.forEach((t, idx) => t.classList.toggle('is-active', idx === i));
  }
  setActive(0);
  ticks.forEach((tick, i) =>
    tick.addEventListener('click', () => cards[i]?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
  );

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const i = cards.indexOf(entry.target as HTMLElement);
        if (i >= 0) setActive(i);
      }
    },
    { root: viewport, threshold: 0.6 }
  );
  cards.forEach((card) => io.observe(card));
}

function mountCardVideos(section: HTMLElement): void {
  const videos = section.querySelectorAll<HTMLVideoElement>('[data-card-video]');
  videos.forEach((v) => {
    if (v.dataset.poster) lazyPoster(v, assetUrl(v.dataset.poster));
    autoplayInViewport(v);
  });
}

function mountPlayer(section: HTMLElement, deck: DeckItem[]): void {
  const playerEl = section.querySelector<HTMLElement>('[data-player]');
  const stageEl = section.querySelector<HTMLElement>('[data-player-stage]');
  const closeBtnEl = section.querySelector<HTMLButtonElement>('.live-player__close');
  if (!playerEl || !stageEl || !closeBtnEl) return;
  // Re-bound as new consts: TS narrowing from the guard above doesn't carry
  // into the nested functions below, since they could in principle run
  // later — these fresh, never-reassigned bindings are typed non-null
  // directly from their (already-checked) initializers instead.
  const player = playerEl;
  const stage = stageEl;
  const closeBtn = closeBtnEl;

  const reduced = prefersReducedMotion();
  let open = false;
  let triggerEl: HTMLElement | null = null;

  function openPlayer(card: HTMLElement, item: DeckItem): void {
    triggerEl = card;
    open = true;
    document.body.classList.add('menu-open');
    player.setAttribute('aria-hidden', 'false');

    stage.innerHTML =
      item.kind === 'local'
        ? `<video src="${assetUrl(item.playSrc)}" controls autoplay playsinline class="live-player__video"></video>`
        : `<iframe src="${assetUrl(item.playSrc)}" title="${item.caption}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen class="live-player__iframe"></iframe>`;

    const media = card.querySelector('img, video');
    if (!reduced && media) {
      const state = Flip.getState(media);
      gsap.set(player, { display: 'flex' });
      gsap.fromTo(player, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 });
      requestAnimationFrame(() => Flip.from(state, { targets: stage, duration: 0.5, ease: 'power2.inOut', absolute: true }));
    } else {
      gsap.set(player, { display: 'flex', autoAlpha: 1 });
    }
    closeBtn.focus();
  }

  function closePlayer(): void {
    open = false;
    document.body.classList.remove('menu-open');
    player.setAttribute('aria-hidden', 'true');
    triggerEl?.focus();
    gsap.to(player, {
      autoAlpha: 0,
      duration: 0.3,
      onComplete: () => {
        gsap.set(player, { display: 'none' });
        stage.innerHTML = '';
      },
    });
  }

  section.querySelectorAll<HTMLElement>('[data-card]').forEach((card, i) => {
    card.addEventListener('click', () => openPlayer(card, deck[i]));
  });
  closeBtn.addEventListener('click', closePlayer);
  player.addEventListener('click', (e) => {
    if (e.target === player) closePlayer();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) closePlayer();
  });
}
