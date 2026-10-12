import map from './world-dots.json';

/** Show cities (content.json: tour + venues) as [name, lon, lat].
 * TODO(client): add new cities here when tour dates change. */
const CITIES: [string, number, number][] = [
  ['Braslav', 27.0, 55.6],
  ['Istanbul', 29.0, 41.0],
  ['Jeddah', 39.2, 21.5],
  ['Riyadh', 46.7, 24.7],
  ['Dubai', 55.3, 25.2],
  ['Mumbai', 72.9, 19.1],
  ['Goa', 74.0, 15.5],
  ['Hyderabad', 78.5, 17.4],
  ['Kathmandu', 85.3, 27.7],
  ['Bangkok', 100.5, 13.8],
  ['Pattaya', 100.9, 12.9],
  ['Kuala Lumpur', 101.7, 3.1],
  ['Hanoi', 105.8, 21.0],
  ['Ho Chi Minh City', 106.7, 10.8],
  ['Chongqing', 106.5, 29.6],
  ['Jakarta', 106.8, -6.2],
  ['Guangzhou', 113.3, 23.1],
  ['Shenzhen', 114.1, 22.5],
  ['Xiamen', 118.1, 24.5],
  ['Bali', 115.2, -8.7],
  ['Manila', 121.0, 14.6],
  ['Ningbo', 121.5, 29.9],
];

const PX = 6; // svg units per degree-step cell

/** Dotted map of the touring region. Land dots are static; city dots are
 * lit one by one (CSS transition delay) once `.is-lit` lands on the root. */
export function worldMapHtml(): string {
  const { lon0, lat1, step, lon1, lat0, dots } = map as {
    lon0: number; lon1: number; lat0: number; lat1: number; step: number; dots: number[][];
  };
  const sx = (lon: number) => ((lon - lon0) / step) * PX;
  const sy = (lat: number) => ((lat1 - lat) / step) * PX;
  const w = sx(lon1) + PX;
  const h = sy(lat0) + PX;

  const land = dots.map(([lon, lat]) => `M${sx(lon).toFixed(1)} ${sy(lat).toFixed(1)}h.01`).join('');
  const cities = CITIES.map(
    ([name, lon, lat], i) =>
      `<g class="wmap__city" style="--i:${i}" transform="translate(${sx(lon).toFixed(1)} ${sy(lat).toFixed(1)})"><title>${name}</title><circle class="wmap__ping" r="3" /><circle class="wmap__dot" r="2.4" /></g>`
  ).join('');

  return `
    <svg class="wmap" viewBox="0 0 ${w} ${h}" role="img" aria-label="Map of cities where 39 KINGDOM has performed" data-wmap>
      <path class="wmap__land" d="${land}" />
      ${cities}
    </svg>`;
}
