import { readFileSync } from 'node:fs';
import path from 'node:path';
import { publicAsset } from './content-registry.mjs';

// Runs only on the server/build, after typed configuration validation.
export function validatePublicContent(root, content, siteUrl) {
  if (siteUrl) {
    try {
      if (!['http:', 'https:'].includes(new URL(siteUrl).protocol)) throw new Error();
    } catch { throw new Error('env.SITE_URL: use an absolute http(s) URL'); }
  }
  for (const [index, project] of content.projects.entries()) {
    if (project.cover) publicAsset(root, project.cover.src, `projects.${index}.cover.src`);
    project.screenshots?.forEach((image, number) => publicAsset(root, image.src, `projects.${index}.screenshots.${number}.src`));
  }
  const allowed = new Set(content.site.enabledLocales.flatMap(locale => content.paths(locale).map(route => `/${locale}${route}`)));
  // Empty list pages still allow direct access; they are intentionally absent from navigation.
  for (const locale of content.site.enabledLocales) for (const [page, enabled] of Object.entries(content.site.pages)) if (enabled) allowed.add(`/${locale}/${page}`);
  allowed.add('/');
  for (const locale of content.site.enabledLocales) for (const post of content.postsFor(locale).filter(post => post.locale === locale)) {
    const file = `${post.slug}.${locale}.mdx`;
    const body = readFileSync(path.join(root, 'src/content/posts', file), 'utf8');
    const urls = [...body.matchAll(/(?<!!)\[[^\]]*\]\((\/[^\s)]*)\)/g)].map(match => match[1]);
    urls.push(...[...body.matchAll(/\bhref\s*=\s*["'](\/[^"']*)["']/g)].map(match => match[1]));
    for (const url of urls) {
      const pathname = url.split(/[?#]/)[0].replace(/\/$/, '') || '/';
      if (allowed.has(pathname)) continue;
      try { publicAsset(root, url, `${file}.links`); }
      catch { throw new Error(`${file}.links: unavailable internal reference ${url}`); }
    }
  }
}
