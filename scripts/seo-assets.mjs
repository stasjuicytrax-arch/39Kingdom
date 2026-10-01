// One-off generator for Stage F (TZ §9): OG share image + favicon, built
// from already-compressed project assets (not re-touched after running —
// re-run by hand if the source portrait/symbol/logo changes).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const VOID = '#070404';

mkdirSync('public', { recursive: true });

// ---------- OG image: 1200x630, duo portrait on red + logo ----------
async function buildOgImage() {
  const WIDTH = 1200;
  const HEIGHT = 630;

  const portrait = await sharp('public/img/about/about-portrait-1920.jpg')
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'top' })
    .toBuffer();

  // Bottom-up dark scrim so the white logo stays legible over the photo,
  // same device as the site's own --g-scrim (hero, card overlays).
  const scrim = Buffer.from(
    `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="55%" stop-color="${VOID}" stop-opacity="0" />
          <stop offset="100%" stop-color="${VOID}" stop-opacity="0.92" />
        </linearGradient>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)" />
    </svg>`
  );

  const logoWidth = 360;
  const logo = await sharp('../BIO/LOGO - BIO/39 Kingdom_white logo.png')
    .resize(logoWidth, null)
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();

  const margin = 56;

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: VOID },
  })
    .composite([
      { input: portrait, left: 0, top: 0 },
      { input: scrim, left: 0, top: 0 },
      { input: logo, left: margin, top: HEIGHT - margin - (logoMeta.height ?? 84) },
    ])
    .jpeg({ quality: 88 })
    .toFile('public/og-image.jpg');

  console.log('og-image.jpg written');
}

// ---------- Favicon + apple-touch-icon, from the symbol mark ----------
async function buildFavicons() {
  const symbol = sharp('public/img/brand/symbol-source.png');

  async function iconAt(size, outfile, pad = 0.26) {
    const glyphSize = Math.round(size * (1 - pad));
    const glyph = await symbol.clone().resize(glyphSize, glyphSize).toBuffer();
    const offset = Math.round((size - glyphSize) / 2);
    await sharp({ create: { width: size, height: size, channels: 4, background: VOID } })
      .composite([{ input: glyph, left: offset, top: offset }])
      .png()
      .toFile(outfile);
  }

  await iconAt(32, 'public/favicon.png');
  await iconAt(180, 'public/apple-touch-icon.png');
  console.log('favicon.png + apple-touch-icon.png written');
}

await buildOgImage();
await buildFavicons();
