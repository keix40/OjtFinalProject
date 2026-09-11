import { environment } from '../../environments/environment';

/** Resolve a backend media path to a browser URL (relative in prod, optional absolute base in dev). */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = environment.serverUrl ?? '';
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
}
