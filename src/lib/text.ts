/** Long all-caps strings are hard to read (words lose their shape). Content keeps
 * its source casing; this turns a long caption into Title Case for display,
 * leaving short acronyms and anything with a digit untouched. */
const SMALL = new Set(['OF', 'THE', 'AND', 'WITH', 'AT', 'IN', 'ON']);
const KEEP = new Set(['DJ', 'DJS', 'UAE', 'NYC', 'IFC', 'IMF', 'XYLO', 'LOD', 'AME']);

export function titleCaps(text: string): string {
  if (text !== text.toUpperCase()) return text; // already mixed case: respect it
  return text
    .split(' ')
    .map((word, i) => {
      if (i > 0 && SMALL.has(word)) return word.toLowerCase();
      if (!/[A-ZÀ-ÖØ-Þ]/.test(word) || /\d/.test(word) || KEEP.has(word)) return word;
      return word.charAt(0) + word.slice(1).toLowerCase();
    })
    .join(' ');
}
