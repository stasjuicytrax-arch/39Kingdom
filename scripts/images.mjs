// 39 KINGDOM — image pipeline (sharp)
// Converts a curated manifest of source photos into responsive AVIF/WebP(/JPG or PNG)
// output under site/public/img/<section>/<slug>-<width>.<ext>.
//
// Run: node scripts/images.mjs

import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(SITE_ROOT, '..');
const OUT_ROOT = path.join(SITE_ROOT, 'public', 'img');

const WIDTHS_STANDARD = [640, 1280, 1920, 2560];
const WIDTHS_PORTRAIT = [640, 1024, 1440, 1920];
const WIDTHS_LOGO = [480, 960];

const AVIF_QUALITY = 55;
const WEBP_QUALITY = 72;
const JPG_QUALITY = 82;
const HERO_AVIF_QUALITY = 48; // hero must land under 350KB at 1920 AVIF

/** @typedef {{src: string, section: string, slug: string, widths: number[], alpha?: boolean, avifQuality?: number}} ImageJob */

/** @type {ImageJob[]} */
const MANIFEST = [
  // ---- Hero ----
  { src: 'Hero.jpg', section: 'hero', slug: 'hero-main', widths: WIDTHS_STANDARD, avifQuality: HERO_AVIF_QUALITY },

  // ---- About ----
  { src: 'PRESS PICS/PRESS PICS/IMG_6039.JPG', section: 'about', slug: 'about-portrait', widths: WIDTHS_PORTRAIT },

  // ---- Music ----
  { src: 'PDF ASSETS/pdf-photos/music-duo-red.jpg', section: 'music', slug: 'music-duo-portrait', widths: WIDTHS_PORTRAIT },
  { src: 'PDF ASSETS/labels/armada.png', section: 'music', slug: 'label-armada', widths: WIDTHS_LOGO, alpha: true },
  { src: 'PDF ASSETS/labels/revealed.png', section: 'music', slug: 'label-revealed', widths: WIDTHS_LOGO, alpha: true },
  { src: 'PDF ASSETS/labels/universal.png', section: 'music', slug: 'label-universal', widths: WIDTHS_LOGO, alpha: true },
  { src: 'PDF ASSETS/labels/warner.png', section: 'music', slug: 'label-warner', widths: WIDTHS_LOGO, alpha: true },

  // ---- Global Recognition ----
  { src: 'PDF ASSETS/pdf-photos/recognition-bw-1.jpg', section: 'recognition', slug: 'recognition-bw-1', widths: WIDTHS_STANDARD },
  { src: 'PDF ASSETS/pdf-photos/recognition-bw-2.jpg', section: 'recognition', slug: 'recognition-bw-2', widths: WIDTHS_STANDARD },
  { src: 'PDF ASSETS/pdf-photos/recognition-bw-3.jpg', section: 'recognition', slug: 'recognition-bw-3', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/with Martin Garrix in Dubai.JPG', section: 'recognition', slug: 'with-martin-garrix-dubai', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/with Martin Garrix, Oliver Heldens in Kuala Lumpur.JPG', section: 'recognition', slug: 'with-martin-garrix-oliver-heldens-kuala-lumpur', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/with Oliver Heldens, DJ Snake, Tiesto in Saudi Arabia.jpg', section: 'recognition', slug: 'with-oliver-heldens-dj-snake-tiesto-saudi-arabia', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/with Axwell & Ingrosso in India.jpg', section: 'recognition', slug: 'with-axwell-ingrosso-india', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/With Claptone in Jeddah.jpg', section: 'recognition', slug: 'with-claptone-jeddah', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/with R3hab, Marnik, Vion Konger in Hanoi.jpeg', section: 'recognition', slug: 'with-r3hab-marnik-vion-konger-hanoi', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/with Morten, Seven in Dubai.jpeg', section: 'recognition', slug: 'with-morten-seven-dubai', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/with Vinai in Dubai.jpg', section: 'recognition', slug: 'with-vinai-dubai', widths: WIDTHS_STANDARD },

  // ---- Line-up posters (9) ----
  { src: 'PDF ASSETS/posters/poster-01-atlantis-martin-garrix.jpg', section: 'lineup', slug: 'poster-01-atlantis-martin-garrix', widths: WIDTHS_PORTRAIT },
  { src: 'PDF ASSETS/posters/poster-02-neon-countdown-bangkok.jpg', section: 'lineup', slug: 'poster-02-neon-countdown-bangkok', widths: WIDTHS_PORTRAIT },
  { src: 'PDF ASSETS/posters/poster-03-barasti-alan-walker-dubai.jpg', section: 'lineup', slug: 'poster-03-barasti-alan-walker-dubai', widths: WIDTHS_PORTRAIT },
  { src: 'PDF ASSETS/posters/poster-04-sunburn-mumbai-guetta.jpg', section: 'lineup', slug: 'poster-04-sunburn-mumbai-guetta', widths: WIDTHS_PORTRAIT },
  { src: 'PDF ASSETS/posters/poster-05-sunburn-goa.jpg', section: 'lineup', slug: 'poster-05-sunburn-goa', widths: WIDTHS_PORTRAIT },
  { src: 'PDF ASSETS/posters/poster-06-tahlia-jeddah.jpg', section: 'lineup', slug: 'poster-06-tahlia-jeddah', widths: WIDTHS_PORTRAIT },
  { src: 'PDF ASSETS/posters/poster-07-freaks-of-nature-riyadh.jpg', section: 'lineup', slug: 'poster-07-freaks-of-nature-riyadh', widths: WIDTHS_PORTRAIT },
  { src: 'PDF ASSETS/posters/poster-08-soundstorm-riyadh.jpg', section: 'lineup', slug: 'poster-08-soundstorm-riyadh', widths: WIDTHS_PORTRAIT },
  { src: 'PDF ASSETS/posters/poster-09-echoes-of-the-sand-terra-solis.jpg', section: 'lineup', slug: 'poster-09-echoes-of-the-sand-terra-solis', widths: WIDTHS_PORTRAIT },

  // ---- Gallery / Social — 16 curated shots (Festival + Club + mandatory-credit) ----
  { src: 'SHOW PICS/SHOW PICS/Festival show 003.jpg', section: 'gallery', slug: 'festival-03-silhouette-hands-up', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/Festival show 006.jpg.jpg', section: 'gallery', slug: 'festival-06-guitarist-daylight', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/Festival show 007.jpg', section: 'gallery', slug: 'festival-07-vocalist-daylight', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/Festival show 014.jpg', section: 'gallery', slug: 'festival-14-neon-countdown', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/Festival show 021.jpg', section: 'gallery', slug: 'festival-21-red-pyramid-stage', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/Festival show 022.jpg', section: 'gallery', slug: 'festival-22-gold-dome-stage', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/Festival show 025.jpg', section: 'gallery', slug: 'festival-25-duo-embrace-backlit', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/Festival show 031.jpg', section: 'gallery', slug: 'festival-31-red-stage-crowd', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/Club show 001.jpg', section: 'gallery', slug: 'club-01-flame-jets-crowd', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/Club show 010.jpg', section: 'gallery', slug: 'club-10-duo-silhouette-branded', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/Club show 014.JPG', section: 'gallery', slug: 'club-14-guitarist-silhouette-branded', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/Club show 017.JPG', section: 'gallery', slug: 'club-17-flame-red-crowd-wide', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/Club show 026.jpg', section: 'gallery', slug: 'club-26-vocalist-portrait', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/Club show 027.jpg', section: 'gallery', slug: 'club-27-guitarist-solo', widths: WIDTHS_STANDARD },
  // Mandatory credit: PHOTO: @MAPUROHIT
  { src: 'SHOW PICS/SHOW PICS/Credits IG- @mapurohit-09395.jpg', section: 'gallery', slug: 'credit-mapurohit-09395', widths: WIDTHS_STANDARD },
  { src: 'SHOW PICS/SHOW PICS/Credits IG- @mapurohit-09531.jpg', section: 'gallery', slug: 'credit-mapurohit-09531', widths: WIDTHS_STANDARD },

  // ---- OG / social share source ----
  { src: 'PDF ASSETS/pdf-photos/cover-duo-red.jpg', section: 'og', slug: 'og-source', widths: [1200] },
];

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function processJob(job) {
  const srcPath = path.join(PROJECT_ROOT, job.src);
  const outDir = path.join(OUT_ROOT, job.section);
  await ensureDir(outDir);

  const image = sharp(srcPath, { failOn: 'none' });
  const meta = await image.metadata();
  const maxWidth = meta.width ?? Math.max(...job.widths);

  const results = [];
  for (const width of job.widths) {
    if (width > maxWidth && job.widths.indexOf(width) > 0) continue; // skip upscale beyond source, keep at least one size
    const targetWidth = Math.min(width, maxWidth);
    const base = `${job.slug}-${width}`;

    const pipeline = () => sharp(srcPath, { failOn: 'none' }).resize({ width: targetWidth, withoutEnlargement: true });

    const avifPath = path.join(outDir, `${base}.avif`);
    await pipeline().avif({ quality: job.avifQuality ?? AVIF_QUALITY }).toFile(avifPath);

    const webpPath = path.join(outDir, `${base}.webp`);
    await pipeline().webp({ quality: WEBP_QUALITY }).toFile(webpPath);

    if (job.alpha) {
      const pngPath = path.join(outDir, `${base}.png`);
      await pipeline().png({ compressionLevel: 9 }).toFile(pngPath);
      results.push(avifPath, webpPath, pngPath);
    } else {
      const jpgPath = path.join(outDir, `${base}.jpg`);
      await pipeline().flatten({ background: '#070404' }).jpeg({ quality: JPG_QUALITY, mozjpeg: true }).toFile(jpgPath);
      results.push(avifPath, webpPath, jpgPath);
    }
  }
  return results;
}

async function main() {
  console.log(`Processing ${MANIFEST.length} image jobs...\n`);
  const allFiles = [];
  for (const job of MANIFEST) {
    try {
      const files = await processJob(job);
      allFiles.push(...files);
      console.log(`✓ ${job.section}/${job.slug} (${files.length} files)`);
    } catch (err) {
      console.error(`✗ ${job.section}/${job.slug} — ${err.message}`);
    }
  }

  let totalBytes = 0;
  for (const f of allFiles) {
    const s = await stat(f);
    totalBytes += s.size;
  }
  console.log(`\nDone. ${allFiles.length} files written, ${(totalBytes / 1024 / 1024).toFixed(2)} MB total.`);

  const heroAvif = path.join(OUT_ROOT, 'hero', 'hero-main-1920.avif');
  try {
    const heroStat = await stat(heroAvif);
    const kb = heroStat.size / 1024;
    console.log(`Hero 1920 AVIF: ${kb.toFixed(0)} KB ${kb <= 350 ? '(within 350KB budget)' : '(!! OVER 350KB budget)'}`);
  } catch {
    // hero file missing — reported above as a failed job
  }
}

main();
