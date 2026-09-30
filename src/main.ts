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
import { mountAbout } from './sections/about';
import { mountHighlights } from './sections/highlights';
import { mountLineup } from './sections/lineup';
import { mountTour } from './sections/tour';
import { mountLive } from './sections/live';
import { mountPlaceholderSection } from './sections/placeholder-section';
import { initMagneticButtons } from './components/buttons';

const BUILT_SECTIONS = new Set(['hero', 'about', 'highlights', 'lineup', 'tour', 'live']);

const app = document.querySelector<HTMLDivElement>('#app')!;

// Global chrome — header/menu/cursor/grain/scroll-progress sit outside #app
// (fixed overlays). Header mounts first so its logo exists as the hero
// wordmark's Flip-docking target.
const header = mountHeader();
mountMenu();
mountCursor();
mountScrollProgress();
mountGrain();

// Real sections first, then empty anchors for the rest so menu links and
// the header's section counter have real targets — filled in as each
// section is built.
mountHero(app);
mountAbout(app);
mountHighlights(app);
mountLineup(app);
mountTour(app);
mountLive(app);
for (const section of SECTIONS) {
  if (BUILT_SECTIONS.has(section.id)) continue;
  mountPlaceholderSection(app, section);
}

observeSections(header);
initSmoothScroll();
initMagneticButtons();

window.addEventListener('load', () => ScrollTrigger.refresh());
