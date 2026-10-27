import type { MetadataRoute } from 'next';
import type { Portfolio } from './configuration';
export function sitemapEntries(content: Portfolio, siteUrl?: string): MetadataRoute.Sitemap {
  if (content.profile.isExample || !siteUrl) return [];
  const origin = new URL(siteUrl).origin;
  return content.site.enabledLocales.flatMap(locale => content.paths(locale).filter(path => {
    if (!path.startsWith('/blog/')) return true;
    return content.posts.find(post => `/blog/${post.slug}` === path)?.status === 'published';
  }).map(path => ({ url: `${origin}/${locale}${path}`, alternates: { languages: Object.fromEntries(content.site.enabledLocales
    .filter(other => content.paths(other).includes(path)).map(other => [other, `${origin}/${other}${path}`])) } })));
}
