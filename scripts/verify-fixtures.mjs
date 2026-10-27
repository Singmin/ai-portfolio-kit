import { cpSync, mkdirSync, readFileSync, writeFileSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

// Build isolated copies: never edit live configuration or stop the user's server.
const original = process.cwd();
const nextBin = path.join(original, 'node_modules/next/dist/bin/next');
const root = path.join(original, '.cache', `fixture-${Date.now()}`);
mkdirSync(root, { recursive: true });
const text = value => ({ en: value, zh: value });
let assertions = 0;
function check(condition, message) { assert(condition, message); assertions++; }
async function run(command, args, options) {
  const child = spawn(command, args, { ...options, stdio: 'pipe' });
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(output))); });
}
for (const [index, variant] of ['alternate', 'empty-disabled'].entries()) {
  const directory = path.join(root, variant);
  mkdirSync(directory);
  for (const file of ['src', 'public', 'scripts', 'next.config.mjs', 'tsconfig.json', 'postcss.config.mjs', 'package.json', 'package-lock.json']) cpSync(path.join(original, file), path.join(directory, file), { recursive: true });
  symlinkSync(path.join(original, 'node_modules'), path.join(directory, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  const save = (file, body) => writeFileSync(path.join(directory, file), body);
  save('src/config/site-default.ts', readFileSync(path.join(directory, 'src/config/site.ts')));
  const disabled = variant === 'empty-disabled';
  const pages = { resume: !disabled, projects: !disabled, blog: false, contributions: false, ask: false };
  save('src/config/site.ts', `export * from './site-default';
import { site as base, type SiteConfig } from './site-default';
export const site: SiteConfig = { ...base, brand: ${JSON.stringify(text('Sample Studio'))}, defaultLocale: 'en', template: { name: 'Example Starter', repository: null },
footer: {wordmark: 'SAMPLE', statement: ${JSON.stringify(text('Illustrative example only'))}, signature: ${JSON.stringify(text('Sample signature'))}, showTemplateCredit: false},
appearance: {preset: '${disabled ? 'resume' : 'engineering'}', motion: 'reduced', allowSwitching: false},
pages: ${JSON.stringify(pages)}, home: {modules: [{type:'projects', enabled:true, featured:${disabled ? '[]' : "['sample-two','sample-one']"}, limit:2}, {type:'about', enabled:true}, {type:'posts', enabled:true}, {type:'assistant', enabled:true}]} };
`);
  save('src/config/profile-default.ts', readFileSync(path.join(directory, 'src/config/profile.ts')));
  save('src/config/profile.ts', `import {profile as base} from './profile-default';
export const profile = {...base, isExample:${!disabled}, name:${JSON.stringify(text('Sample Author (fictional)'))}, headline:${JSON.stringify(text('Sample work'))}, summary:${JSON.stringify(text('Illustrative profile only'))}, bio:${JSON.stringify(text('A fictional example used to verify configuration replacement.'))}, location:${JSON.stringify(text('Example city'))}};`);
  save('src/config/projects-default.ts', readFileSync(path.join(directory, 'src/config/projects.ts')));
  const examples = disabled ? [] : ['sample-one', 'sample-two'].map(slug => ({ slug, name: `Example ${slug}`, status: text('Fictional example'), summary: text('Illustrative project only'), problem: text('Example problem'), decisions: text('Example decisions'), outcome: text('Example outcome without claimed results'), stack: ['TypeScript'], repository: null, demo: null, role: text('Illustrative maintainer') }));
  save('src/config/projects.ts', `export {projectSchema,mediaSchema} from './projects-default';
export type {Project,ProjectMedia} from './projects-default';
import type {Project} from './projects-default';
export const projects: Project[] = ${JSON.stringify(examples)};`);
  const env = { ...process.env, OPENAI_API_KEY: '', NEXT_TELEMETRY_DISABLED: '1', SITE_URL: 'https://fixture.example' };
  console.log(`Building isolated fixture: ${variant}`);
  await run(process.execPath, [nextBin, 'build', '--webpack'], { cwd: directory, env });
  const port = 3111 + index;
  const origin = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, [nextBin, 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: directory, env, stdio: 'pipe' });
  let serverOutput = '';
  server.stdout.on('data', data => { serverOutput += data; });
  server.stderr.on('data', data => { serverOutput += data; });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 80; attempt++) {
      if (server.exitCode !== null) throw new Error(serverOutput);
      try { if ((await fetch(origin + '/en')).ok) { ready = true; break; } } catch { /* The owned fixture server is still starting. */ }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    check(ready, 'Fixture server became ready');
    const redirect = await fetch(origin, { redirect: 'manual' });
    check(redirect.headers.get('location') === '/en', 'Configured default language');
    for (const locale of ['en', 'zh']) {
      const home = await fetch(`${origin}/${locale}`); const html = await home.text();
      check(home.status === 200, `${variant}/${locale}: home renders`);
      check(html.includes(`data-preset="${disabled ? 'resume' : 'engineering'}"`) && html.includes('data-motion="reduced"'), 'Configured appearance is server rendered');
      check(!html.includes('class="appearance-controls"'), 'Locked appearance does not expose reading controls');
      check(html.includes('Sample Studio') && html.includes('Sample Author'), 'Alternate public identity renders');
      check(!/AI Portfolio Kit|ai-portfolio-kit|\/previews\//.test(html), 'No original brand, slug or media remains');
      check(!html.includes(`href="/${locale}/ask"`) && !html.includes(`href="/${locale}/blog"`), 'Disabled links are absent');
      for (const route of ['blog', 'blog/evidence-first-ai', 'contributions', 'ask', ...(disabled ? ['resume', 'projects', 'projects/ai-portfolio-kit'] : [])]) {
        check((await fetch(`${origin}/${locale}/${route}`)).status === 404, `${route}: disabled page returns HTTP 404`);
      }
      if (!disabled) {
        check(html.indexOf('Example sample-two') < html.indexOf('Example sample-one'), 'Featured project order is respected');
        const detail = await fetch(`${origin}/${locale}/projects/sample-one`); const detailHtml = await detail.text();
        check(detail.status === 200 && detailHtml.includes('Illustrative maintainer'), 'Alternate project detail and role render');
        check(!detailHtml.includes('<img') && !detailHtml.includes('https://example.org/demo'), 'No media/demo is invented');
      }
    }
    check((await fetch(origin + '/api/ask', { method: 'POST' })).status === 404, 'Disabled API returns 404 before validation');
    if (disabled) {
      const xml = await (await fetch(origin + '/sitemap.xml')).text();
      check(!/\/(projects|resume|blog|ask|contributions)(<|\/)/.test(xml), 'Disabled routes are absent from actual sitemap');
    }
    console.log(`Fixture passed: ${variant}`);
  } finally {
    server.kill();
    await new Promise(resolve => { if (server.exitCode !== null) resolve(); else server.once('exit', resolve); });
  }
}
console.log(JSON.stringify({ result: 'passed', assertions, directory: root }));
