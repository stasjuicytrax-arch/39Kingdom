import type { SectionEntry } from '../lib/sections-registry';

/** Empty anchor sections for 02–10 so the menu and header section-number tracking
 * have real targets to scroll to. Each is replaced by its real build in step 4. */
export function mountPlaceholderSection(root: HTMLElement, section: SectionEntry): void {
  const el = document.createElement('section');
  el.id = section.id;
  el.className = 'section-placeholder';
  el.setAttribute('aria-label', section.title);
  el.innerHTML = `
    <div class="container">
      <p class="section-placeholder__overline"><span class="section-placeholder__asterisk" aria-hidden="true">✱</span> (${String(section.index).padStart(2, '0')})</p>
      <h2 class="section-placeholder__title">${section.title}</h2>
    </div>
  `;
  root.appendChild(el);
}
