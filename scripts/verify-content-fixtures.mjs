import { cpSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, renameSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const original = process.cwd();
const root = path.join(original, '.cache', `content-fixtures-${Date.now()}`);
mkdirSync(root, { recursive: true });
let assertions = 0;
const check = (condition, message) => { assert(condition, message); assertions++; };
async function run(args, options) {
  const child = spawn(process.execPath, args, { ...options, stdio: 'pipe' });
  let output = '';
  child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { output += data; });
  await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(output))); });
}
const browser = await chromium.launch();
try {
  for (const [index, variant] of ['en-only', 'zh-only', 'partial'].entries()) {
    const directory = path.join(root, variant); mkdirSync(directory);
    for (const file of ['src', 'public', 'scripts', 'next.config.mjs', 'tsconfig.json', 'postcss.config.mjs', 'package.json', 'package-lock.json']) cpSync(path.join(original, file), path.join(directory, file), { recursive: true });
    symlinkSync(path.join(original, 'node_modules'), path.join(directory, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    const save = (file, body) => writeFileSync(path.join(directory, file), body);
    const locale = variant === 'zh-only' ? 'zh' : 'en';
    const enabled = variant === 'partial' ? ['en', 'zh'] : [locale];
    save('src/config/site-default.ts', readFileSync(path.join(directory, 'src/config/site.ts')));
    save('src/config/site.ts', `export * from './site-default';
import { site as base, type SiteConfig } from './site-default';
export const site: SiteConfig = { ...base, enabledLocales: ${JSON.stringify(enabled)}, defaultLocale: '${locale}', missingTranslation: 'fallback' };`);
    save('src/config/profile-default.ts', readFileSync(path.join(directory, 'src/config/profile.ts')));
    save('src/config/profile.ts', `import { profile as base } from './profile-default';
// Fictional test fixture only; this copy is never published.
export const profile = { ...base, isExample: false };`);
    if (variant === 'partial') {
      for (const [slug, language] of [['evidence-first-ai', 'en'], ['own-your-kit', 'zh']]) {
        const file = `src/content/posts/${slug}.json`;
        const record = JSON.parse(readFileSync(path.join(directory, file), 'utf8'));
        record.translations = { [language]: record.translations[language] };
        // Keep the other file registered as a draft, so no unregistered MDX is left behind.
        const omitted = language === 'en' ? 'zh' : 'en';
        const draftSlug = `unused-${slug}`;
        save(`src/content/posts/${draftSlug}.json`, JSON.stringify({ ...record, slug: draftSlug, status: 'draft', translations: { [omitted]: { title: 'Draft marker', excerpt: 'Draft excerpt' } } }));
        // The original untranslated file is renamed only within the owned fixture.
        renameSync(path.join(directory, `src/content/posts/${slug}.${omitted}.mdx`), path.join(directory, `src/content/posts/${draftSlug}.${omitted}.mdx`));
        save(file, JSON.stringify(record));
      }
    }
    const example = { slug: 'private-draft', status: 'draft', date: '2026-10-27', tags: [], translations: { [locale]: { title: 'DRAFT-SECRET-MARKER', excerpt: 'DRAFT-SECRET-MARKER' } } };
    save('src/content/posts/private-draft.json', JSON.stringify(example));
    // Deliberately invalid MDX: a build succeeds only if draft code is not imported.
    save(`src/content/posts/private-draft.${locale}.mdx`, '<NeverCompile {');
    save('src/content/posts/preview-example.json', JSON.stringify({ ...example, slug: 'preview-example', status: 'example', translations: { [locale]: { title: 'EXAMPLE-ONLY-MARKER', excerpt: 'EXAMPLE-ONLY-MARKER' } } }));
    save(`src/content/posts/preview-example.${locale}.mdx`, '## EXAMPLE-ONLY-MARKER');
    const env = { ...process.env, OPENAI_API_KEY: '', NEXT_TELEMETRY_DISABLED: '1', SITE_URL: 'https://fixture.example', AI_RATE_LIMIT_DIR: path.join(directory, '.qa') };
    console.log(`Building content fixture: ${variant}`);
    const nextBin = path.join(original, 'node_modules/next/dist/bin/next');
    await run([nextBin, 'build', '--webpack'], { cwd: directory, env });
    const port = 3121 + index; const origin = `http://127.0.0.1:${port}`;
    const server = spawn(process.execPath, [nextBin, 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: directory, env, stdio: 'pipe' });
    let output = ''; server.stdout.on('data', data => { output += data; }); server.stderr.on('data', data => { output += data; });
    try {
      let ready = false;
      for (let attempt = 0; attempt < 80; attempt++) {
        if (server.exitCode !== null) throw new Error(output);
        try { if ((await fetch(`${origin}/${locale}`)).ok) { ready = true; break; } } catch { /* starting */ }
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      check(ready, 'Production fixture is ready');
      const redirect = await fetch(origin, { redirect: 'manual' });
      check(redirect.headers.get('location') === `/${locale}`, 'Configured root redirect');
      const xml = await (await fetch(`${origin}/sitemap.xml`)).text();
      check(!/private-draft|preview-example|unused-/.test(xml), 'Drafts and examples are absent from sitemap');
      const page = await browser.newPage();
      try {
        await page.goto(`${origin}/${locale}/blog`);
        check(await page.locator('main h1').isVisible(), 'Article list renders');
        check(!/DRAFT-SECRET-MARKER|EXAMPLE-ONLY-MARKER/.test(await page.locator('main').innerText()), 'Draft and example titles are absent from search');
        for (const slug of ['private-draft', 'preview-example']) check((await fetch(`${origin}/${locale}/blog/${slug}`)).status === 404, `${slug} is inaccessible`);
        if (variant === 'partial') {
          check(!xml.includes('https://fixture.example/zh/blog/evidence-first-ai'), 'Sitemap does not invent a Chinese translation');
          check(!xml.includes('https://fixture.example/en/blog/own-your-kit'), 'Sitemap does not invent an English translation');
          await page.goto(`${origin}/en/blog/evidence-first-ai`);
          const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
          check(canonical === 'https://fixture.example/en/blog/evidence-first-ai', 'Metadata canonical matches original');
          check(await page.locator('link[hreflang="zh"]').count() === 0, 'Metadata excludes missing translation');
          await page.locator('nav a.language').click();
          check(new URL(page.url()).pathname === '/zh/blog', 'Language switch falls back to available article list');
          check(await page.locator('a[href="/en/blog/evidence-first-ai"]').count() > 0, 'Fallback list links to English original');
          await page.goto(`${origin}/zh/blog/evidence-first-ai`);
          await page.waitForURL(`${origin}/en/blog/evidence-first-ai`);
          check(new URL(page.url()).pathname === '/en/blog/evidence-first-ai', 'Missing translation navigates to default original (HTTP or streamed redirect)');
          await page.goto(`${origin}/zh/blog`);
          check((await fetch(`${origin}/en/blog/own-your-kit`)).status === 404, 'Missing default translation returns 404');
          await page.getByRole('searchbox').fill('DRAFT-SECRET-MARKER');
          check(await page.locator('.reading-list article').count() === 0, 'Draft cannot be found through browser search');
        } else {
          const disabled = locale === 'en' ? 'zh' : 'en';
          check(await page.locator('nav a.language').count() === 0, 'Single-language header has no switch');
          check(!xml.includes(`https://fixture.example/${disabled}`), 'No disabled-language sitemap entry or alternate');
          for (const route of ['', '/blog', '/blog/evidence-first-ai', '/projects/ai-portfolio-kit', '/ask']) check((await fetch(`${origin}/${disabled}${route}`)).status === 404, 'Disabled-language route returns 404');
          const api = await fetch(`${origin}/api/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: 'What is the technology stack?', locale: disabled }) });
          check(api.status === 400, 'API rejects disabled language');
        }
        await page.goto(`${origin}/${locale}/blog`);
        for (const [width, height] of [[1440, 1000], [390, 844]]) {
          await page.setViewportSize({ width, height });
          check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
          await page.screenshot({ path: path.join(root, `${variant}-${width}.png`), fullPage: true });
        }
      } finally { await page.close(); }
      console.log(`Content fixture passed: ${variant}`);
    } finally {
      server.kill();
      await new Promise(resolve => { if (server.exitCode !== null) resolve(); else server.once('exit', resolve); });
    }
  }
} finally { await browser.close(); }
console.log(JSON.stringify({ result: 'passed', assertions, directory: root }));
