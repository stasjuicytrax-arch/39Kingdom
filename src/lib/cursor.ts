import { isTouchDevice, prefersReducedMotion } from './reduced-motion';

type CursorState = 'default' | 'link' | 'play' | 'drag' | 'view';

const STATES: CursorState[] = ['default', 'link', 'play', 'drag', 'view'];

const STATE_LABELS: Record<CursorState, string> = {
  default: '',
  link: '',
  play: 'PLAY',
  drag: 'DRAG ↔',
  view: 'VIEW',
};

export function mountCursor(): void {
  if (isTouchDevice()) return;

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  const inner = document.createElement('div');
  inner.className = 'cursor-ring__inner';
  const label = document.createElement('span');
  label.className = 'cursor-ring__label';
  inner.appendChild(label);
  ring.appendChild(inner);

  document.body.appendChild(dot);
  document.body.appendChild(ring);
  document.documentElement.classList.add('has-custom-cursor');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  const reduced = prefersReducedMotion();

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    if (reduced) {
      ringX = mouseX;
      ringY = mouseY;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    }
  });

  window.addEventListener('mousedown', () => ring.classList.add('cursor-ring--pressed'));
  window.addEventListener('mouseup', () => ring.classList.remove('cursor-ring--pressed'));

  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  });

  if (!reduced) {
    const LERP = 0.18;
    function raf() {
      ringX += (mouseX - ringX) * LERP;
      ringY += (mouseY - ringY) * LERP;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  let currentTarget: Element | null = null;

  document.addEventListener('mouseover', (e) => {
    const target = (e.target as Element)?.closest?.('[data-cursor]');
    if (!target || target === currentTarget) return;
    currentTarget = target;
    const state = (target.getAttribute('data-cursor') as CursorState) || 'default';
    applyState(ring, label, state);
  });

  document.addEventListener('mouseout', (e) => {
    const related = (e.relatedTarget as Element | null)?.closest?.('[data-cursor]');
    const target = (e.target as Element)?.closest?.('[data-cursor]');
    if (target && target !== related) {
      currentTarget = null;
      applyState(ring, label, 'default');
    }
  });
}

function applyState(ring: HTMLElement, label: HTMLElement, state: CursorState) {
  for (const s of STATES) ring.classList.toggle(`cursor-ring--${s}`, s === state && s !== 'default');
  label.textContent = STATE_LABELS[state];
}
