import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import content from '../content.json';
import { overlineHtml } from '../components/overline';
import { pillTagHtml } from '../components/buttons';
import { getNextShow, isPlayed, formatShortDate, countdownTo, type TourDate } from '../lib/tour-helpers';
import { isTouchDevice, prefersReducedMotion } from '../lib/reduced-motion';
import { assetUrl } from '../lib/asset-url';

gsap.registerPlugin(ScrollTrigger);

// Known festival dates that have a matching poster in the Line-up section —
// not part of content.json's tour schema (which has no poster field), so
// the mapping lives here, local to the one place it's used.
const FESTIVAL_POSTERS: Record<string, string> = {
  'Sunburn Festival': 'poster-05-sunburn-goa',
  'Neon Countdown Festival': 'poster-02-neon-countdown-bangkok',
};

export function mountTour(root: HTMLElement): void {
  const tour = content.tour;
  const nextShow = getNextShow(tour.dates);

  const section = document.createElement('section');
  section.id = 'tour';
  section.className = 'tour';
  section.setAttribute('aria-label', tour.title);

  section.innerHTML = `
    <div class="tour__tear" aria-hidden="true"></div>
    <div class="container">
      ${overlineHtml(5)}
      <div class="tour__head">
        <h2 class="tour__title">${tour.title}</h2>
        <p class="tour__season">${tour.season}</p>
      </div>

      ${nextShow ? nextShowHtml(nextShow) : ''}

      <div class="tour__divider" data-divider aria-hidden="true"></div>

      <div class="tour__list" data-list>
        ${tour.dates.map((d, i) => rowHtml(d, i, nextShow)).join('')}
      </div>
      <p class="tour__footnote">${tour.footnote}</p>
    </div>

    <div class="tour__preview" data-preview aria-hidden="true">
      <img data-preview-img alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7" />
    </div>
  `;

  root.appendChild(section);

  if (nextShow) mountCountdown(section, nextShow.date);
  mountRowReveal(section);
  mountDivider(section);
  mountRowPreview(section);
}

function nextShowHtml(next: TourDate): string {
  return `
    <div class="tour__next">
      <p class="tour__next-label">NEXT SHOW</p>
      <p class="tour__next-line">${formatShortDate(next.date)} — ${next.city.toUpperCase()} — ${next.venue.toUpperCase()}</p>
      <div class="tour__countdown" data-countdown aria-label="Countdown to next show">
        <span data-dd>00</span><span class="tour__countdown-sep">:</span><span data-hh>00</span><span class="tour__countdown-sep">:</span><span data-mm>00</span><span class="tour__countdown-sep">:</span><span data-ss>00</span>
      </div>
    </div>
  `;
}

function rowHtml(d: TourDate, i: number, nextShow: TourDate | null): string {
  const played = isPlayed(d);
  const isNext = nextShow?.date === d.date;
  const poster = FESTIVAL_POSTERS[d.venue];
  const status = played ? 'PLAYED' : isNext ? 'NEXT' : '';

  return `
    <div class="tour__row${played ? ' tour__row--played' : ''}" data-row style="--row-index: ${i}" data-poster="${poster ? `/img/lineup/${poster}-640.jpg` : ''}">
      <span class="tour__row-date">${d.display}</span>
      <span class="tour__row-venue">${d.venue}${d.festival ? ` ${pillTagHtml('FESTIVAL')}` : ''}</span>
      <span class="tour__row-city">${d.city}, ${d.country}</span>
      <span class="tour__row-status">${status}</span>
    </div>
  `;
}

function mountCountdown(section: HTMLElement, isoDate: string): void {
  const dd = section.querySelector<HTMLElement>('[data-dd]');
  const hh = section.querySelector<HTMLElement>('[data-hh]');
  const mm = section.querySelector<HTMLElement>('[data-mm]');
  const ss = section.querySelector<HTMLElement>('[data-ss]');
  if (!dd || !hh || !mm || !ss) return;

  const pad = (n: number) => String(n).padStart(2, '0');

  function update() {
    const parts = countdownTo(isoDate);
    dd!.textContent = pad(parts.days);
    hh!.textContent = pad(parts.hours);
    mm!.textContent = pad(parts.minutes);
    ss!.textContent = pad(parts.seconds);
  }

  update();
  setInterval(update, 1000);
}

function mountRowReveal(section: HTMLElement): void {
  const rows = section.querySelectorAll<HTMLElement>('[data-row]');
  if (rows.length === 0) return;

  if (prefersReducedMotion()) return;

  gsap.set(rows, { opacity: 0, x: -24 });
  ScrollTrigger.batch(rows, {
    start: 'top 90%',
    onEnter: (batch) => gsap.to(batch, { opacity: 1, x: 0, duration: 0.6, stagger: 0.08, ease: 'expo.out' }),
    once: true,
  });
}

function mountDivider(section: HTMLElement): void {
  const divider = section.querySelector<HTMLElement>('[data-divider]');
  if (!divider) return;

  if (prefersReducedMotion()) {
    gsap.set(divider, { scaleX: 1 });
    return;
  }

  gsap.set(divider, { scaleX: 0, transformOrigin: 'left center' });
  ScrollTrigger.create({
    trigger: divider,
    start: 'top 90%',
    once: true,
    onEnter: () => gsap.to(divider, { scaleX: 1, duration: 0.8, ease: 'power3.out' }),
  });
}

function mountRowPreview(section: HTMLElement): void {
  if (isTouchDevice() || prefersReducedMotion()) return;

  const list = section.querySelector<HTMLElement>('[data-list]');
  const preview = section.querySelector<HTMLElement>('[data-preview]');
  const previewImg = section.querySelector<HTMLImageElement>('[data-preview-img]');
  if (!list || !preview || !previewImg) return;

  const xTo = gsap.quickTo(preview, 'x', { duration: 0.35, ease: 'power3.out' });
  const yTo = gsap.quickTo(preview, 'y', { duration: 0.35, ease: 'power3.out' });

  let activeRow: HTMLElement | null = null;

  list.addEventListener('mousemove', (e) => {
    const row = (e.target as Element)?.closest<HTMLElement>('.tour__row');
    xTo(e.clientX);
    yTo(e.clientY);

    if (row !== activeRow) {
      activeRow = row;
      const src = row?.dataset.poster;
      if (row && src) {
        previewImg.src = assetUrl(src);
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
