import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_PAGES } from '../src/data/seoPages.js';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputDirectory = join(scriptDirectory, '..', 'dist');
const siteOrigin = 'https://marketmix-realestates.vercel.app';
const fallbackImage = `${siteOrigin}/images/property-hero.svg`;
const baseHtml = await readFile(join(outputDirectory, 'index.html'), 'utf8');

const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

const setMeta = (html, selector, tag) => {
  const expression = new RegExp(`<meta\\s+${selector}[^>]*>`, 'i');
  return expression.test(html) ? html.replace(expression, tag) : html.replace('</head>', `  ${tag}\n  </head>`);
};

for (const page of SEO_PAGES) {
  const canonical = `${siteOrigin}${page.path === '/' ? '/' : page.path}`;
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  let html = baseHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = setMeta(html, 'name="description"', `<meta name="description" content="${description}" />`);
  html = setMeta(html, 'name="robots"', '<meta name="robots" content="index,follow,max-image-preview:large" />');
  html = setMeta(html, 'property="og:title"', `<meta property="og:title" content="${title}" />`);
  html = setMeta(html, 'property="og:description"', `<meta property="og:description" content="${description}" />`);
  html = setMeta(html, 'property="og:url"', `<meta property="og:url" content="${canonical}" />`);
  html = setMeta(html, 'property="og:image"', `<meta property="og:image" content="${fallbackImage}" />`);
  html = setMeta(html, 'name="twitter:title"', `<meta name="twitter:title" content="${title}" />`);
  html = setMeta(html, 'name="twitter:description"', `<meta name="twitter:description" content="${description}" />`);
  html = setMeta(html, 'name="twitter:image"', `<meta name="twitter:image" content="${fallbackImage}" />`);
  html = html.replace('</head>', `  <link rel="canonical" href="${canonical}" />\n  </head>`);

  const content = `<main id="seo-prerender" lang="en-KE"><header><a href="/" aria-label="MarketMix home">MarketMix Real Estates</a></header><article><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.intro)}</p><nav aria-label="Main pages"><a href="/properties">Browse properties</a> <a href="/roommates">Find a roommate</a> <a href="/transport">Arrange moving help</a></nav></article></main>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${content}</div>`);

  const relativePath = page.path === '/' ? 'index.html' : join(page.path.slice(1), 'index.html');
  const destination = join(outputDirectory, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, html, 'utf8');
}
