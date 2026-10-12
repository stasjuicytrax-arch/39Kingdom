// One-off generator: dotted land mask for the Highlights map -> src/lib/world-dots.json
// Equirectangular grid, step STEP deg, bbox covers Europe/ME/Asia (where the shows are).
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';

const topo = JSON.parse(readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'));
const land = feature(topo, topo.objects.land);
const polys = [];
for (const f of land.features ?? [land]) {
  const g = f.geometry;
  (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).forEach((p) => polys.push(p));
}
const inRing = (x, y, ring) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const inLand = (x, y) => polys.some((p) => inRing(x, y, p[0]) && !p.slice(1).some((h) => inRing(x, y, h)));

const [LON0, LON1, LAT0, LAT1, STEP] = [20, 130, -12, 62, 2];
const dots = [];
for (let lat = LAT1; lat >= LAT0; lat -= STEP)
  for (let lon = LON0; lon <= LON1; lon += STEP) if (inLand(lon, lat)) dots.push([lon, lat]);
writeFileSync('src/lib/world-dots.json', JSON.stringify({ lon0: LON0, lon1: LON1, lat0: LAT0, lat1: LAT1, step: STEP, dots }));
console.log(dots.length, 'dots');
