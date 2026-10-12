import './styles/print.css';
import QRCode from 'qrcode';
import content from './content.json';
import { assetUrl } from './lib/asset-url';

const SITE_URL = 'https://stasjuicytrax-arch.github.io/39Kingdom/';
const SIZES = [1920, 1280, 1024, 640];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const md = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

/** <img> trying the largest allowed size first, falling back on 404. */
function img(dir: string, slug: string, cls = 'ph', alt = '', startAt = 1280): string {
  const srcs = SIZES.filter((s) => s <= startAt).map((s) => assetUrl(`/img/${dir}/${slug}-${s}.jpg`));
  return `<img class="${cls}" alt="${esc(alt)}" src="${srcs[0]}" data-fb="${srcs.slice(1).join('|')}" />`;
}

async function qr(url: string): Promise<string> {
  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#070404', light: '#EFEDEB' },
  });
  return `<a class="qr" href="${url}">${svg}</a>`;
}

const head = (n: number, label: string, title: string) => `
  <div class="slide-head"><span class="meta"><b>✱</b> (${String(n).padStart(2, '0')}) ${esc(label)}</span><span class="meta">39 KINGDOM — PRESS KIT 2026</span></div>
  <h2 class="display h2">${esc(title)}</h2>`;
const foot = () =>
  `<div class="slide-foot"><span class="meta">${esc(content.footer.tagline)}</span><span class="meta">${esc(content.footer.copyright)}</span></div>`;
const mixed = (parts: { text: string; mute: boolean }[]) =>
  parts.map((h) => (h.mute ? `<span class="mute">${esc(h.text)}</span>` : esc(h.text))).join('');

async function build(): Promise<string> {
  const c = content;
  const s: string[] = [];

  // 1 Cover
  s.push(`<section class="slide cover">
    ${img('hero', 'hero-main', 'bg', '39 KINGDOM', 1920)}<div class="scrim"></div>
    <div class="top"><span class="meta"><b>✱</b> ${esc(c.hero.kicker)}</span><span class="meta">${esc(c.hero.kickerRight)}</span></div>
    <div class="inner">
      <div class="word">${esc(c.hero.wordmark)}</div>
      <div class="row">
        <div><p class="sub">${esc(c.hero.subtitle)}</p><p class="meta" style="margin-top:14px">${esc(c.hero.showType)} · ${esc(c.hero.genre)}</p></div>
        <div class="stats">${c.hero.stats.map((x) => `<div class="stat"><strong>${esc(x.value)}</strong><span class="meta">${esc(x.label)}</span></div>`).join('')}</div>
      </div>
    </div></section>`);

  // 2 About
  s.push(`<section class="slide">${head(2, 'WELCOME TO OUR KINGDOM', c.about.title)}
    <div class="about-grid" style="margin-top:36px">
      ${img('about', c.about.portrait.slug, 'ph', '39 KINGDOM duo portrait', 1280)}
      <div><h3 class="display">${mixed(c.about.headline)}</h3>
        ${c.about.paragraphs.map((p) => `<p>${md(p)}</p>`).join('')}
        <div class="tags">${c.about.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>
    </div>${foot()}</section>`);

  // 3 Highlights
  s.push(`<section class="slide void">
    <div class="slide-head"><span class="meta"><b>✱</b> (03) ${esc(c.highlights.title)}</span><span class="meta">39 KINGDOM — PRESS KIT 2026</span></div>
    <div class="counters">${c.highlights.counters.map((x) => `<div class="counter"><strong>${x.value}${esc(x.suffix)}</strong><span class="meta">${esc(x.label)}</span></div>`).join('')}</div>
    <div class="countries">${c.highlights.venuesByCountry.map((g) => `<div class="country"><h4>${esc(g.country)}</h4><ul>${g.venues.map((v) => `<li>${esc(v.name)} <span>— ${esc(v.city)}</span></li>`).join('')}</ul></div>`).join('')}</div>
    ${foot()}</section>`);

  // 4 Line-up
  s.push(`<section class="slide">${head(4, c.lineup.subtitle, c.lineup.title)}
    <div class="posters" style="margin-top:56px">${c.lineup.posters
      .map((p) => `<div class="poster">${img('lineup', p.slug, '', p.caption, 1024)}<span class="meta">${esc(p.tag)}</span><p>${esc(p.caption)}</p></div>`)
      .join('')}</div>${foot()}</section>`);

  // 5 Tour
  s.push(`<section class="slide void">${head(5, c.tour.season, c.tour.title)}
    <div class="tour" style="margin-top:48px">${c.tour.dates
      .map((d) => `<div class="tour-row ${d.festival ? 'fest' : ''}"><span class="d">${esc(d.display)}</span><span class="c">${esc(d.city)}</span><span class="v">${esc(d.country)}</span><span class="v">${esc(d.venue)}</span>${d.festival ? '<span class="meta fl">FESTIVAL</span>' : '<span></span>'}</div>`)
      .join('')}</div>
    <p class="meta" style="margin-bottom:40px"><b>✱</b> ${esc(c.tour.footnote)}</p>${foot()}</section>`);

  // 6 Live
  const setQrs = await Promise.all(c.live.sets.map((x) => qr(x.url)));
  const chQr = await qr(c.live.youtubeChannel);
  s.push(`<section class="slide">${head(6, c.live.footnote, c.live.title)}
    <div class="live-grid" style="margin-top:40px">
      <div class="vids">${c.live.localVideos.map((v) => `<figure><img class="ph" alt="${esc(v.caption)}" src="${assetUrl(v.poster)}" /><p class="meta">${esc(v.caption)}</p></figure>`).join('')}</div>
      <div class="sets">${c.live.sets.map((x, i) => `<div class="row"><a href="${x.url}"><h4>${esc(x.title)}</h4><p class="meta">${esc(x.duration)} · YOUTUBE</p></a>${setQrs[i]}</div>`).join('')}
        <div class="row"><a href="${c.live.youtubeChannel}"><h4>YOUTUBE CHANNEL</h4><p class="meta">@39KINGDOM</p></a>${chQr}</div></div>
    </div>${foot()}</section>`);

  // 7 Music
  s.push(`<section class="slide void">
    <div class="slide-head"><span class="meta"><b>✱</b> (07) MUSIC</span><span class="meta">39 KINGDOM — PRESS KIT 2026</span></div>
    <div class="music-grid"><div>
      <h3 class="display headline">${mixed(c.music.headline)}</h3>
      <p class="lead">${esc(c.music.lead)}</p>
      <ul class="labels">${c.music.labels.map((l) => `<li>${esc(l.name)}</li>`).join('')}</ul>
      <div class="mstats">${c.music.highlights.map((h) => `<div><strong>${esc(h.stat)}</strong><span class="meta">${esc(h.label)} — ${esc(h.detail)}</span></div>`).join('')}</div>
    </div>
    ${img('music', c.music.portrait.slug, 'ph', '39 KINGDOM', 1024)}</div>
    ${foot()}</section>`);

  // 8 Recognition
  s.push(`<section class="slide">${head(8, 'SHARED STAGES', c.recognition.title)}
    <div class="rec-grid" style="margin-top:36px"><div><p class="lead">${esc(c.recognition.lead)}</p>
      <div class="names">${c.recognition.names.map((n) => `<span>${esc(n)}</span>`).join('')}</div></div>
      <div class="rec-photos">${c.recognition.photos.slice(0, 6).map((p) => `<figure>${img('recognition', p.slug, 'ph', p.caption, 1280)}<figcaption class="meta">${esc(p.caption)}</figcaption></figure>`).join('')}</div>
    </div>${foot()}</section>`);

  // 9 Gallery
  s.push(`<section class="slide void"><div class="slide-head"><span class="meta"><b>✱</b> (09) GALLERY</span><span class="meta">${esc(c.social.handle)} · ${esc(c.social.followers)} FOLLOWERS</span></div>
    <div class="gal">${c.social.gallery.slice(0, 8).map((p) => `<figure>${img('gallery', p.slug, '', p.slug, 1280)}</figure>`).join('')}</div>${foot()}</section>`);

  // 10 Contact
  const ct = c.contact;
  const siteQr = await qr(SITE_URL);
  const kitQr = await qr(ct.downloads.mediaKit.href);
  s.push(`<section class="slide contact"><div class="slide-head"><span class="meta"><b>✱</b> (10) CONTACT</span><span class="meta">${esc(ct.agency)}</span></div>
    <div><div class="big">${esc(ct.heading)}</div><p class="display" style="font-size:44px;margin-top:20px">${esc(ct.subheading)}</p></div>
    <div class="cols">
      <div><p class="meta">BOOKING — ${esc(ct.agency)}</p><a class="mail" href="mailto:${ct.email}">${esc(ct.email)}</a>
        <div class="socials meta" style="margin-top:28px">
          <a href="${c.social.links.instagram}">INSTAGRAM — ${esc(c.social.handle)}</a><a href="${c.social.links.facebook}">FACEBOOK — ${esc(c.social.handle)}</a><a href="${c.social.links.youtube}">YOUTUBE — @39KINGDOM</a></div></div>
      <div class="qrs">
        <div>${siteQr}<p class="meta">WEBSITE</p></div>
        <div>${kitQr}<p class="meta">MEDIA KIT</p></div>
      </div>
    </div></section>`);

  return s.join('\n');
}

const deck = document.getElementById('deck')!;
deck.innerHTML = await build();

// size fallback on 404, then flag readiness for the PDF script
const imgs = [...deck.querySelectorAll<HTMLImageElement>('img')];
imgs.forEach((im) => {
  im.addEventListener('error', () => {
    const next = (im.dataset.fb ?? '').split('|').filter(Boolean);
    if (!next.length) return;
    im.src = next.shift()!;
    im.dataset.fb = next.join('|');
  });
});
await Promise.all(
  imgs.map(
    (im) =>
      new Promise<void>((resolve) => {
        const t = setInterval(() => {
          if (im.complete && im.naturalWidth) { clearInterval(t); resolve(); }
        }, 50);
        setTimeout(() => { clearInterval(t); resolve(); }, 8000);
      }),
  ),
);
await document.fonts.ready;
document.documentElement.dataset.ready = '1';
