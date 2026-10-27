import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { site } from '@/config/site';
import { profile } from '@/config/profile';
import { projects, type Project } from '@/config/projects';
import { postMetadata } from '@/content/post-metadata';
import { createPortfolio, projectEvidence, type PortfolioInput } from '@/lib/configuration';
import { buildPublicSources } from '@/lib/qa/public-sources';
import { sitemapEntries } from '@/lib/sitemap-entries';
import { HomeView } from '@/components/home-view';
import { ProjectView, ProjectsView } from '@/components/project-views';
import { Footer } from '@/components/footer';
import { ContributionsView } from '@/components/contributions-view';

const localized = (value: string) => ({ en: value, zh: value });
function fixture(): PortfolioInput {
  const input = structuredClone({ site, profile, projects, posts: postMetadata, contributions: [] });
  input.site.home.modules = input.site.home.modules.map(module => ({ ...module, featured: undefined }));
  return input;
}
function project(slug: string): Project {
  return { slug, aiIndex: true, name: `${slug} sample`, status: localized('Illustrative example'), summary: localized('Example project summary'), problem: localized('Example problem'), decisions: localized('Example decision'), outcome: localized('Example outcome without fabricated metrics'), stack: ['TypeScript'], repository: null, demo: null };
}
afterEach(() => vi.restoreAllMocks());
describe('configuration and content behavior', () => {
  it('supports zero projects without broken home, routes or Q&A references', () => {
    const input = fixture(); input.projects = [];
    const content = createPortfolio(input);
    expect(content.modules.some(module => module.type === 'projects')).toBe(false);
    expect(content.navigation('en').some(item => item.path === 'projects')).toBe(false);
    expect(renderToStaticMarkup(<HomeView locale="en" content={content} />)).not.toContain('/previews/');
    expect(renderToStaticMarkup(<ProjectsView locale="en" content={content} />)).toContain('No public projects');
    expect(buildPublicSources('en', content).some(source => source.id.startsWith('project:'))).toBe(false);
  });
  it('uses config order by default and explicit featured order and limits when supplied', () => {
    const input = fixture(); input.projects = [project('alpha'), project('beta'), project('gamma')];
    const content = createPortfolio(input);
    expect(content.featured({ type: 'projects', enabled: true }).map(p => p.slug)).toEqual(['alpha', 'beta', 'gamma']);
    expect(content.featured({ type: 'projects', enabled: true, featured: ['gamma', 'alpha'], limit: 1 }).map(p => p.slug)).toEqual(['gamma']);
  });
  it.each(['duplicate slug', 'unknown featured', 'duplicate module', 'invalid navigation', 'duplicate featured', 'duplicate navigation'])('rejects %s with useful config errors', reason => {
    const input = fixture();
    if (reason === 'duplicate slug') input.projects.push(input.projects[0]);
    if (reason === 'unknown featured') input.site.home.modules[0].featured = ['missing'];
    if (reason === 'duplicate module') input.site.home.modules.push(input.site.home.modules[0]);
    if (reason === 'invalid navigation') input.site.navigation = ['missing' as 'resume'];
    if (reason === 'duplicate featured') input.site.home.modules[0].featured = ['ai-portfolio-kit', 'ai-portfolio-kit'];
    if (reason === 'duplicate navigation') input.site.navigation.push('resume');
    expect(() => createPortfolio(input)).toThrow(/projects|featured|modules|navigation|Invalid option/);
  });
  it('keeps homepage visibility independent of page access and follows module order', () => {
    const input = fixture(); input.site.home.modules = [{ type: 'about', enabled: true }, { type: 'posts', enabled: true, limit: 1 }, { type: 'projects', enabled: false }];
    const content = createPortfolio(input);
    expect(content.enabled('projects')).toBe(true);
    expect(content.modules.map(module => module.type)).toEqual(['about', 'posts']);
    const html = renderToStaticMarkup(<HomeView locale="en" content={content} />);
    expect(html.indexOf('data-module="about"')).toBeLessThan(html.indexOf('data-module="posts"'));
    expect(html).not.toContain('data-module="projects"');
    expect(html).not.toContain('/blog/own-your-kit');
  });
  it('removes disabled pages and details from modules, navigation, sitemap and public sources', () => {
    const input = fixture(); input.profile.isExample = false;
    input.site.pages.projects = false; input.site.pages.blog = false; input.site.pages.contributions = false;
    const content = createPortfolio(input);
    expect(content.navigation('en').map(item => item.path)).toEqual(['resume']);
    expect(content.modules.map(module => module.type)).toEqual(['about', 'assistant']);
    expect(sitemapEntries(content, 'https://portfolio.example').every(item => !/\/(projects|blog|contributions)(\/|$)/.test(item.url))).toBe(true);
    expect(buildPublicSources('en', content)).toEqual([]);
    input.site.pages.ask = false;
    expect(buildPublicSources('en', createPortfolio(input))).toEqual([]);
  });
  it('only offers real contact or enabled destinations, and hides actions without targets', () => {
    const input = fixture(); input.site.pages.projects = false; input.site.pages.resume = false;
    expect(createPortfolio(input).primaryAction('en')).toBeNull();
    input.profile.email = 'sample@example.org';
    expect(createPortfolio(input).primaryAction('en')?.href).toBe('mailto:sample@example.org');
    expect(createPortfolio(input).modules.some(module => module.type === 'contact')).toBe(true);
  });
  it('renders optional case-study fields and deduplicates evidence without requiring media', () => {
    const plain = project('plain');
    const html = renderToStaticMarkup(<ProjectView locale="en" project={plain} />);
    expect(html).not.toContain('<img'); expect(html).not.toContain('Source repository'); expect(html).not.toContain('Results in context'); expect(html).not.toContain('local.');
    plain.role = localized('Example maintainer'); plain.team = localized('Example collaboration'); plain.contribution = localized('Example scope');
    plain.repository = 'https://example.org/source'; plain.demo = 'https://example.org/demo';
    plain.metrics = [{ value: 'Illustrative only', label: localized('Example explanation'), evidenceUrl: 'https://example.org/evidence' }];
    plain.evidence = [{ type: 'source', title: localized('Inspect sample source'), url: 'https://example.org/source/' }];
    const full = renderToStaticMarkup(<ProjectView locale="zh" project={plain} />);
    expect(full).toContain('Example scope'); expect(full).toContain('https://example.org/evidence');
    expect(projectEvidence(plain, 'en')).toHaveLength(2);
  });
  it('hides empty contributions on the home while retaining an honest direct-access state', () => {
    const content = createPortfolio(fixture());
    expect(content.navigation('en').some(item => item.path === 'contributions')).toBe(false);
    expect(content.modules.some(module => module.type === 'contributions')).toBe(false);
    expect(renderToStaticMarkup(<ContributionsView locale="en" content={content} />)).toContain('No external contributions');
  });
  it('derives approved project and contribution excerpts from actual content and never indexes arbitrary posts', () => {
    const input = fixture(); input.projects = [project('alpha'), project('beta')];
    input.contributions = [{ title: 'Example public change', aiIndex: true, url: 'https://example.org/pr/1', status: 'open', summary: localized('Example public summary') }];
    input.posts = [{ slug: 'unapproved', status: 'published', translations: { en: { title: 'Unapproved', excerpt: 'Private-shaped excerpt' }, zh: { title: 'Unapproved', excerpt: 'Private-shaped excerpt' } }, date: '2026-10-26', tags: [] }];
    const sources = buildPublicSources('zh', createPortfolio(input));
    expect(sources.filter(source => source.id.startsWith('project:'))).toHaveLength(10);
    expect(sources.some(source => source.url === '/zh/projects/beta')).toBe(true);
    expect(sources.some(source => source.excerpt.includes('Example public summary'))).toBe(true);
    expect(JSON.stringify(sources)).not.toContain('Private-shaped');
  });
  it('can replace the entire public identity and project set without modifying components', () => {
    const input = fixture(); input.site.brand = localized('Sample Studio'); input.site.template.name = 'Sample Starter'; input.site.template.repository = null;
    input.site.footer.wordmark = 'SAMPLE'; input.site.footer.signature = localized('Sample signature'); input.site.footer.statement = localized('Example profile only');
    input.profile.name = localized('Sample Author'); input.profile.bio = localized('Clearly labelled fictional profile'); input.profile.headline = localized('Sample work'); input.profile.summary = localized('Example introduction');
    input.projects = [project('sample-tool')]; input.posts = []; input.site.pages.ask = false;
    const content = createPortfolio(input);
    const html = renderToStaticMarkup(<><HomeView locale="en" content={content} /><Footer locale="en" content={content} /></>);
    expect(html).toContain('Sample Author'); expect(html).toContain('/en/projects/sample-tool');
    expect(html).not.toMatch(/AI Portfolio Kit|ai-portfolio-kit|\/previews\/|evidence-first-ai/);
    expect(buildPublicSources('en', content)).toEqual([]);
  });
  it('validates local media and rejects executable external evidence URLs', () => {
    const input = fixture(); input.projects[0].cover = { src: '//external/image.png', alt: localized('sample') };
    expect(() => createPortfolio(input)).toThrow();
    input.projects[0].cover = undefined; input.projects[0].repository = 'javascript:alert(1)';
    expect(() => createPortfolio(input)).toThrow();
  });
});

it('omits empty public passages instead of returning blank citations', () => {
  const input = fixture(); input.profile.bio = localized(''); input.projects[0].stack = [];
  const sources = buildPublicSources('en', createPortfolio(input));
  expect(sources.every(source => source.excerpt.trim().length > 0)).toBe(true);
  expect(sources.some(source => source.id === 'profile' || source.id.endsWith(':stack'))).toBe(false);
});
