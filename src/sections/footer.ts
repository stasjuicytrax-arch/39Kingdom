import content from '../content.json';

const STREAMING_PLATFORMS = ['spotify', 'appleMusic', 'beatport', 'soundcloud'] as const;
const STREAMING_LABELS: Record<(typeof STREAMING_PLATFORMS)[number], string> = {
  spotify: 'SPOTIFY',
  appleMusic: 'APPLE MUSIC',
  beatport: 'BEATPORT',
  soundcloud: 'SOUNDCLOUD',
};

export function mountFooter(root: HTMLElement): void {
  const footer = content.footer;
  const social = content.social;
  const streaming = content.music.streaming;
  const contact = content.contact;

  const el = document.createElement('footer');
  el.className = 'site-footer';
  el.innerHTML = `
    <div class="container site-footer__grid">
      <div class="site-footer__brand">
        <span class="site-footer__wordmark">${footer.wordmark}</span>
        <span class="site-footer__tagline">${footer.tagline}</span>
      </div>

      <nav class="site-footer__social" aria-label="Social media">
        <a href="${social.links.instagram}" target="_blank" rel="noopener" data-cursor="link">INSTAGRAM</a>
        <a href="${social.links.facebook}" target="_blank" rel="noopener" data-cursor="link">FACEBOOK</a>
        <a href="${social.links.youtube}" target="_blank" rel="noopener" data-cursor="link">YOUTUBE</a>
      </nav>

      <nav class="site-footer__streaming" aria-label="Listen">
        ${STREAMING_PLATFORMS.map((p) => {
          const href = streaming[p];
          const pending = !href;
          return `<a href="${href || '#'}" ${pending ? 'data-todo="link"' : 'target="_blank" rel="noopener"'} data-cursor="link">${STREAMING_LABELS[p]}</a>`;
        }).join('')}
      </nav>

      <div class="site-footer__contact">
        <span>${contact.agency}</span>
        <a href="mailto:${contact.email}" data-cursor="link">${contact.email}</a>
      </div>

      <p class="site-footer__copyright">${footer.copyright}</p>
    </div>
  `;

  root.appendChild(el);
}
