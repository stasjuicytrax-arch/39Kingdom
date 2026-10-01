import './styles/global.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { mountPreloader } from './lib/preloader';
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
import { mountMusic } from './sections/music';
import { mountRecognition } from './sections/recognition';
import { mountSocial } from './sections/social';
import { mountContact } from './sections/contact';
import { mountFooter } from './sections/footer';
import { mountPlaceholderSection } from './sections/placeholder-section';
import { initMagneticButtons } from './components/buttons';

const BUILT_SECTIONS = new Set([
  'hero',
  'about',
  'highlights',
  'lineup',
  'tour',
  'live',
  'music',
  'recognition',
  'social',
  'contact',
]);

const app = document.querySelector<HTMLDivElement>('#app')!;

// First thing on the page — everything else mounts underneath it and is
// simply occluded until it tears open (see lib/preloader.ts).
mountPreloader();

// Global chrome — header/menu/cursor/grain/scroll-progress sit outside #app
// (fixed overlays). Header mounts first so its logo exists as the hero
// wordmark's Flip-docking target.
const header = mountHeader();
mountMenu();
mountCursor();
mountScrollProgress();
mountGrain();

// All ten sections, in page order, then the footer. The placeholder loop
// below is now a no-op (every SECTIONS entry is built) — left in place so a
// future new section falls back to an anchor automatically instead of
// silently breaking menu navigation.
mountHero(app);
mountAbout(app);
mountHighlights(app);
mountLineup(app);
mountTour(app);
mountLive(app);
mountMusic(app);
mountRecognition(app);
mountSocial(app);
mountContact(app);
for (const section of SECTIONS) {
  if (BUILT_SECTIONS.has(section.id)) continue;
  mountPlaceholderSection(app, section);
}
mountFooter(app);

observeSections(header);
initSmoothScroll();
initMagneticButtons();

window.addEventListener('load', () => ScrollTrigger.refresh());
