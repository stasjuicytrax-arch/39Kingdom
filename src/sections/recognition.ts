import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import content from '../content.json';
import { overlineHtml } from '../components/overline';
import { isTouchDevice, prefersReducedMotion } from '../lib/reduced-motion';
import { assetUrl } from '../lib/asset-url';

gsap.registerPlugin(ScrollTrigger);

const ROW_SPEEDS = [42, 58, 36]; // seconds per loop, varied per row
const ROW_DIRECTIONS: Array<'normal' | 'reverse'> = ['normal', 'reverse', 'normal'];

export function mountRecognition(root: HTMLElement): void {
  const rec = content.recognition;

  // Photos keyed by the artist name(s) that appear in their caption, so a
  // hovered name can show its matching photo where one exists.
  const photoByName = new Map<string, { slug: string; caption: string }>();
  for (const photo of rec.photos) {
    for (const name of rec.names) {
      if (photo.caption.toUpperCase().includes(name.toUpperCase())) {
        photoByName.set(name, photo);
      }
    }
  }

  const rows = splitIntoRows(rec.names, 3);

  const section = document.createElement('section');
  section.id = 'recognition';
  section.className = 'recognition';
  section.setAttribute('aria-label', rec.title);

  section.innerHTML = `
    <div class="container recognition__head">
      ${overlineHtml(8)}
      <h2 class="recognition__title">${rec.title}</h2>
      <p class="recognition__lead">${rec.lead}</p>
      <p class="visually-hidden">Artists 39 KINGDOM have shared the stage with: ${rec.names.join(', ')}.</p>
    </div>

    <div class="recognition__names" data-names aria-hidden="true">
      ${rows
        .map(
          (row, i) => `
        <div class="recognition__row" style="--row-duration: ${ROW_SPEEDS[i % ROW_SPEEDS.length]}s; --row-direction: ${ROW_DIRECTIONS[i % ROW_DIRECTIONS.length]};">
          <div class="recognition__row-track">
            ${namesTrack(row, photoByName)}
          </div>
        </div>`
        )
        .join('')}
    </div>

    <div class="container recognition__triptych">
      ${rec.triptych
        .map(
          (slug) => `
        <figure class="recognition__frame">
          <picture>
            <source type="image/avif" srcset="${assetUrl(`/img/recognition/${slug}-1280.avif`)}" />
            <source type="image/webp" srcset="${assetUrl(`/img/recognition/${slug}-1280.webp`)}" />
            <img src="${assetUrl(`/img/recognition/${slug}-1280.jpg`)}" alt="39 KINGDOM with international artists" loading="lazy" decoding="async" />
          </picture>
        </figure>`
        )
        .join('')}
    </div>

    <div class="recognition__preview" data-preview aria-hidden="true">
      <img data-preview-img alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7" />
      <figcaption data-preview-caption></figcaption>
    </div>
  `;

  root.appendChild(section);

  mountNameHover(section);
}

function splitIntoRows<T>(items: T[], rowCount: number): T[][] {
  const rows: T[][] = Array.from({ length: rowCount }, () => []);
  items.forEach((item, i) => rows[i % rowCount].push(item));
  return rows;
}

function namesTrack(names: string[], photoByName: Map<string, { slug: string; caption: string }>): string {
  const withDots = names
    .map((name) => {
      const photo = photoByName.get(name);
      return `<button type="button" tabindex="-1" class="recognition__name" data-name="${name}" data-photo="${photo ? `/img/recognition/${photo.slug}-640.jpg` : ''}" data-caption="${photo?.caption ?? ''}">${name}</button>`;
    })
    .join('<span class="recognition__dot">·</span>');
  return withDots + '<span class="recognition__dot">·</span>' + withDots; // duplicated for seamless loop
}

function mountNameHover(section: HTMLElement): void {
  const names = section.querySelector<HTMLElement>('[data-names]');
  const preview = section.querySelector<HTMLElement>('[data-preview]');
  const previewImg = section.querySelector<HTMLImageElement>('[data-preview-img]');
  const previewCaption = section.querySelector<HTMLElement>('[data-preview-caption]');
  if (!names || !preview || !previewImg || !previewCaption) return;

  const touch = isTouchDevice();
  const reduced = prefersReducedMotion();

  if (!touch && !reduced) {
    const xTo = gsap.quickTo(preview, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(preview, 'y', { duration: 0.35, ease: 'power3.out' });

    names.addEventListener('mousemove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });
  }

  names.querySelectorAll<HTMLButtonElement>('.recognition__name').forEach((btn) => {
    const row = btn.closest<HTMLElement>('.recognition__row');

    btn.addEventListener('mouseenter', () => {
      row?.classList.add('is-paused');
      btn.classList.add('is-active');
      const src = btn.dataset.photo;
      if (src && !touch && !reduced) {
        previewImg.src = assetUrl(src);
        previewImg.classList.remove('is-color');
        previewCaption.textContent = btn.dataset.caption ?? '';
        gsap.to(preview, { autoAlpha: 1, duration: 0.25 });
        // B&W settles into color a beat after the preview appears, per TZ.
        window.setTimeout(() => previewImg.classList.add('is-color'), 120);
      }
    });
    btn.addEventListener('mouseleave', () => {
      row?.classList.remove('is-paused');
      btn.classList.remove('is-active');
      gsap.to(preview, { autoAlpha: 0, duration: 0.25 });
    });
  });
}
