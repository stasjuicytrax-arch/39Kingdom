export function overlineHtml(index: number, text?: string): string {
  const suffix = text ? ` ${text}` : '';
  return `<p class="overline"><span class="overline__asterisk" aria-hidden="true">✱</span> (${String(index).padStart(2, '0')})${suffix}</p>`;
}
