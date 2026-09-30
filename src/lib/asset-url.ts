/** Prefixes a root-relative asset path ("/img/...", "/video/...",
 * "/downloads/...") with Vite's configured `base` ("/39Kingdom/" in
 * production). content.json intentionally stores plain root-relative paths
 * (portable, environment-agnostic data) — this is where the deploy-specific
 * prefix gets applied, at render time. External URLs (http/https, mailto,
 * data:) pass through unchanged. */
export function assetUrl(path: string): string {
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return path; // absolute URL / protocol-relative / mailto: etc.
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
