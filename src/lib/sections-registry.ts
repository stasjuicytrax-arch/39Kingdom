export interface SectionEntry {
  id: string;
  index: number; // 1-based, matches colophon "0X/11" display (11 = 10 sections + preloader slot 00)
  navLabel: string;
  title: string;
  menuBg: string;
}

export const TOTAL_SECTION_SLOTS = 11; // 00 preloader + 01–10

export const SECTIONS: SectionEntry[] = [
  { id: 'hero', index: 1, navLabel: 'HERO', title: '39KINGDOM', menuBg: '/img/hero/hero-main-1280.jpg' },
  { id: 'about', index: 2, navLabel: 'ABOUT US', title: 'ABOUT US', menuBg: '/img/about/about-portrait-1024.jpg' },
  { id: 'highlights', index: 3, navLabel: 'HIGHLIGHTS', title: 'PERFORMANCE HIGHLIGHTS', menuBg: '/img/gallery/festival-21-red-pyramid-stage-1280.jpg' },
  { id: 'lineup', index: 4, navLabel: 'LINE-UP', title: 'ON THE LINE-UP', menuBg: '/img/lineup/poster-01-atlantis-martin-garrix-1024.jpg' },
  { id: 'tour', index: 5, navLabel: 'ON TOUR', title: 'ON TOUR', menuBg: '/img/gallery/club-17-flame-red-crowd-wide-1280.jpg' },
  { id: 'live', index: 6, navLabel: 'LIVE', title: 'LIVE SETS', menuBg: '/video/india-poster.jpg' },
  { id: 'music', index: 7, navLabel: 'MUSIC', title: 'MUSIC', menuBg: '/img/music/music-duo-portrait-1024.jpg' },
  { id: 'recognition', index: 8, navLabel: 'RECOGNITION', title: 'GLOBAL RECOGNITION', menuBg: '/img/recognition/with-martin-garrix-dubai-1280.jpg' },
  { id: 'social', index: 9, navLabel: 'SOCIAL', title: 'SOCIAL', menuBg: '/img/gallery/credit-mapurohit-09395-1280.jpg' },
  { id: 'contact', index: 10, navLabel: 'CONTACT', title: 'THANK YOU', menuBg: '/img/gallery/festival-25-duo-embrace-backlit-1280.jpg' },
];

export function sectionNumberLabel(index: number): string {
  return `${String(index).padStart(2, '0')}/${TOTAL_SECTION_SLOTS}`;
}
