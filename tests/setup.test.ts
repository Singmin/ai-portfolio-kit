import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { site } from '@/config/site';
import { profile } from '@/config/profile';
import { portfolio } from '@/lib/portfolio';
import { parseCustomization, customizeProfile, customizeSite } from '@/config/customization-schema.mjs';
import { loadPublicConfig } from '../scripts/load-public-config.mjs';
import { publicationReport } from '../scripts/publication-report.mjs';
import { writeDraft, readCustomization, createPreview, applyDraft } from '../scripts/setup-io.mjs';

const root = process.cwd();
const sample = JSON.parse(readFileSync(path.join(root, 'examples/setup/zh-preview.json'), 'utf8'));
afterEach(() => { vi.unstubAllEnvs(); });

describe('setup settings contract', () => {
  it('preserves current behavior with an empty versioned override', () => {
    const settings = parseCustomization({ version: 1 });
    expect(customizeProfile(profile, settings)).toEqual(profile);
    expect(customizeSite(site, settings)).toEqual(site);
  });
  it('accepts single-language input without inventing a second enabled translation', () => {
    const settings = parseCustomization(sample);
    const result = customizeProfile(profile, settings);
    expect(result.name.zh).toBe(sample.profile.name.zh); expect(result.name.en).toBe(sample.profile.name.zh);
    expect(customizeSite(site, settings).enabledLocales).toEqual(['zh']);
    expect(result.skills).toEqual([]); expect(result.aiIndex).toBe(false);
  });
  it.each(['language', 'translation', 'preset', 'secret', 'origin', 'module-limit'])('rejects invalid %s with a field path and without exposing input values', reason => {
    const input = structuredClone(sample);
    if (reason === 'language') input.site.defaultLocale = 'en';
    if (reason === 'translation') input.site.enabledLocales = ['en', 'zh'];
    if (reason === 'preset') input.site.appearance.preset = 'unknown';
    if (reason === 'secret') input.OPENAI_API_KEY = 'SECRET-VALUE-DO-NOT-PRINT';
    if (reason === 'origin') input.seo = { url: 'https://user:SECRET-VALUE-DO-NOT-PRINT@example.org/path' };
    if (reason === 'module-limit') input.site.home.modules[0].limit = 0;
    try { parseCustomization(input); expect.fail('Invalid config should fail'); }
    catch (error) { expect(String(error)).toMatch(/customization\./); expect(String(error)).not.toContain('SECRET-VALUE-DO-NOT-PRINT'); }
  });
  it('normalizes nested single-language experience and education without indexing a sample identity', () => {
    const input = JSON.parse(readFileSync(path.join(root, 'examples/setup/en-resume.json'), 'utf8'));
    const content = loadPublicConfig(root, input).content;
    expect(content.profile.experience[0].role.en).toBe('Example role');
    expect(content.profile.experience[0].role.zh).toBe('Example role');
    expect(content.profile.education[0].degree.en).toContain('not a credential');
    expect(content.projects).toEqual([]); expect(content.posts).toEqual([]);
  });
  it.each(['zh-preview', 'en-resume', 'bilingual-editorial'])('loads the complete labelled %s example through the real application model', name => {
    const input = JSON.parse(readFileSync(path.join(root, `examples/setup/${name}.json`), 'utf8'));
    const content = loadPublicConfig(root, input).content;
    expect(content.profile.isExample).toBe(true); expect(content.profile.aiIndex).toBe(false);
    expect(content.site.appearance.preset).toBe(input.site.appearance.preset);
    expect(content.site.enabledLocales).toEqual(input.site.enabledLocales);
  });
  it('uses the same validated inventory as Next without modifying generated files or the live config', () => {
    const files = ['src/config/customization.json', 'src/content/post-metadata.ts', 'src/content/post-loaders.ts'];
    const before = files.map(file => readFileSync(path.join(root, file), 'utf8'));
    const loaded = loadPublicConfig(root).content;
    expect(JSON.parse(JSON.stringify(loaded))).toEqual(JSON.parse(JSON.stringify(portfolio)));
    expect(files.map(file => readFileSync(path.join(root, file), 'utf8'))).toEqual(before);
  });
  it('hides starter content and respects the chosen home module order', () => {
    const content = loadPublicConfig(root, sample).content;
    expect(content.site.enabledLocales).toEqual(['zh']); expect(content.projects).toEqual([]);
    expect(content.site.home.modules.map((item: { type: string }) => item.type)).toEqual(['about', 'contact']);
  });
});

describe('read-only publication report', () => {
  it('blocks starter publication while allowing an explicitly labelled static preview', () => {
    const release = publicationReport(root, portfolio, { siteUrl: 'https://fixture-portfolio.dev' });
    expect(release.passed).toBe(false); expect(release.errors.some((item: { code: string }) => item.code === 'example-profile')).toBe(true);
    const preview = publicationReport(root, portfolio, { siteUrl: 'https://fixture-portfolio.dev', preview: true, deployment: 'static' });
    expect(preview.passed).toBe(true); expect(preview.mode).toBe('preview'); expect(preview.warnings.some((item: { code: string }) => item.code === 'example-profile')).toBe(true);
  });
  it('accepts a structurally complete local fixture without claiming a deployment or verifying identity', () => {
    const input = structuredClone(sample);
    input.profile = { isExample: false, aiIndex: false, name: { zh: 'Configured Owner' }, role: { zh: 'Configured role' }, headline: { zh: 'Documented work' }, summary: { zh: 'Public project notes.' }, bio: { zh: 'Supported public work is recorded here.' }, location: { zh: '' }, email: 'owner@fixture-portfolio.dev', github: null, skills: [] };
    const { content } = loadPublicConfig(root, input);
    const report = publicationReport(root, content, { siteUrl: 'https://fixture-portfolio.dev', deployment: 'static' });
    expect(report.errors).toEqual([]); expect(report.warnings).toEqual([]); expect(report.scope).toContain('no deployment');
  });
  it.each(['http://localhost:3000', 'https://example.org', 'https://user:secret@real-domain.dev', 'https://real-domain.dev/path', 'javascript:alert(1)'])('rejects a non-release origin without printing secrets: %s', siteUrl => {
    const report = publicationReport(root, portfolio, { siteUrl });
    expect(report.errors.some((item: { code: string }) => ['local-site-url', 'invalid-site-url'].includes(item.code))).toBe(true);
    expect(JSON.stringify(report)).not.toContain('user:secret');
  });
  it('reports missing translations and empty enabled pages without creating fake translations', () => {
    const content = loadPublicConfig(root).content; delete content.posts[0].translations.zh;
    const report = publicationReport(root, content, { siteUrl: 'https://fixture-portfolio.dev', preview: true });
    expect(report.warnings.some((item: { field: string }) => item.field === `posts.${content.posts[0].slug}.translations.zh`)).toBe(true);
    expect(report.warnings.some((item: { field: string }) => item.field === 'site.pages.contributions')).toBe(true);
  });
  it('reports missing local media, unavailable internal links and unsupported paid deployment targets', () => {
    const content = loadPublicConfig(root).content; content.projects[0].cover.src = '/missing-setup-test.png';
    const report = publicationReport(root, content, { siteUrl: 'https://fixture-portfolio.dev', deployment: 'serverless' });
    expect(report.errors.some((item: { code: string; message: string }) => item.code === 'invalid-content' && item.message.includes('cover.src'))).toBe(true);
    expect(report.errors.some((item: { code: string }) => item.code === 'unsupported-deployment')).toBe(true);
  });
});

describe('review, apply and restore', () => {
  it('never overwrites drafts, backs up before apply, validates references before writing and restores the original', () => {
    const before = readFileSync(path.join(root, 'src/config/customization.json'), 'utf8');
    const directory = createPreview(root, { version: 1 });
    const draft = writeDraft(directory, sample, '.cache/review.json');
    expect(readCustomization(draft).profile?.isExample).toBe(true);
    expect(() => writeDraft(directory, sample, '.cache/review.json')).toThrow();
    const result = applyDraft(directory, sample);
    expect(existsSync(result.backup!)).toBe(true); expect(loadPublicConfig(directory).content.site.enabledLocales).toEqual(['zh']);
    const invalid = structuredClone(sample); invalid.site.home.modules = [{ type: 'projects', enabled: true, featured: ['missing-project'] }]; invalid.content.hideStarterContent = false;
    const saved = readFileSync(result.target, 'utf8');
    expect(() => applyDraft(directory, invalid)).toThrow(/unknown project/); expect(readFileSync(result.target, 'utf8')).toBe(saved);
    applyDraft(directory, readCustomization(result.backup!));
    expect(JSON.parse(readFileSync(result.target, 'utf8'))).toEqual({ version: 1 });
    expect(readFileSync(path.join(root, 'src/config/customization.json'), 'utf8')).toBe(before);
    expect(existsSync(path.join(directory, '.git'))).toBe(false); expect(existsSync(path.join(directory, '.env.local'))).toBe(false);
  });
});
