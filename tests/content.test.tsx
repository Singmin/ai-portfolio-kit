import { afterAll, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { site } from '@/config/site';
import { profile } from '@/config/profile';
import { createPortfolio, type PortfolioInput } from '@/lib/configuration';
import { buildPublicSources } from '@/lib/qa/public-sources';
import { sitemapEntries } from '@/lib/sitemap-entries';
import { Header } from '@/components/header';
import { HomeView } from '@/components/home-view';
import { PostList } from '@/components/post-list';
import { generateRegistry, readRegistry } from '../scripts/content-registry.mjs';
import { validatePublicContent } from '../scripts/validate-public-content.mjs';

vi.mock('next/navigation', () => ({ usePathname: () => '/en/blog/evidence-first-ai', notFound: () => { throw new Error('404'); } }));
const roots: string[] = [];
function files() {
  const root = mkdtempSync(path.join(tmpdir(), 'portfolio-content-')); roots.push(root);
  mkdirSync(path.join(root, 'src/content/posts'), { recursive: true });
  mkdirSync(path.join(root, 'public'));
  const put = (file: string, text: string) => writeFileSync(path.join(root, 'src/content/posts', file), text);
  return { root, put };
}
afterAll(() => {
  for (const root of roots) {
    if (path.dirname(root) !== path.resolve(tmpdir()) || !path.basename(root).startsWith('portfolio-content-')) throw new Error('Unexpected test directory');
    rmSync(root, { recursive: true, force: true });
  }
});
const article = { slug: 'evidence-first-ai', status: 'published' as const, date: '2026-10-23', tags: ['Engineering'], translations: { en: { title: 'Public note', excerpt: 'An excerpt' } } };
function input(): PortfolioInput {
  const value = structuredClone({ site, profile, projects: [], contributions: [], posts: [article] });
  value.site.home.modules = [{ type: 'posts', enabled: true }]; value.profile.isExample = false;
  return value;
}

describe('public content inventory', () => {
  it.each(['en', 'zh'] as const)('supports %s alone without routes, sitemap alternates or sources for the disabled language', locale => {
    const value = input(); value.site.enabledLocales = [locale]; value.site.defaultLocale = locale;
    const content = createPortfolio(value);
    const disabled = locale === 'en' ? 'zh' : 'en';
    expect(content.paths(disabled)).toEqual([]); expect(buildPublicSources(disabled, content)).toEqual([]);
    const entries = sitemapEntries(content, 'https://portfolio.example');
    expect(entries.every(item => item.url.startsWith(`https://portfolio.example/${locale}`))).toBe(true);
    expect(JSON.stringify(entries)).not.toContain(`/${disabled}`);
    const header = renderToStaticMarkup(<Header locale={locale} brand="Example" navigation={content.navigation(locale)} showAsk={false} languagePaths={content.languagePaths} />);
    expect(header).not.toContain('class="language"');
  });
  it('rejects duplicate languages and a disabled default language with field names', () => {
    const value = input(); value.site.enabledLocales = ['en'];
    expect(() => createPortfolio(value)).toThrow('site.defaultLocale');
    value.site.enabledLocales = ['en', 'en', 'zh']; expect(() => createPortfolio(value)).toThrow('site.enabledLocales');
  });
  it('hides missing translations from localized home, navigation, sitemap, search and Q&A', () => {
    const content = createPortfolio(input());
    expect(content.postsFor('zh')).toEqual([]); expect(content.postsFor('en')).toHaveLength(1);
    expect(content.navigation('zh').some(item => item.path === 'blog')).toBe(false);
    expect(content.modulesFor('en')).toHaveLength(1); expect(content.modulesFor('zh')).toHaveLength(0);
    expect(renderToStaticMarkup(<HomeView locale="zh" content={content} />)).not.toContain('Public note');
    expect(sitemapEntries(content, 'https://portfolio.example').filter(item => item.url.includes('/blog/'))).toEqual([
      expect.objectContaining({ url: 'https://portfolio.example/en/blog/evidence-first-ai', alternates: { languages: { en: 'https://portfolio.example/en/blog/evidence-first-ai' } } }),
    ]);
    expect(buildPublicSources('zh', content).some(item => item.id === 'ai')).toBe(false);
  });
  it('links fallback entries to the default original, without inventing a translated route or citation', () => {
    const value = input(); value.site.defaultLocale = 'en'; value.site.missingTranslation = 'fallback';
    const content = createPortfolio(value);
    expect(content.postsFor('zh')[0].locale).toBe('en');
    const html = renderToStaticMarkup(<PostList locale="zh" posts={content.postsFor('zh')} />);
    expect(html).toContain('href="/en/blog/evidence-first-ai"'); expect(html).toContain('提供英文原文');
    expect(content.paths('zh')).not.toContain('/blog/evidence-first-ai');
    expect(buildPublicSources('zh', content).some(item => item.id === 'ai')).toBe(false);
  });
  it('switches an untranslated article to an available destination', () => {
    const content = createPortfolio(input());
    const html = renderToStaticMarkup(<Header locale="en" brand="Example" navigation={[]} showAsk={false} languagePaths={content.languagePaths} />);
    expect(html).toContain('href="/zh"'); expect(html).toContain('lang="zh"');
    expect(html).not.toContain('/zh/blog/evidence-first-ai');
  });
  it('excludes drafts everywhere and labels examples only in preview, with no AI or sitemap inclusion', () => {
    const value = input(); value.posts[0].status = 'draft';
    const draft = createPortfolio(value); expect(draft.posts).toEqual([]); expect(draft.postsFor('en')).toEqual([]);
    expect(buildPublicSources('en', draft).some(item => item.id === 'ai')).toBe(false);
    value.posts[0].status = 'example'; expect(createPortfolio(value).posts).toEqual([]);
    value.profile.isExample = true; const preview = createPortfolio(value);
    expect(renderToStaticMarkup(<PostList locale="en" posts={preview.postsFor('en')} />)).toContain('Example');
    expect(buildPublicSources('en', preview).some(item => item.id === 'ai')).toBe(false);
    expect(sitemapEntries(preview, 'https://portfolio.example')).toEqual([]);
  });
});

describe('trusted MDX registry and build diagnostics', () => {
  it('discovers a new article without editing imports and excludes draft metadata and code', () => {
    const { root, put } = files();
    put('evidence-first-ai.json', JSON.stringify(article)); put('evidence-first-ai.en.mdx', '## Public body');
    put('draft.json', JSON.stringify({ ...article, slug: 'draft', status: 'draft' })); put('draft.en.mdx', 'throw new Error("Never compile me")');
    generateRegistry(root);
    expect(readFileSync(path.join(root, 'src/content/post-metadata.ts'), 'utf8')).not.toContain('"draft"');
    const loaders = readFileSync(path.join(root, 'src/content/post-loaders.ts'), 'utf8');
    expect(loaders).toContain("import('./posts/evidence-first-ai.en.mdx')"); expect(loaders).not.toContain("import('./posts/draft");
  });
  it.each(['slug', 'date', 'translations', 'missing-file', 'unregistered', 'link', 'media', 'reference'])('reports a useful field for %s', reason => {
    const { root, put } = files();
    const post = structuredClone(article);
    if (reason === 'slug') post.slug = '../unsafe';
    if (reason === 'date') post.date = '2026-02-30';
    if (reason === 'translations') post.translations.en.title = '';
    put('evidence-first-ai.json', JSON.stringify(post));
    if (reason !== 'missing-file') put('evidence-first-ai.en.mdx', reason === 'link' ? '[bad](javascript:alert)' : reason === 'media' ? '![absent](/missing.png)' : reason === 'reference' ? '[draft](/en/blog/draft)' : '## Body');
    if (reason === 'unregistered') put('unknown.en.mdx', '## Unknown');
    if (reason === 'reference') {
      expect(() => validatePublicContent(root, createPortfolio(input()), undefined)).toThrow(/links.*draft/);
    } else expect(() => readRegistry(root)).toThrow(/slug|date|translations|missing|unregistered|links|media/);
  });
  it('checks local asset existence and SITE_URL before publishing', () => {
    const content = createPortfolio(input());
    expect(() => validatePublicContent(process.cwd(), content, 'javascript:alert(1)')).toThrow('env.SITE_URL');
  });
});
