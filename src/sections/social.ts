import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import content from '../content.json';
import { overlineHtml } from '../components/overline';
import { prefersReducedMotion } from '../lib/reduced-motion';
import { assetUrl } from '../lib/asset-url';

gsap.registerPlugin(ScrollTrigger);

const COLUMN_COUNT = 4;
const COLUMN_PARALLAX = [-10, 14, -8, 12]; // yPercent range per column, alternating direction

export function mountSocial(root: HTMLElement): void {
  const social = content.social;
  const columns = distributeIntoColumns(social.gallery, COLUMN_COUNT);

  const section = document.createElement('section');
  section.id = 'social';
  section.className = 'social';
  section.setAttribute('aria-label', 'Social');

  section.innerHTML = `
    <div class="container social__head">
      ${overlineHtml(9)}
      <h2 class="social__handle">${social.handle}</h2>
      <div class="social__meta">
        <span class="social__followers">${social.followers} FOLLOWERS</span>
        <nav class="social__links" aria-label="Social media">
          <a href="${social.links.instagram}" target="_blank" rel="noopener" data-cursor="link">INSTAGRAM</a>
          <a href="${social.links.facebook}" target="_blank" rel="noopener" data-cursor="link">FACEBOOK</a>
          <a href="${social.links.youtube}" target="_blank" rel="noopener" data-cursor="link">YOUTUBE</a>
        </nav>
      </div>
      <p class="social__lead">${social.lead}</p>
    </div>

    <div class="social__masonry" data-masonry>
      ${columns.map((col, i) => columnHtml(col, i)).join('')}
    </div>
  `;

  root.appendChild(section);

  mountParallax(section);
  mountImageReveal(section);
}

interface GalleryItem {
  slug: string;
  credit?: string;
}

function distributeIntoColumns(items: GalleryItem[], count: number): GalleryItem[][] {
  const columns: GalleryItem[][] = Array.from({ length: count }, () => []);
  items.forEach((item, i) => columns[i % count].push(item));
  return columns;
}

function columnHtml(items: GalleryItem[], index: number): string {
  return `
    <div class="social__column" data-column data-index="${index}">
      ${items.map((item) => figureHtml(item)).join('')}
    </div>
  `;
}

function figureHtml(item: GalleryItem): string {
  return `
    <figure class="social__figure" data-reveal-figure>
      <picture>
        <source type="image/avif" srcset="${assetUrl(`/img/gallery/${item.slug}-640.avif`)}" />
        <source type="image/webp" srcset="${assetUrl(`/img/gallery/${item.slug}-640.webp`)}" />
        <img src="${assetUrl(`/img/gallery/${item.slug}-640.jpg`)}" alt="${altFromSlug(item.slug)}" loading="lazy" decoding="async" />
      </picture>
      ${item.credit ? `<figcaption class="social__credit">${item.credit}</figcaption>` : ''}
    </figure>
  `;
}

/** Gallery slugs were authored descriptively (e.g. "festival-21-red-pyramid-stage")
 * specifically so real alt text could be derived from them instead of repeating
 * one generic string across all 16 images. */
function altFromSlug(slug: string): string {
  const withoutPrefix = slug.replace(/^(festival|club|credit)-[\w]+-?/, '');
  if (!withoutPrefix || /^\d+$/.test(withoutPrefix)) {
    return '39 KINGDOM live show, crowd shot';
  }
  const words = withoutPrefix.replace(/-/g, ' ');
  return `39 KINGDOM — ${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

function mountParallax(section: HTMLElement): void {
  if (prefersReducedMotion()) return;

  const columns = section.querySelectorAll<HTMLElement>('[data-column]');
  columns.forEach((col, i) => {
    gsap.to(col, {
      yPercent: COLUMN_PARALLAX[i % COLUMN_PARALLAX.length],
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

function mountImageReveal(section: HTMLElement): void {
  const figures = section.querySelectorAll<HTMLElement>('[data-reveal-figure]');
  if (prefersReducedMotion()) return;

  gsap.set(figures, { clipPath: 'inset(15% 0 15% 0)', opacity: 0 });
  ScrollTrigger.batch(figures, {
    start: 'top 92%',
    onEnter: (batch) => gsap.to(batch, { clipPath: 'inset(0% 0 0% 0)', opacity: 1, duration: 0.7, stagger: 0.06, ease: 'power3.out' }),
    once: true,
  });
}
