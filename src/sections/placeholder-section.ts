import type { SectionEntry } from '../lib/sections-registry';
import { overlineHtml } from '../components/overline';

/** Empty anchor sections for the parts of the page not yet built, so the menu
 * and header section-number tracking have real targets to scroll to. */
export function mountPlaceholderSection(root: HTMLElement, section: SectionEntry): void {
  const el = document.createElement('section');
  el.id = section.id;
  el.className = 'section-placeholder';
  el.setAttribute('aria-label', section.title);
  el.innerHTML = `
    <div class="container">
      ${overlineHtml(section.index)}
      <h2 class="section-placeholder__title">${section.title}</h2>
    </div>
  `;
  root.appendChild(el);
}
