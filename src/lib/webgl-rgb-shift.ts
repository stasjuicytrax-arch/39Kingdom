import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';

const VERT = `
  attribute vec2 position;
  attribute vec2 uv;
  uniform vec2 uCoverScale;
  varying vec2 vUv;
  void main() {
    vUv = (uv - 0.5) * uCoverScale + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D tMap;
  uniform float uAmount;
  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }
    float jitter = (hash(uv * 40.0 + uTime) - 0.5) * uAmount * 0.02;
    vec2 dir = normalize(vec2(1.0, 0.35));
    vec2 offset = dir * uAmount * 0.045;

    float r = texture2D(tMap, uv + offset + jitter).r;
    float g = texture2D(tMap, uv).g;
    float b = texture2D(tMap, uv - offset - jitter).b;

    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

/** Plays a one-shot RGB channel-split that converges into the sharp photo —
 * TZ's "RGB-дисторсия при появлении" for the Recognition triptych. Tears
 * its own WebGL context down on completion so the plain `<img>` underneath
 * (grayscale→color on hover is handled in CSS) takes back over; no
 * standing per-frame canvas is kept once the reveal settles. */
export function playRgbShiftReveal(canvas: HTMLCanvasElement, img: HTMLImageElement, duration = 900): void {
  const run = () => {
    let renderer: Renderer;
    try {
      renderer = new Renderer({ canvas, alpha: true, antialias: false, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    } catch {
      return;
    }
    const gl = renderer.gl;
    if (!gl) return;
    gl.clearColor(0, 0, 0, 0);

    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);

    const texture = new Texture(gl, { image: img, generateMipmaps: false });

    const containerAspect = rect.width / rect.height;
    const imageAspect = img.naturalWidth / img.naturalHeight || containerAspect;
    const coverScale: [number, number] =
      imageAspect > containerAspect ? [containerAspect / imageAspect, 1] : [1, imageAspect / containerAspect];

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      transparent: false,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tMap: { value: texture },
        uAmount: { value: 1 },
        uTime: { value: 0 },
        uCoverScale: { value: coverScale },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    const start = performance.now();
    canvas.classList.add('is-active');

    function frame(now: number): void {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      program.uniforms.uAmount.value = 1 - eased;
      program.uniforms.uTime.value = elapsed / 1000;
      renderer.render({ scene: mesh });

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        canvas.classList.remove('is-active');
      }
    }
    requestAnimationFrame(frame);
  };

  if (img.complete && img.naturalWidth > 0) run();
  else img.addEventListener('load', run, { once: true });
}
