import { cpSync, mkdirSync, readFileSync, writeFileSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const original = process.cwd();
const root = path.join(original, '.cache', `evidence-fixtures-${Date.now()}`); mkdirSync(root, { recursive: true });
const nextBin = path.join(original, 'node_modules/next/dist/bin/next');
let assertions = 0;
const check = (condition, message) => { assert(condition, message); assertions++; };
async function build(directory, env) {
  const child = spawn(process.execPath, [nextBin, 'build', '--webpack'], { cwd: directory, env, stdio: 'pipe' });
  let output = ''; child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { output += data; });
  await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(output))); });
}
async function start(directory, env, port, mode = 'start') {
  // The fixture shares dependencies through a junction outside Turbopack's root.
  const server = spawn(process.execPath, [nextBin, mode, ...(mode === 'dev' ? ['--webpack'] : []), '--hostname', '127.0.0.1', '--port', String(port)], { cwd: directory, env, stdio: 'pipe' });
  let output = ''; server.stdout.on('data', data => { output += data; }); server.stderr.on('data', data => { output += data; });
  const origin = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error(output.slice(-8000));
    try { if ((await fetch(`${origin}/en/ask`)).ok) return { server, origin }; } catch { /* starting */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  server.kill(); throw new Error(`Server failed to start: ${output.slice(-8000)}`);
}
async function stop(server) {
  server.kill(); await new Promise(resolve => { if (server.exitCode !== null) resolve(); else server.once('exit', resolve); });
}
async function ask(origin, question) {
  const response = await fetch(`${origin}/api/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, locale: 'en' }) });
  check(response.status === 200, 'Offline ask endpoint succeeds'); return response.json();
}
const originalText = 'NebulaQuartz and HelioLedger describe the original public fixture scope.';
const updatedText = 'NebulaQuartz and HelioLedger describe the updated public fixture scope.';
const body = text => `<PublicExcerpt id="scope">\n\n${text}\n\n</PublicExcerpt>\n\nUNMARKEDBODYTOKEN`;
const browser = await chromium.launch();
try {
  for (const [index, variant] of ['authorized', 'revoked'].entries()) {
    const authorized = variant === 'authorized';
    const directory = path.join(root, variant); mkdirSync(directory);
    for (const file of ['src', 'public', 'scripts', 'next.config.mjs', 'tsconfig.json', 'postcss.config.mjs', 'package.json', 'package-lock.json']) cpSync(path.join(original, file), path.join(directory, file), { recursive: true });
    symlinkSync(path.join(original, 'node_modules'), path.join(directory, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    const save = (file, body) => writeFileSync(path.join(directory, file), body);
    const localized = value => ({ en: value, zh: value });
    save('src/config/site-default.ts', readFileSync(path.join(directory, 'src/config/site.ts')));
    save('src/config/site.ts', `export * from './site-default'; import {site as base} from './site-default'; export const site = {...base, defaultLocale:'en' as const};`);
    save('src/config/profile-default.ts', readFileSync(path.join(directory, 'src/config/profile.ts')));
    save('src/config/profile.ts', `import {profile as base} from './profile-default';
// Fictional verification data, isolated from the user's public configuration.
export const profile = {...base, isExample:false, aiIndex:${authorized}, bio:${JSON.stringify(localized('A fictional profile used only in this local verification.'))}, email:'sample@example.org'};`);
    save('src/config/projects-default.ts', readFileSync(path.join(directory, 'src/config/projects.ts')));
    save('src/config/projects.ts', `export {projectSchema,mediaSchema} from './projects-default'; export type {Project,ProjectMedia} from './projects-default';
import {projects as base} from './projects-default';
export const projects = [ {...base[0], aiIndex:${authorized}, role:${JSON.stringify(localized('Fixture maintainer with a documented public scope.'))}},
{...base[0], slug:'unapproved-project', aiIndex:false, summary:${JSON.stringify(localized('UNAPPROVEDPROJECTTOKEN'))}},
{...base[0], slug:'draft-project', aiIndex:true, publication:'draft' as const, summary:${JSON.stringify(localized('DRAFTPROJECTTOKEN'))}} ];`);
    save('src/config/contributions.ts', `import type {Localized} from '@/lib/i18n'; export type Contribution = {title:string;url:string;status:'open'|'closed'|'merged';summary:Localized;aiIndex?:boolean;publication?:'published'|'draft'|'example'};
export const contributions: Contribution[] = [{title:'Fixture public contribution',url:'https://example.org/pr/1',status:'open',summary:${JSON.stringify(localized('A fictional public contribution used only in local verification.'))},aiIndex:${authorized}}];`);
    for (const slug of ['evidence-first-ai', 'own-your-kit']) {
      const file = `src/content/posts/${slug}.json`; const record = JSON.parse(readFileSync(path.join(directory, file), 'utf8'));
      record.aiIndex = authorized; save(file, JSON.stringify(record));
    }
    const record = { slug: 'authorization-note', status: 'published', aiIndex: authorized, date: '2026-10-27', tags: ['Fixture'], translations: { en: { title: 'Fixture authorization record', excerpt: 'Public fixture summary.' } } };
    save('src/content/posts/authorization-note.json', JSON.stringify(record)); save('src/content/posts/authorization-note.en.mdx', body(originalText));
    save('private-fixture.txt', 'PRIVATEFILETOKEN');
    const env = { ...process.env, OPENAI_API_KEY: '', NEXT_TELEMETRY_DISABLED: '1', SITE_URL: `http://127.0.0.1:${3141 + index}`, AI_RATE_LIMIT_DIR: path.join(directory, '.qa-production') };
    console.log(`Building evidence fixture: ${variant}`); await build(directory, env);
    const { server, origin } = await start(directory, env, 3141 + index);
    const page = await browser.newPage();
    try {
      await page.goto(`${origin}/en/ask`);
      check((await fetch(`${origin}/en/projects/unapproved-project`)).ok, 'Published but unapproved project stays readable');
      check((await fetch(`${origin}/en/projects/draft-project`)).status === 404, 'Draft project has no public page');
      const result = await ask(origin, 'NebulaQuartz HelioLedger');
      if (authorized) {
        check(result.sources[0]?.excerpt === originalText, 'API excerpt is derived from the current marked paragraph');
        check(result.sources[0].url === '/en/blog/authorization-note#evidence-scope', 'Citation has a stable original-page anchor');
        check(/^[a-f0-9]{16}$/.test(result.sources[0].revision), 'Source carries a content revision');
        await page.getByLabel('Your question').fill('NebulaQuartz HelioLedger');
        await page.getByRole('button', { name: 'Find sources' }).click();
        await page.locator('blockquote a').first().click();
        await page.waitForURL(`${origin}/en/blog/authorization-note#evidence-scope`);
        check(new URL(page.url()).hash === '#evidence-scope', 'Browser follows the citation anchor');
        check((await page.locator('#evidence-scope').innerText()).trim() === originalText, 'Visible page and API quote match');
        check((await ask(origin, 'author role')).sources.some(source => source.excerpt === 'Fixture maintainer with a documented public scope.'), 'Role comes from the visible project field');
        check((await ask(origin, 'contact email')).sources.some(source => source.excerpt === 'sample@example.org'), 'Contact comes from authorized public profile');
        for (const secret of ['UNMARKEDBODYTOKEN', 'PRIVATEFILETOKEN', 'UNAPPROVEDPROJECTTOKEN']) check((await ask(origin, secret)).sources.length === 0, 'Unmarked/private/unapproved data is excluded');
      } else {
        check(result.sources.length === 0, 'Revocation removes source passages');
        check(await page.locator('.suggestions button').count() === 0, 'Revocation removes suggested questions');
        check(await page.getByRole('button', { name: 'Find sources' }).isDisabled(), 'Source-less search exposes an honest disabled state');
        check((await fetch(`${origin}/en/blog/authorization-note`)).ok, 'Revocation preserves the published original page');
        check((await ask(origin, 'technology stack')).sources.length === 0, 'No original hard-coded fallback index remains');
      }
      await page.goto(`${origin}/en/ask`);
      for (const [width, height] of [[1440, 1000], [390, 844]]) {
        await page.setViewportSize({ width, height });
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Ask layout has no horizontal overflow');
        await page.screenshot({ path: path.join(root, `${variant}-${width}.png`), fullPage: true });
      }
    } finally { await page.close(); await stop(server); }
    if (authorized) {
      console.log('Checking automatic development sync and revocation');
      const dev = await start(directory, { ...env, SITE_URL: 'http://127.0.0.1:3143', AI_RATE_LIMIT_DIR: path.join(directory, '.qa-development') }, 3143, 'dev');
      try {
        const before = (await ask(dev.origin, 'NebulaQuartz HelioLedger')).sources[0];
        save('src/content/posts/authorization-note.en.mdx', body(updatedText));
        let after;
        for (let attempt = 0; attempt < 4; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
          after = (await ask(dev.origin, 'NebulaQuartz HelioLedger')).sources[0];
          if (after?.excerpt === updatedText) break;
        }
        check(after?.excerpt === updatedText && after.id === before.id && after.revision !== before.revision, 'Body edit updates the API without manual sync, preserving ID and changing revision');
        check((await (await fetch(`${dev.origin}/en/blog/authorization-note`)).text()).includes(updatedText), 'Development page renders the same updated body');
        record.aiIndex = false; save('src/content/posts/authorization-note.json', JSON.stringify(record));
        let revoked = false;
        for (let attempt = 0; attempt < 4; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
          if ((await ask(dev.origin, 'NebulaQuartz HelioLedger')).sources.length === 0) { revoked = true; break; }
        }
        check(revoked, 'JSON permission edit revokes the API source without manual sync');
      } finally { await stop(dev.server); }
    }
    console.log(`Evidence fixture passed: ${variant}`);
  }
} finally { await browser.close(); }
console.log(JSON.stringify({ result: 'passed', assertions, directory: root }));
