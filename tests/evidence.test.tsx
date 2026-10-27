import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { renderToStaticMarkup } from 'react-dom/server';
import { site } from '@/config/site';
import { profile } from '@/config/profile';
import { projects } from '@/config/projects';
import { postMetadata } from '@/content/post-metadata';
import type { PostMetadata } from '@/content/post-model';
import { createPortfolio, type PortfolioInput } from '@/lib/configuration';
import * as evidence from '@/lib/qa/public-sources';
import { answerQuestion } from '@/lib/qa/answer';
import { AskForm } from '@/components/ask-form';
import { ProjectView } from '@/components/project-views';
import { HomeView } from '@/components/home-view';
import { sitemapEntries } from '@/lib/sitemap-entries';
import { PublicExcerpt } from '@/components/public-excerpt';
import { extractPassages } from '../scripts/extract-passages.mjs';
import { generateRegistry, readRegistry, watchRegistry } from '../scripts/content-registry.mjs';

const local = (value: string) => ({ en: value, zh: value });
function input(): PortfolioInput {
  const value = structuredClone({ site, profile, projects, posts: postMetadata, contributions: [] });
  value.site.home.modules = [{ type: 'projects', enabled: true }, { type: 'posts', enabled: true }];
  return value;
}
const roots: string[] = [];
function files(aiIndex = true) {
  const root = mkdtempSync(path.join(tmpdir(), 'portfolio-evidence-')); roots.push(root);
  mkdirSync(path.join(root, 'src/content/posts'), { recursive: true });
  const record = { slug: 'note', status: 'published', aiIndex, date: '2026-10-27', tags: ['Engineering'], translations: { en: { title: 'Public note', excerpt: 'Public summary' } } };
  const save = (body: string) => writeFileSync(path.join(root, 'src/content/posts/note.en.mdx'), body);
  writeFileSync(path.join(root, 'src/content/posts/note.json'), JSON.stringify(record));
  return { root, record, save };
}
afterEach(() => {
  vi.restoreAllMocks(); vi.unstubAllEnvs();
  for (const root of roots.splice(0)) {
    if (path.dirname(root) !== path.resolve(tmpdir()) || !path.basename(root).startsWith('portfolio-evidence-')) throw new Error('Unexpected fixture path');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('publication and AI authorization', () => {
  it('keeps unapproved content visible to readers while excluding it from the model and suggestions', async () => {
    const value = input(); value.projects.forEach(project => { delete project.aiIndex; }); value.posts.forEach(post => { delete post.aiIndex; });
    value.profile.isExample = false; value.profile.aiIndex = false;
    const content = createPortfolio(value); const sources = evidence.buildPublicSources('en', content);
    expect(renderToStaticMarkup(<HomeView locale="en" content={content} />)).toContain('AI Portfolio Kit');
    expect(content.paths('en')).toContain('/blog/evidence-first-ai');
    expect(sources).toEqual([]); expect(evidence.suggestedQuestions('en', sources)).toEqual([]);
    const fetcher = vi.fn<typeof fetch>(); vi.spyOn(evidence, 'publicSources').mockReturnValue(sources);
    const result = await answerQuestion('technology stack', 'en', { apiKey: 'test', model: 'test', fetcher });
    expect(result.sources).toEqual([]); expect(result.message).toContain('No authorized'); expect(fetcher).not.toHaveBeenCalled();
    const html = renderToStaticMarkup(<AskForm locale="en" hasSources={false} suggestions={[]} browseHref="/en" />);
    expect(html).toContain('No public passages'); expect(html).not.toContain('href="/en/projects"');
  });
  it('updates exact role and responsibility text without changing stable IDs, and records a new revision', () => {
    const value = input(); value.projects[0].role = local('Documented maintainer'); value.projects[0].contribution = local('Implemented the accessible search');
    const before = evidence.buildPublicSources('en', createPortfolio(value));
    const role = before.find(source => source.id.endsWith(':role'))!;
    expect(role.excerpt).toBe('Documented maintainer');
    expect(before.find(source => source.id.endsWith(':contribution'))!.excerpt).toBe('Implemented the accessible search');
    expect(renderToStaticMarkup(<ProjectView locale="en" project={value.projects[0]} />)).toContain(role.excerpt);
    value.projects[0].role.en = 'Updated documented role';
    const after = evidence.buildPublicSources('en', createPortfolio(value)).find(source => source.id === role.id)!;
    expect(after.excerpt).toBe('Updated documented role'); expect(after.revision).not.toBe(role.revision);
  });
  it.each(['revoke', 'draft', 'example', 'disable', 'delete'])('removes a project source and related suggestions after %s', action => {
    const value = input(); value.posts = [];
    expect(evidence.buildPublicSources('en', createPortfolio(value)).length).toBeGreaterThan(0);
    if (action === 'revoke') value.projects[0].aiIndex = false;
    if (action === 'draft' || action === 'example') value.projects[0].publication = action;
    if (action === 'disable') value.site.pages.projects = false;
    if (action === 'delete') value.projects = [];
    const content = createPortfolio(value); const sources = evidence.buildPublicSources('en', content);
    expect(sources).toEqual([]); expect(evidence.suggestedQuestions('en', sources)).toEqual([]);
    if (action === 'draft' || action === 'delete') expect(content.paths('en')).not.toContain('/projects/ai-portfolio-kit');
  });
  it('hides a featured draft without breaking the home, resume project inventory or sitemap', () => {
    const value = input(); value.projects[0].publication = 'draft'; value.profile.isExample = false;
    value.site.home.modules = [{ type: 'projects', enabled: true, featured: ['ai-portfolio-kit'] }];
    const content = createPortfolio(value);
    expect(content.projects).toEqual([]); expect(content.modules).toEqual([]);
    expect(JSON.stringify(sitemapEntries(content, 'https://portfolio.example'))).not.toContain('/projects/ai-portfolio-kit');
  });
  it('requires a real profile plus explicit permission before offering personal skills and contact questions', () => {
    const value = input(); value.profile.aiIndex = true; value.profile.email = 'sample@example.org';
    value.projects = []; value.posts = [];
    expect(evidence.buildPublicSources('en', createPortfolio(value))).toEqual([]);
    value.profile.isExample = false;
    const sources = evidence.buildPublicSources('en', createPortfolio(value));
    expect(sources.find(source => source.id === 'profile')!.excerpt).toBe(value.profile.bio.en);
    expect(sources.find(source => source.id === 'profile:skills')!.excerpt).toBe(value.profile.skills.join(' / '));
    expect(sources.find(source => source.id === 'profile:contact')!.excerpt).toBe('sample@example.org');
    expect(evidence.suggestedQuestions('en', sources)).toContain('How can I contact the author?');
    expect(evidence.suggestedQuestions('en', sources)).toContain('What skills are listed in the public profile?');
    value.site.pages.resume = false; expect(evidence.buildPublicSources('en', createPortfolio(value))).toEqual([]);
  });
  it('indexes only opted-in published contribution records and preserves their actual status', () => {
    const value = input(); value.projects = []; value.posts = []; value.profile.isExample = false;
    value.contributions = [{ title: 'Sample PR', url: 'https://example.org/pr/1', status: 'open', summary: local('Sample public change'), aiIndex: true }];
    let sources = evidence.buildPublicSources('en', createPortfolio(value));
    expect(sources[0].excerpt).toBe('open · Sample public change');
    const id = sources[0].id; value.contributions[0].status = 'closed';
    sources = evidence.buildPublicSources('en', createPortfolio(value)); expect(sources[0].id).toBe(id); expect(sources[0].excerpt).toBe('closed · Sample public change');
    value.contributions[0].publication = 'draft'; expect(createPortfolio(value).contributions).toEqual([]);
    expect(evidence.buildPublicSources('en', createPortfolio(value))).toEqual([]);
    value.contributions[0].publication = 'published'; value.contributions[0].aiIndex = false;
    expect(createPortfolio(value).contributions).toHaveLength(1); expect(evidence.buildPublicSources('en', createPortfolio(value))).toEqual([]);
  });
  it('sends only authorized original excerpts to a mocked provider, with no private fields, files or environment data', async () => {
    const value = input(); value.projects[0].aiIndex = false;
    Object.assign(value.profile, { privateNotes: 'PRIVATE-NOTES-MARKER' }); vi.stubEnv('PRIVATE_EVIDENCE_SECRET', 'PRIVATE-ENV-MARKER');
    const { root, save } = files(); save('<PublicExcerpt id="stack">\n\nThe technology stack uses documented TypeScript.\n\n</PublicExcerpt>\n\nUNAPPROVED-BODY-MARKER');
    writeFileSync(path.join(root, 'private.txt'), 'PRIVATE-FILE-MARKER');
    value.posts = readRegistry(root) as PostMetadata[];
    const sources = evidence.buildPublicSources('en', createPortfolio(value)); vi.spyOn(evidence, 'publicSources').mockReturnValue(sources);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ sourceIds: [sources[0].id] }) }] }] }));
    const result = await answerQuestion('technology stack', 'en', { apiKey: 'TEST-KEY', model: 'test', fetcher });
    expect(result.mode).toBe('ai-assisted'); expect(result.sources[0].excerpt).toBe(sources[0].excerpt);
    const requestBody = String(fetcher.mock.calls[0][1]!.body);
    expect(requestBody).not.toMatch(/PRIVATE-|UNAPPROVED-BODY|TEST-KEY|keywords|category|subject/);
    expect(requestBody).toContain('documented TypeScript');
  });
});

describe('source-faithful article excerpts', () => {
  it('requires marked prose for an approved published article, while never parsing an opted-in draft', () => {
    const { root, record, save } = files(); save('## Plain public text');
    expect(() => readRegistry(root)).toThrow(/aiIndex.*PublicExcerpt/);
    record.status = 'draft'; writeFileSync(path.join(root, 'src/content/posts/note.json'), JSON.stringify(record));
    save('<InvalidDraft {'); expect(() => generateRegistry(root)).not.toThrow();
    expect(readFileSync(path.join(root, 'src/content/post-metadata.ts'), 'utf8')).not.toContain('Public note');
  });
  it('extracts only marked static prose and gives it the same visible anchor', () => {
    const body = 'UNMARKED-SECRET\n\n<PublicExcerpt id="decision">\n\nUse **public** `facts` and [sources](/en).\n\n</PublicExcerpt>';
    const passages = extractPassages(body, 'note.en.mdx');
    expect(passages).toEqual([{ id: 'decision', excerpt: 'Use public facts and sources.' }]);
    expect(renderToStaticMarkup(<PublicExcerpt id="decision"><p>Use public facts and sources.</p></PublicExcerpt>)).toContain('id="evidence-decision"');
  });
  it.each([
    '<PublicExcerpt id="x">\n\n{process.env.SECRET}\n\n</PublicExcerpt>',
    '<PublicExcerpt id={"x"}>\n\nText\n\n</PublicExcerpt>',
    '<PublicExcerpt id="x" hidden>\n\nText\n\n</PublicExcerpt>',
    '<div hidden>\n\n<PublicExcerpt id="x">\n\nText\n\n</PublicExcerpt>\n\n</div>',
    '<PublicExcerpt id="x">\n\nText\n\n</PublicExcerpt>\n\n<PublicExcerpt id="x">\n\nOther\n\n</PublicExcerpt>',
    '<PublicExcerpt id="x">\n\n![hidden](/asset.png)\n\n</PublicExcerpt>',
  ])('rejects dynamic, hidden, duplicate or non-prose evidence', body => {
    expect(() => extractPassages(body, 'note.en.mdx')).toThrow(/note.en.mdx.PublicExcerpt/);
  });
  it('updates generated text and revision while keeping IDs, then removes data when permission is revoked', () => {
    const { root, record, save } = files();
    const value = input(); value.projects = [];
    save('<PublicExcerpt id="decision">\n\nOriginal public decision.\n\n</PublicExcerpt>'); generateRegistry(root);
    value.posts = readRegistry(root) as PostMetadata[];
    const before = evidence.buildPublicSources('en', createPortfolio(value))[0];
    save('<PublicExcerpt id="decision">\n\nUpdated public decision.\n\n</PublicExcerpt>'); generateRegistry(root);
    value.posts = readRegistry(root) as PostMetadata[];
    const after = evidence.buildPublicSources('en', createPortfolio(value))[0];
    expect(after.id).toBe(before.id); expect(after.revision).not.toBe(before.revision); expect(after.excerpt).toBe('Updated public decision.');
    expect(after.url).toBe('/en/blog/note#evidence-decision');
    record.aiIndex = false; writeFileSync(path.join(root, 'src/content/posts/note.json'), JSON.stringify(record)); generateRegistry(root);
    expect(readFileSync(path.join(root, 'src/content/post-metadata.ts'), 'utf8')).not.toContain('Updated public decision');
    value.posts = readRegistry(root) as PostMetadata[]; expect(evidence.buildPublicSources('en', createPortfolio(value))).toEqual([]);
  });
  it('watches body edits and fails closed on invalid evidence before recovering', async () => {
    const { root, save } = files();
    const read = () => readFileSync(path.join(root, 'src/content/post-metadata.ts'), 'utf8');
    save('<PublicExcerpt id="sync">\n\nFirst text.\n\n</PublicExcerpt>'); generateRegistry(root);
    const watcher = watchRegistry(root); const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      save('<PublicExcerpt id="sync">\n\nSecond text.\n\n</PublicExcerpt>');
      await vi.waitFor(() => expect(read()).toContain('Second text.'));
      save('<PublicExcerpt id="sync">\n\n{secret}\n\n</PublicExcerpt>');
      await vi.waitFor(() => expect(read()).toContain('PostMetadata[] = []'));
      expect(logger).toHaveBeenCalled();
      save('<PublicExcerpt id="sync">\n\nRecovered text.\n\n</PublicExcerpt>');
      await vi.waitFor(() => expect(read()).toContain('Recovered text.'));
    } finally { watcher.close(); }
  });
});
