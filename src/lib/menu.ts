import { gsap } from 'gsap';
import { SECTIONS } from './sections-registry';
import { prefersReducedMotion } from './reduced-motion';

const CUSTOM_EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';

export function mountMenu(): void {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'menu-toggle';
  toggle.setAttribute('data-cursor', 'link');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open menu');
  toggle.innerHTML = '<span data-menu-toggle-label>MENU</span>';
  document.body.appendChild(toggle);

  const overlay = document.createElement('nav');
  overlay.className = 'menu-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="menu-overlay__bg" data-menu-bg></div>
    <ul class="menu-overlay__list">
      ${SECTIONS.map(
        (s) => `
        <li class="menu-overlay__item">
          <a href="#${s.id}" class="menu-overlay__link" data-cursor="link" data-menu-bg-src="${s.menuBg}">
            <span class="menu-overlay__num">${String(s.index).padStart(2, '0')}</span>
            ${s.navLabel}
          </a>
        </li>`
      ).join('')}
    </ul>
  `;
  document.body.appendChild(overlay);

  const bg = overlay.querySelector<HTMLElement>('[data-menu-bg]')!;
  const links = Array.from(overlay.querySelectorAll<HTMLAnchorElement>('.menu-overlay__link'));
  const toggleLabel = toggle.querySelector<HTMLElement>('[data-menu-toggle-label]')!;

  let open = false;
  const reduced = prefersReducedMotion();

  function setOpen(next: boolean) {
    open = next;
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? 'CLOSE' : 'MENU';
    overlay.setAttribute('aria-hidden', String(!open));

    if (open) {
      document.body.classList.add('menu-open');
      gsap.set(overlay, { display: 'flex' });
      links[0]?.focus();
      if (reduced) {
        gsap.set(overlay, { opacity: 1 });
      } else {
        gsap.fromTo(
          overlay,
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: CUSTOM_EASE }
        );
        gsap.fromTo(
          links,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, delay: 0.15, ease: 'expo.out' }
        );
      }
    } else {
      document.body.classList.remove('menu-open');
      if (reduced) {
        gsap.set(overlay, { opacity: 0, display: 'none' });
      } else {
        gsap.to(overlay, {
          clipPath: 'inset(0 0 100% 0)',
          duration: 0.5,
          ease: CUSTOM_EASE,
          onComplete: () => gsap.set(overlay, { display: 'none' }),
        });
      }
      bg.style.backgroundImage = '';
      bg.style.opacity = '0';
      toggle.focus();
    }
  }

  toggle.addEventListener('click', () => setOpen(!open));

  for (const link of links) {
    link.addEventListener('mouseenter', () => {
      const src = link.getAttribute('data-menu-bg-src');
      if (src) {
        bg.style.backgroundImage = `url(${src})`;
        bg.style.opacity = '1';
      }
      for (const other of links) other.classList.toggle('menu-overlay__link--dim', other !== link);
    });
    link.addEventListener('mouseleave', () => {
      bg.style.opacity = '0';
      for (const other of links) other.classList.remove('menu-overlay__link--dim');
    });
    link.addEventListener('click', () => setOpen(false));
  }

  window.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'Tab') {
      const focusable = [toggle, ...links];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}
