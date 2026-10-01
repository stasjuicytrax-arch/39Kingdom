import { Renderer, Program, Mesh, Geometry, Triangle, Transform } from 'ogl';
import { tokenColorRGB } from './color-tokens';

const SPARK_COUNT = 90;

const BG_VERT = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Domain-warped value noise standing in for real refraction: cheaper than
// sampling/distorting the hero photo+video pair, and reads the same —
// a warm shimmer that thickens near the cursor, like air disturbed by heat.
const BG_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform vec3 uColorEmber;
  uniform vec3 uColorFire;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += noise(p) * amp;
      p *= 2.02;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;

    float distToMouse = distance(vec2(uv.x * aspect, uv.y), vec2(uMouse.x * aspect, uMouse.y));
    float mouseBoost = smoothstep(0.4, 0.0, distToMouse);

    vec2 warp = uv * vec2(3.2, 2.1);
    warp.y -= uTime * 0.12;
    warp.x += fbm(warp * 1.4 + uTime * 0.05) * (0.35 + mouseBoost * 0.6);

    float shimmer = fbm(warp + vec2(0.0, uTime * 0.18));
    shimmer = smoothstep(0.35, 0.95, shimmer);

    float vertical = smoothstep(1.0, 0.0, uv.y) * 0.8 + 0.08;
    float intensity = shimmer * vertical * (0.2 + mouseBoost * 0.45);

    vec3 color = mix(uColorEmber, uColorFire, shimmer);
    gl_FragColor = vec4(color, intensity);
  }
`;

const SPARK_VERT = `
  attribute float aSeed;
  attribute float aOffset;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uPixelRatio;
  varying float vLife;

  void main() {
    float speed = 0.1 + fract(aSeed * 13.17) * 0.22;
    float life = fract(uTime * speed + aSeed);
    float x = aOffset + sin((life + aSeed) * 6.2831) * 0.06;
    float y = mix(-1.08, 1.05, life);

    vec2 pos = vec2(x, y);
    vec2 toMouse = pos - uMouse;
    float d = length(toMouse);
    float influence = smoothstep(0.5, 0.0, d);
    pos.x += toMouse.x * influence * 0.5;
    pos.y += influence * 0.12;

    vLife = life;
    gl_Position = vec4(pos, 0.0, 1.0);
    float size = mix(1.4, 3.6, fract(aSeed * 7.13)) * (1.0 - life * 0.25);
    gl_PointSize = size * uPixelRatio;
  }
`;

const SPARK_FRAG = `
  precision highp float;
  varying float vLife;
  uniform vec3 uColorEmber;
  uniform vec3 uColorFlare;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float alpha = smoothstep(0.5, 0.0, d);
    float fade = smoothstep(0.0, 0.1, vLife) * smoothstep(1.0, 0.75, vLife);
    vec3 color = mix(uColorEmber, uColorFlare, vLife);
    gl_FragColor = vec4(color, alpha * fade * 0.85);
  }
`;


/** Mounts the hero's cursor-reactive heat-shimmer + rising sparks onto
 * `canvas`. Returns a teardown function, or nothing if WebGL init fails
 * (caller should fall back to the CSS variant in that case too). */
export function mountHeatHaze(canvas: HTMLCanvasElement, container: HTMLElement): (() => void) | void {
  let renderer: Renderer;
  try {
    renderer = new Renderer({
      canvas,
      alpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
  } catch {
    return;
  }
  const gl = renderer.gl;
  if (!gl) return;
  gl.clearColor(0, 0, 0, 0);

  const colorEmber = tokenColorRGB('--c-ember');
  const colorFire = tokenColorRGB('--c-fire');
  const colorFlare = tokenColorRGB('--c-flare');

  const scene = new Transform();

  const bgGeometry = new Triangle(gl);
  const bgProgram = new Program(gl, {
    vertex: BG_VERT,
    fragment: BG_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: [0.5, 0.2] },
      uResolution: { value: [1, 1] },
      uColorEmber: { value: colorEmber },
      uColorFire: { value: colorFire },
    },
  });
  const bgMesh = new Mesh(gl, { geometry: bgGeometry, program: bgProgram });
  bgMesh.setParent(scene);

  const seeds = new Float32Array(SPARK_COUNT);
  const offsets = new Float32Array(SPARK_COUNT);
  for (let i = 0; i < SPARK_COUNT; i++) {
    seeds[i] = Math.random();
    offsets[i] = Math.random() * 2 - 1;
  }
  const sparkGeometry = new Geometry(gl, {
    aSeed: { size: 1, data: seeds },
    aOffset: { size: 1, data: offsets },
  });
  const sparkProgram = new Program(gl, {
    vertex: SPARK_VERT,
    fragment: SPARK_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: [0, -0.6] },
      uPixelRatio: { value: renderer.dpr },
      uColorEmber: { value: colorEmber },
      uColorFlare: { value: colorFlare },
    },
  });
  sparkProgram.setBlendFunc(gl.SRC_ALPHA, gl.ONE); // additive glow
  const sparkMesh = new Mesh(gl, { geometry: sparkGeometry, program: sparkProgram, mode: gl.POINTS });
  sparkMesh.setParent(scene);

  const mouse = { x: 0.5, y: 0.2, targetX: 0.5, targetY: 0.2 };
  function onPointerMove(e: PointerEvent): void {
    const rect = container.getBoundingClientRect();
    mouse.targetX = (e.clientX - rect.left) / rect.width;
    mouse.targetY = 1 - (e.clientY - rect.top) / rect.height;
  }
  container.addEventListener('pointermove', onPointerMove);

  function resize(): void {
    const rect = container.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    bgProgram.uniforms.uResolution.value = [rect.width, rect.height];
  }
  resize();
  window.addEventListener('resize', resize);

  let rafId = 0;
  let running = false;
  const startTime = performance.now();

  function loop(now: number): void {
    if (!running) return;
    const t = (now - startTime) / 1000;
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;
    bgProgram.uniforms.uTime.value = t;
    bgProgram.uniforms.uMouse.value = [mouse.x, mouse.y];
    sparkProgram.uniforms.uTime.value = t;
    sparkProgram.uniforms.uMouse.value = [mouse.x * 2 - 1, mouse.y * 2 - 1];
    renderer.render({ scene });
    rafId = requestAnimationFrame(loop);
  }

  function play(): void {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  }
  function pause(): void {
    running = false;
    cancelAnimationFrame(rafId);
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !document.hidden) play();
      else pause();
    },
    { threshold: 0.05 }
  );
  io.observe(container);

  function onVisibilityChange(): void {
    if (document.hidden) pause();
    else if (container.getBoundingClientRect().bottom > 0) play();
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    pause();
    io.disconnect();
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    container.removeEventListener('pointermove', onPointerMove);
  };
}
