import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n';
import { projects } from '@/config/projects';
import { profile } from '@/config/profile';
export default function sitemap(): MetadataRoute.Sitemap {
  if (profile.isExample || !process.env.SITE_URL) return [];
  const origin = new URL(process.env.SITE_URL).origin;
  const paths = ['', '/resume', '/projects', '/blog', '/contributions', '/ask', ...projects.map(p => `/projects/${p.slug}`), '/blog/evidence-first-ai', '/blog/own-your-kit'];
  return paths.flatMap(path => locales.map(locale => ({ url: `${origin}/${locale}${path}`, alternates: { languages: { en: `${origin}/en${path}`, zh: `${origin}/zh${path}` } } })));
}
