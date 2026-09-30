import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import content from '../content.json';
import { overlineHtml } from '../components/overline';
import { isTouchDevice, prefersReducedMotion } from '../lib/reduced-motion';
import { assetUrl } from '../lib/asset-url';

gsap.registerPlugin(ScrollTrigger, Flip);

const CARD_WIDTH = 320; // px, matches --lineup-card-w below
const CARD_GAP = 32;

export function mountLineup(root: HTMLElement): void {
  const lineup = content.lineup;

  const section = document.createElement('section');
  section.id = 'lineup';
  section.className = 'lineup';
  section.setAttribute('aria-label', lineup.title);

  section.innerHTML = `
    <div class="lineup__bg" aria-hidden="true">LINE-UP</div>
    <div class="container lineup__head">
      ${overlineHtml(4)}
      <h2 class="lineup__title">${lineup.title}</h2>
      <p class="lineup__subtitle">${lineup.subtitle}</p>
    </div>
    <div class="lineup__viewport" data-viewport data-cursor="drag">
      <div class="lineup__track" data-track>
        ${lineup.posters
          .map(
            (p, i) => `
          <button type="button" class="lineup__card" data-card data-index="${i}" data-cursor="view" aria-label="View poster: ${p.caption}">
            <span class="lineup__card-tag pill-tag">${p.tag}</span>
            <span class="lineup__card-media">
              <picture>
                <source type="image/avif" srcset="${srcset(p.slug, 'avif')}" sizes="320px" />
                <source type="image/webp" srcset="${srcset(p.slug, 'webp')}" sizes="320px" />
                <img src="${assetUrl(`/img/lineup/${p.slug}-640.jpg`)}" srcset="${srcset(p.slug, 'jpg')}" sizes="320px" alt="" loading="lazy" decoding="async" />
              </picture>
              <span class="lineup__card-shine" aria-hidden="true"></span>
            </span>
            <span class="lineup__card-caption">${p.caption}</span>
          </button>`
          )
          .join('')}
      </div>
    </div>
  `;

  root.appendChild(section);

  mountCarousel(section, lineup.posters.length);
  mountCardShine(section);
  mountLightbox(section, lineup.posters);
}

function srcset(slug: string, ext: string): string {
  const widths = [640, 1024, 1440, 1920];
  return widths.map((w) => `${assetUrl(`/img/lineup/${slug}-${w}.${ext}`)} ${w}w`).join(', ');
}

function mountCarousel(section: HTMLElement, count: number): void {
  const viewport = section.querySelector<HTMLElement>('[data-viewport]');
  const track = section.querySelector<HTMLElement>('[data-track]');
  const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-card]'));
  if (!viewport || !track) return;

  const trackWidth = count * (CARD_WIDTH + CARD_GAP);
  const reduced = prefersReducedMotion();

  function styleCards(): void {
    // Read every card's rect first, then write — interleaving
    // getBoundingClientRect() with gsap.set() per card forces a style/layout
    // flush on each iteration (classic read/write thrashing) since scrub
    // fires this every scroll frame.
    const centerX = window.innerWidth / 2;
    const rects = cards.map((card) => card.getBoundingClientRect());
    cards.forEach((card, i) => {
      const rect = rects[i];
      const cardCenter = rect.left + rect.width / 2;
      const dist = (cardCenter - centerX) / centerX; // ~ -1..1 across viewport
      const clamped = gsap.utils.clamp(-1.4, 1.4, dist);
      gsap.set(card, {
        scale: 1 - Math.abs(clamped) * 0.22,
        y: Math.abs(clamped) * 28,
        rotateY: clamped * -18,
        opacity: 1 - Math.abs(clamped) * 0.35,
        zIndex: Math.round(100 - Math.abs(clamped) * 50),
      });
    });
  }

  if (reduced) {
    // No pin/scrub/drag/tilt — a plain wrapped row (see the CSS reduced-motion
    // fallback), so there's no motion and nothing to keep in sync via JS.
    return;
  }

  gsap.set(track, { width: trackWidth });

  const scrollDistance = Math.max(trackWidth - viewport.clientWidth, 400);

  const trigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${scrollDistance}`,
    pin: true,
    scrub: 1,
    onUpdate: (self) => {
      gsap.set(track, { x: -self.progress * scrollDistance });
      styleCards();
    },
  });

  // Drag-to-scrub: translate pointer drag into the same ScrollTrigger progress.
  if (!isTouchDevice()) {
    let dragging = false;
    let startX = 0;
    let startScroll = 0;

    viewport.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX;
      startScroll = window.scrollY;
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const delta = e.clientX - startX;
      window.scrollTo({ top: startScroll - delta });
    });
    const endDrag = () => (dragging = false);
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
  } else {
    // Touch: native horizontal swipe on the viewport drives the same scrub.
    viewport.style.touchAction = 'pan-y';
    let startX = 0;
    let startScroll = 0;
    viewport.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startScroll = window.scrollY;
    });
    viewport.addEventListener('touchmove', (e) => {
      const delta = e.touches[0].clientX - startX;
      window.scrollTo({ top: startScroll - delta });
    });
  }

  window.addEventListener('resize', () => trigger.refresh());
}

function mountCardShine(section: HTMLElement): void {
  if (isTouchDevice() || prefersReducedMotion()) return;

  const cards = section.querySelectorAll<HTMLElement>('[data-card]');
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', `${mx}%`);
      card.style.setProperty('--my', `${my}%`);
    });
  });
}

function mountLightbox(section: HTMLElement, posters: { slug: string; caption: string }[]): void {
  const overlay = document.createElement('div');
  overlay.className = 'lineup-lightbox';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <button type="button" class="lineup-lightbox__close" data-cursor="link" aria-label="Close">CLOSE ✕</button>
    <figure class="lineup-lightbox__figure">
      <img data-lightbox-img alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7" />
      <figcaption data-lightbox-caption></figcaption>
    </figure>
  `;
  document.body.appendChild(overlay);

  const img = overlay.querySelector<HTMLImageElement>('[data-lightbox-img]')!;
  const caption = overlay.querySelector<HTMLElement>('[data-lightbox-caption]')!;
  const closeBtn = overlay.querySelector<HTMLButtonElement>('.lineup-lightbox__close')!;
  const reduced = prefersReducedMotion();

  let open = false;
  let sourceImg: HTMLImageElement | null = null;
  let triggerEl: HTMLElement | null = null;

  function openLightbox(card: HTMLElement, index: number): void {
    sourceImg = card.querySelector('img');
    if (!sourceImg) return;

    triggerEl = card;
    open = true;
    document.body.classList.add('menu-open'); // reuse the same scroll-lock
    overlay.setAttribute('aria-hidden', 'false');
    const poster = posters[index];
    caption.textContent = poster?.caption ?? '';
    // A full-res source, not the card's small currentSrc — that would blow
    // up a ~640px srcset candidate to near-fullscreen and look soft.
    if (poster) {
      img.sizes = '(min-width: 768px) 720px, 90vw';
      img.srcset = srcset(poster.slug, 'jpg');
      img.src = assetUrl(`/img/lineup/${poster.slug}-1920.jpg`);
    } else {
      img.removeAttribute('srcset');
      img.src = sourceImg.currentSrc || sourceImg.src;
    }

    if (reduced) {
      gsap.set(overlay, { display: 'flex', opacity: 1 });
      closeBtn.focus();
      return;
    }

    const state = Flip.getState(sourceImg);
    gsap.set(overlay, { display: 'flex' });
    img.style.visibility = 'hidden';
    requestAnimationFrame(() => {
      img.style.visibility = 'visible';
      Flip.from(state, { targets: img, duration: 0.6, ease: 'power2.inOut', absolute: true, scale: true });
      gsap.fromTo(overlay, { backgroundColor: 'rgba(7,4,4,0)' }, { backgroundColor: 'rgba(7,4,4,0.95)', duration: 0.4 });
    });
    closeBtn.focus();
  }

  function closeLightbox(): void {
    open = false;
    document.body.classList.remove('menu-open');
    overlay.setAttribute('aria-hidden', 'true');
    triggerEl?.focus();
    if (reduced || !sourceImg) {
      gsap.set(overlay, { display: 'none' });
      return;
    }
    const target = sourceImg;
    gsap.set(overlay, { opacity: 0, onComplete: () => gsap.set(overlay, { display: 'none', opacity: 1 }) });
    Flip.fit(img, target, { duration: 0.3, ease: 'power2.in', scale: true });
  }

  section.querySelectorAll<HTMLElement>('[data-card]').forEach((card, i) => {
    card.addEventListener('click', () => openLightbox(card, i));
  });
  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) closeLightbox();
  });
}
