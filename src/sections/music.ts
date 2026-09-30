import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import content from '../content.json';
import { overlineHtml } from '../components/overline';
import { prefersReducedMotion } from '../lib/reduced-motion';
import { assetUrl } from '../lib/asset-url';

gsap.registerPlugin(ScrollTrigger);

const STREAMING_PLATFORMS = ['spotify', 'appleMusic', 'beatport', 'soundcloud'] as const;
const STREAMING_LABELS: Record<(typeof STREAMING_PLATFORMS)[number], string> = {
  spotify: 'SPOTIFY',
  appleMusic: 'APPLE MUSIC',
  beatport: 'BEATPORT',
  soundcloud: 'SOUNDCLOUD',
};

export function mountMusic(root: HTMLElement): void {
  const music = content.music;

  const section = document.createElement('section');
  section.id = 'music';
  section.className = 'music theme-bone';
  section.setAttribute('aria-label', 'Music');

  section.innerHTML = `
    <div class="container music__head">
      ${overlineHtml(7, 'ON RECORD')}
      <p class="music__headline">${headingHtml(music.headline, music.portrait)}</p>
      <p class="music__lead">${music.lead}</p>
    </div>

    <div class="music__marquee" aria-hidden="true">
      <div class="music__marquee-track">${labelsMarquee(music.labels)}</div>
    </div>

    <div class="container music__streaming">
      <p class="music__streaming-label">LISTEN ON</p>
      <div class="music__streaming-row">
        ${STREAMING_PLATFORMS.map((p) => streamingButtonHtml(p, music.streaming[p])).join('')}
      </div>
    </div>

    <div class="container music__facts">
      ${music.highlights.map((h, i) => factCardHtml(h, i)).join('')}
    </div>
  `;

  root.appendChild(section);

  mountCircularReveal(section);
  mountCounter(section);
}

function headingHtml(
  tokens: { text: string; mute: boolean }[],
  portrait: { section: string; slug: string }
): string {
  const rendered = tokens.map((t) => (t.mute ? `<span class="music__mute">${t.text.trim()}</span>` : t.text));
  // Pill drops between "R3HAB" and "AND", matching the brief's own layout
  // ("... R3HAB [pill] AND ANDREW RAYEL").
  rendered.splice(5, 0, pillHtml(portrait));
  return rendered.join('');
}

function pillHtml(portrait: { section: string; slug: string }): string {
  return `<span class="music__pill">
    <picture>
      <source type="image/avif" srcset="${assetUrl(`/img/${portrait.section}/${portrait.slug}-640.avif`)}" />
      <img src="${assetUrl(`/img/${portrait.section}/${portrait.slug}-640.jpg`)}" alt="" loading="lazy" decoding="async" />
    </picture>
  </span>`;
}

function labelsMarquee(labels: { name: string; logoSlug: string | null }[]): string {
  const items = labels
    .map((l) =>
      l.logoSlug
        ? `<span class="music__label music__label--logo"><img src="${assetUrl(`/img/music/${l.logoSlug}-480.png`)}" alt="${l.name}" loading="lazy" decoding="async" /></span>`
        : `<span class="music__label">${l.name}</span>`
    )
    .join('');
  return items + items; // duplicated for seamless -50% loop
}

function streamingButtonHtml(platform: string, href: string): string {
  const label = STREAMING_LABELS[platform as (typeof STREAMING_PLATFORMS)[number]];
  const pending = !href;
  return `<a class="btn-outline music__streaming-btn" href="${href || '#'}" ${pending ? 'data-todo="link"' : ''} data-cursor="link" target="${pending ? '' : '_blank'}" rel="${pending ? '' : 'noopener'}">${label}</a>`;
}

function factCardHtml(h: { stat: string; label: string; detail: string }, i: number): string {
  return `
    <div class="music__fact" data-fact>
      <span class="music__fact-vinyl" aria-hidden="true"></span>
      <span class="music__fact-stat" ${i === 0 ? 'data-count-stat="1.5" data-count-suffix="M+"' : ''}>${h.stat}</span>
      <span class="music__fact-label">${h.label}</span>
      <span class="music__fact-detail">${h.detail}</span>
    </div>
  `;
}

function mountCircularReveal(section: HTMLElement): void {
  if (prefersReducedMotion()) return;

  gsap.set(section, { clipPath: 'circle(0% at 50% 0%)' });
  ScrollTrigger.create({
    trigger: section,
    start: 'top 85%',
    once: true,
    onEnter: () => gsap.to(section, { clipPath: 'circle(150% at 50% 0%)', duration: 1.2, ease: 'power2.out' }),
  });
}

function mountCounter(section: HTMLElement): void {
  const stat = section.querySelector<HTMLElement>('[data-count-stat]');
  if (!stat) return;

  const target = Number(stat.dataset.countStat ?? 0);
  const suffix = stat.dataset.countSuffix ?? '';

  if (prefersReducedMotion()) return;

  const obj = { val: 0 };
  ScrollTrigger.create({
    trigger: stat,
    start: 'top 90%',
    once: true,
    onEnter: () =>
      gsap.to(obj, {
        val: target,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate: () => {
          stat.textContent = `${obj.val.toFixed(1)}${suffix}`;
        },
      }),
  });
}
