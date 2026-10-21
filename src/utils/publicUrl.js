const configuredBaseUrl = import.meta.env.VITE_PUBLIC_APP_URL || 'https://marketmix-realestates.vercel.app';

export const PUBLIC_APP_URL = configuredBaseUrl.replace(/\/+$/, '');

export function getPublicAppUrl(path = '/') {
  const relativePath = String(path || '/');
  return new URL(relativePath.startsWith('/') ? relativePath : `/${relativePath}`, `${PUBLIC_APP_URL}/`).toString();
}

export function canonicalizeSharedUrl(rawUrl) {
  if (!rawUrl) return '';
  try {
    const url = new URL(rawUrl, `${PUBLIC_APP_URL}/`);
    const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    const isLocalHost = host === 'localhost' || host.endsWith('.localhost') || host === '::1' || /^127(?:\.\d{1,3}){3}$/.test(host);
    if (isLocalHost) {
      return getPublicAppUrl(`${url.pathname}${url.search}${url.hash}`);
    }
    return url.toString();
  } catch {
    return getPublicAppUrl('/');
  }
}
