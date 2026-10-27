import { z } from 'zod';
import { siteSchema, publicUrlSchema, type HomeModule, type PageId, type SiteConfig } from '@/config/site';
import { projectSchema, type Project } from '@/config/projects';
import type { profile } from '@/config/profile';
import type { Contribution } from '@/config/contributions';
import type { PostMetadata } from '@/content/post-metadata';
import { postSchema, type PostEntry } from '@/content/post-model';
import { nav, text, type Locale } from './i18n';

export type Profile = typeof profile & { aiIndex?: boolean };
export type PortfolioInput = { site: SiteConfig; profile: Profile; projects: Project[]; posts: PostMetadata[]; contributions: Contribution[] };
function unique(values: string[], field: string) {
  if (new Set(values).size !== values.length) throw new Error(`${field}: duplicate entries`);
}
function parseField<T>(schema: z.ZodType<T>, value: unknown, field: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues.map(issue => `${field}.${issue.path.join('.')}: ${issue.message}`).join('\n'));
  return result.data;
}
function checkTranslations(value: unknown, enabled: Locale[], field: string): void {
  if (!value || typeof value !== 'object') return;
  if ('en' in value || 'zh' in value) {
    const record = value as Record<string, unknown>;
    for (const locale of enabled) if (typeof record[locale] !== 'string') throw new Error(`${field}.${locale}: missing enabled language`);
    return;
  }
  for (const [key, child] of Object.entries(value)) checkTranslations(child, enabled, `${field}.${key}`);
}
export function createPortfolio(input: PortfolioInput) {
  const site = parseField(siteSchema, input.site, 'site');
  const allProjects = parseField(z.array(projectSchema), input.projects, 'projects');
  const published = (item: { publication?: string }) => (item.publication ?? 'published') === 'published' || (item.publication === 'example' && input.profile.isExample);
  const projects = allProjects.filter(published);
  const contributions = input.contributions.filter(published);
  const allPosts = parseField(z.array(postSchema), input.posts, 'posts');
  checkTranslations(input.profile, site.enabledLocales, 'profile');
  checkTranslations(input.contributions, site.enabledLocales, 'contributions');
  unique(site.enabledLocales, 'site.enabledLocales');
  if (!site.enabledLocales.includes(site.defaultLocale)) throw new Error('site.defaultLocale: must be included in site.enabledLocales');
  const posts = allPosts.filter(post => post.status === 'published' || (post.status === 'example' && input.profile.isExample));
  const postsFor = (locale: Locale): PostEntry[] => !site.pages.blog || !site.enabledLocales.includes(locale) ? [] : posts.flatMap(post => {
    const language = post.translations[locale] ? locale : site.missingTranslation === 'fallback' && post.translations[site.defaultLocale] ? site.defaultLocale : null;
    return language ? [{ slug: post.slug, status: post.status, date: post.date, tags: post.tags, locale: language, ...post.translations[language]! }] : [];
  });
  unique(allProjects.map(p => p.slug), 'projects.slug');
  unique(input.contributions.map(item => item.url), 'contributions.url');
  unique(input.posts.map(p => p.slug), 'posts.slug');
  unique(site.navigation, 'site.navigation');
  unique(site.home.modules.map(m => m.type), 'site.home.modules');
  for (const module of site.home.modules) {
    if (module.featured && module.type !== 'projects') throw new Error(`home.modules.${module.type}.featured: only projects support featured slugs`);
    unique(module.featured ?? [], 'home.modules.projects.featured');
    for (const slug of module.featured ?? []) if (!allProjects.some(p => p.slug === slug)) throw new Error(`home.modules.projects.featured: unknown project ${slug}`);
  }
  if (input.profile.email) parseField(z.email(), input.profile.email, 'profile.email');
  if (input.profile.github) parseField(publicUrlSchema, input.profile.github, 'profile.github');
  input.contributions.forEach((item, index) => parseField(publicUrlSchema, item.url, `contributions.${index}.url`));
  parseField(z.boolean().optional(), input.profile.aiIndex, 'profile.aiIndex');
  input.contributions.forEach((item, index) => {
    parseField(z.enum(['published', 'draft', 'example']).optional(), item.publication, `contributions.${index}.publication`);
    parseField(z.boolean().optional(), item.aiIndex, `contributions.${index}.aiIndex`);
    parseField(z.enum(['open', 'merged', 'closed']), item.status, `contributions.${index}.status`);
  });
  const content = { ...input, site, projects, posts, contributions };
  const enabled = (page: PageId) => site.pages[page];
  const hasContent = (page: PageId, locale: Locale) => ({ resume: true, projects: projects.length > 0, blog: postsFor(locale).length > 0, contributions: contributions.length > 0, ask: true })[page];
  const visible = (page: PageId, locale: Locale = site.defaultLocale) => enabled(page) && hasContent(page, locale);
  const contact = (locale: Locale) => input.profile.email
    ? { href: `mailto:${input.profile.email}`, label: input.profile.email }
    : input.profile.github ? { href: input.profile.github, label: text(locale, 'Visit GitHub', '访问 GitHub') } : null;
  const featured = (module: HomeModule) => (module.featured ? module.featured.flatMap(slug => projects.filter(p => p.slug === slug)) : projects).slice(0, module.limit ?? 3);
  const modulesFor = (locale: Locale) => site.home.modules.filter(module => {
    if (!module.enabled) return false;
    switch (module.type) {
      case 'projects': return visible('projects', locale) && featured(module).length > 0;
      case 'posts': return visible('blog', locale);
      case 'contributions': return visible('contributions', locale);
      case 'experience': return enabled('resume') && input.profile.experience.length > 0;
      case 'contact': return !!contact(site.defaultLocale);
      case 'assistant': return enabled('ask');
      case 'about': return !!input.profile.bio[locale];
    }
  });
  const paths = (locale: Locale = site.defaultLocale) => !site.enabledLocales.includes(locale) ? [] : [
    '', ...(['resume', 'projects', 'blog', 'contributions', 'ask'] as PageId[]).filter(page => visible(page, locale)).map(page => `/${page}`),
    ...(enabled('projects') ? projects.map(p => `/projects/${p.slug}`) : []),
    ...postsFor(locale).filter(post => post.locale === locale).map(p => `/blog/${p.slug}`),
  ];
  return {
    ...content, enabled, visible, contact, featured, modules: modulesFor(site.defaultLocale), modulesFor, postsFor, paths,
    languagePaths: Object.fromEntries(site.enabledLocales.map(locale => [locale, paths(locale)])),
    navigation: (locale: Locale) => site.navigation.filter(page => visible(page, locale)).map(path => ({ path, label: nav.find(item => item.path === path)![locale] })),
    primaryAction: (locale: Locale) => visible('projects') ? { href: `/${locale}/projects`, label: text(locale, 'Explore the work', '查看项目作品') }
      : enabled('resume') ? { href: `/${locale}/resume`, label: text(locale, 'Read the resume', '阅读简历') } : contact(locale),
  };
}
export type Portfolio = ReturnType<typeof createPortfolio>;

export function projectEvidence(project: Project, locale: Locale) {
  const links = [...(project.evidence ?? []).map(e => ({ ...e, title: e.title[locale] }))];
  if (project.repository) links.push({ type: 'source', title: text(locale, 'Source repository', '源代码仓库'), url: project.repository });
  if (project.demo) links.push({ type: 'demo', title: text(locale, 'Live demo', '在线演示'), url: project.demo });
  const seen = new Set<string>();
  return links.filter(link => { const key = new URL(link.url).href.replace(/\/$/, ''); if (seen.has(key)) return false; seen.add(key); return true; });
}
