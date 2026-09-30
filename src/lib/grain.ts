const FPS = 10;
const TILE = 128;

export function mountGrain(): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.id = 'grain';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const tile = document.createElement('canvas');
  tile.width = TILE;
  tile.height = TILE;
  const tileCtx = tile.getContext('2d')!;

  function paintTile(): void {
    const imageData = tileCtx.createImageData(TILE, TILE);
    const buf = imageData.data;
    for (let i = 0; i < buf.length; i += 4) {
      const v = Math.random() * 255;
      buf[i] = v;
      buf[i + 1] = v;
      buf[i + 2] = v;
      buf[i + 3] = 255;
    }
    tileCtx.putImageData(imageData, 0, 0);
  }

  function resize(): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function draw(): void {
    paintTile();
    const pattern = ctx!.createPattern(tile, 'repeat');
    if (!pattern) return;
    ctx!.fillStyle = pattern;
    ctx!.fillRect(0, 0, canvas.width, canvas.height);
  }

  resize();
  window.addEventListener('resize', resize);

  if (reduceMotion) {
    draw();
    return;
  }

  let last = 0;
  const frameMs = 1000 / FPS;
  function loop(t: number): void {
    if (t - last >= frameMs) {
      last = t;
      draw();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
