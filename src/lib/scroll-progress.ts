import { ScrollTrigger } from 'gsap/ScrollTrigger';

const TICK_COUNT = 40;

export function mountScrollProgress(): void {
  const rail = document.createElement('div');
  rail.className = 'scroll-rail';
  rail.setAttribute('aria-hidden', 'true');
  rail.innerHTML = '<div class="scroll-rail__fill"></div>';
  document.body.appendChild(rail);

  const ruler = document.createElement('div');
  ruler.className = 'scroll-ruler';
  ruler.setAttribute('aria-hidden', 'true');
  ruler.innerHTML = Array.from({ length: TICK_COUNT }, () => '<span class="scroll-ruler__tick"></span>').join('');
  document.body.appendChild(ruler);

  const fill = rail.querySelector<HTMLElement>('.scroll-rail__fill')!;
  const ticks = Array.from(ruler.querySelectorAll<HTMLElement>('.scroll-ruler__tick'));

  ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const progress = self.progress;
      fill.style.transform = `scaleY(${progress})`;
      const activeCount = Math.round(progress * TICK_COUNT);
      ticks.forEach((tick, i) => tick.classList.toggle('scroll-ruler__tick--active', i < activeCount));
    },
  });
}
