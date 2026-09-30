import './styles/global.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { mountGrain } from './lib/grain';
import { initSmoothScroll } from './lib/smooth-scroll';
import { mountHeader, observeSections } from './lib/header';
import { mountMenu } from './lib/menu';
import { mountCursor } from './lib/cursor';
import { mountScrollProgress } from './lib/scroll-progress';
import { SECTIONS } from './lib/sections-registry';
import { mountHero } from './sections/hero';
import { mountPlaceholderSection } from './sections/placeholder-section';
import { initMagneticButtons } from './components/buttons';

const app = document.querySelector<HTMLDivElement>('#app')!;

// Global chrome — header/menu/cursor/grain/scroll-progress sit outside #app
// (fixed overlays). Header mounts first so its logo exists as the hero
// wordmark's Flip-docking target.
const header = mountHeader();
mountMenu();
mountCursor();
mountScrollProgress();
mountGrain();

// Hero first (real build), then empty anchors for 02–10 so menu links and
// the header's section counter have real targets — filled in in step 4.
mountHero(app);
for (const section of SECTIONS) {
  if (section.id === 'hero') continue;
  mountPlaceholderSection(app, section);
}

observeSections(header);
initSmoothScroll();
initMagneticButtons();

window.addEventListener('load', () => ScrollTrigger.refresh());
