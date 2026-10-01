import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import content from '../content.json';
import { overlineHtml } from '../components/overline';
import { pillTagHtml } from '../components/buttons';
import { autoplayInViewport } from '../lib/viewport-video';
import { lazyPoster } from '../lib/lazy-poster';
import { tokenColor } from '../lib/color-tokens';
import { prefersReducedMotion } from '../lib/reduced-motion';
import { assetUrl } from '../lib/asset-url';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function mountAbout(root: HTMLElement): void {
  const about = content.about;

  const section = document.createElement('section');
  section.id = 'about';
  section.className = 'about';
  section.setAttribute('aria-label', about.title);

  section.innerHTML = `
    <div class="container">
      ${overlineHtml(2, 'WELCOME TO OUR KINGDOM')}
      <h2 class="about__title">${about.title}</h2>
      <p class="about__headline">${headingHtml(about.headline, about.pillVideo)}</p>
    </div>
    <div class="container about__body">
      <figure class="about__portrait">
        <div class="about__portrait-frame">
          <picture>
            <source type="image/avif" srcset="${srcset('about', 'about-portrait', 'avif')}" sizes="(min-width: 768px) 40vw, 90vw" />
            <source type="image/webp" srcset="${srcset('about', 'about-portrait', 'webp')}" sizes="(min-width: 768px) 40vw, 90vw" />
            <img
              src="${assetUrl('/img/about/about-portrait-1024.jpg')}"
              srcset="${srcset('about', 'about-portrait', 'jpg')}"
              sizes="(min-width: 768px) 40vw, 90vw"
              alt="39 KINGDOM duo portrait on a red backdrop"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>
      </figure>
      <div class="about__copy">
        ${about.paragraphs.map((p) => `<p class="about__paragraph" data-burn>${p}</p>`).join('')}
        <div class="about__tags">
          ${about.tags.map((t) => pillTagHtml(t)).join('')}
        </div>
      </div>
    </div>
  `;

  root.appendChild(section);

  mountPillVideo(section);
  mountPillReveal(section);
  mountBurnIn(section);
  mountPortraitReveal(section);
}

function srcset(sectionName: string, slug: string, ext: string): string {
  const widths = [640, 1024, 1440, 1920];
  return widths.map((w) => `${assetUrl(`/img/${sectionName}/${slug}-${w}.${ext}`)} ${w}w`).join(', ');
}

type HeadlineToken = { text: string; mute: boolean };

/**
 * The heading is presented as a 3-line "ladder" with the photo-pill dropped
 * between the last two words — a purely typographic decision (content.json
 * keeps the plain sentence; this is where line breaks + the pill placement
 * are decided, per the design system's stepped-heading device).
 */
function headingHtml(tokens: HeadlineToken[], pillVideo: { poster: string; mp4: string; webm: string }): string {
  const token = (t: HeadlineToken) => (t.mute ? `<span class="about__mute">${t.text.trim()}</span>` : t.text);
  const line1 = `${token(tokens[0])} ${token(tokens[1])}`;
  const line2 = `${token(tokens[2])} ${token(tokens[3])}`;
  const lastWords = tokens[4].text.trim().split(' ');
  const line3 = `${lastWords[0]} ${pillHtml(pillVideo)} ${lastWords.slice(1).join(' ')}`;

  return `
    <span class="about__line about__line--1">${line1}</span>
    <span class="about__line about__line--2">${line2}</span>
    <span class="about__line about__line--3">${line3}</span>
  `;
}

function pillHtml(pillVideo: { poster: string; mp4: string; webm: string }): string {
  return `<span class="about__pill" data-pill data-pill-poster="${pillVideo.poster}">
    <video class="about__pill-video" muted loop playsinline preload="none" aria-hidden="true">
      <source src="${assetUrl(pillVideo.webm)}" type="video/webm" />
      <source src="${assetUrl(pillVideo.mp4)}" type="video/mp4" />
    </video>
  </span>`;
}

function mountPillVideo(section: HTMLElement): void {
  const video = section.querySelector<HTMLVideoElement>('.about__pill-video');
  const pill = section.querySelector<HTMLElement>('[data-pill]');
  if (!video) return;
  if (pill?.dataset.pillPoster) lazyPoster(video, assetUrl(pill.dataset.pillPoster));
  video.load();
  autoplayInViewport(video);
}

function mountPillReveal(section: HTMLElement): void {
  const pill = section.querySelector<HTMLElement>('[data-pill]');
  const heading = section.querySelector<HTMLElement>('.about__headline');
  if (!pill || !heading) return;

  if (prefersReducedMotion()) return;

  const naturalWidth = pill.getBoundingClientRect().width;
  gsap.set(pill, { width: 0 });

  ScrollTrigger.create({
    trigger: heading,
    start: 'top 75%',
    once: true,
    onEnter: () => gsap.to(pill, { width: naturalWidth, duration: 0.8, ease: 'power3.out' }),
  });
}

function mountBurnIn(section: HTMLElement): void {
  const paragraphs = section.querySelectorAll<HTMLElement>('[data-burn]');
  const ash = tokenColor('--c-ash');
  const bone = tokenColor('--c-bone');
  const ember = tokenColor('--c-ember');
  const reduced = prefersReducedMotion();

  paragraphs.forEach((p) => {
    // **word** -> <mark class="ember">word</mark>, authored in content.json
    p.innerHTML = p.innerHTML.replace(/\*\*(.+?)\*\*/g, '<mark class="about__ember">$1</mark>');

    // aria: 'none' — see the matching note in lib/preloader.ts: avoids GSAP
    // putting an aria-label on this <p>, which has no role to carry it.
    const split = new SplitText(p, { type: 'words', aria: 'none' });

    if (reduced) {
      gsap.set(split.words, {
        color: (_i, target) => (target.closest('.about__ember') ? ember : bone),
      });
      return;
    }

    gsap.set(split.words, { color: ash, opacity: 0.2 });
    gsap.to(split.words, {
      opacity: 1,
      color: (_i, target) => (target.closest('.about__ember') ? ember : bone),
      stagger: 0.02,
      ease: 'none',
      scrollTrigger: { trigger: p, start: 'top 85%', end: 'bottom 60%', scrub: true },
    });
  });
}

function mountPortraitReveal(section: HTMLElement): void {
  const figure = section.querySelector<HTMLElement>('.about__portrait-frame');
  const img = section.querySelector<HTMLImageElement>('.about__portrait img');
  if (!figure || !img) return;

  if (prefersReducedMotion()) return;

  gsap.set(img, { clipPath: 'inset(100% 0 0 0)' });
  ScrollTrigger.create({
    trigger: figure,
    start: 'top 80%',
    once: true,
    onEnter: () => gsap.to(img, { clipPath: 'inset(0% 0 0 0)', duration: 1.1, ease: 'power3.out' }),
  });

  gsap.to(img, {
    yPercent: -15,
    ease: 'none',
    scrollTrigger: { trigger: figure, start: 'top bottom', end: 'bottom top', scrub: true },
  });
}
