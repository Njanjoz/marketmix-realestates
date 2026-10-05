import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SEO_PAGES } from '../data/seoPages';

const SITE_ORIGIN = 'https://marketmix-realestates.vercel.app';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/images/property-hero.svg`;

const propertyDetailsPage = {
  match: (path) => path.startsWith('/property/'),
  title: 'Kenya Property Listing Details | MarketMix',
  description: 'View property photos, features, availability, and area details on MarketMix Real Estates.',
};

function ensureMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function ensureCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = href;
}

export function PageSEO({ title, description, image = DEFAULT_IMAGE, path, type = 'website', noIndex = false }) {
  useEffect(() => {
    const canonicalPath = (path || window.location.pathname).replace(/\/+$/, '') || '/';
    const canonical = `${SITE_ORIGIN}${canonicalPath === '/' ? '/' : canonicalPath}`;
    const safeDescription = String(description || '').trim().slice(0, 300);
    const absoluteImage = image?.startsWith('http') ? image : `${SITE_ORIGIN}${image || '/images/property-hero.svg'}`;

    document.title = title || 'MarketMix Real Estates | Homes for Rent and Sale in Kenya';
    ensureMeta('name', 'description', safeDescription);
    ensureMeta('name', 'robots', noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
    ensureMeta('property', 'og:type', type);
    ensureMeta('property', 'og:site_name', 'MarketMix Real Estates');
    ensureMeta('property', 'og:title', document.title);
    ensureMeta('property', 'og:description', safeDescription);
    ensureMeta('property', 'og:url', canonical);
    ensureMeta('property', 'og:image', absoluteImage);
    ensureMeta('name', 'twitter:card', 'summary_large_image');
    ensureMeta('name', 'twitter:title', document.title);
    ensureMeta('name', 'twitter:description', safeDescription);
    ensureMeta('name', 'twitter:image', absoluteImage);
    ensureCanonical(canonical);
  }, [title, description, image, path, type, noIndex]);

  return null;
}

export default function RouteSEO() {
  const { pathname } = useLocation();
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const page = normalizedPath.startsWith('/property/')
    ? propertyDetailsPage
    : SEO_PAGES.find((item) => item.path === normalizedPath);
  const privateRoute = !page;

  return <PageSEO
    title={page?.title || 'MarketMix Real Estates'}
    description={page?.description || 'MarketMix Real Estates account and service page.'}
    path={normalizedPath}
    noIndex={privateRoute}
  />;
}
