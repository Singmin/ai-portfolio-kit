import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import { createPreview, readCustomization } from './setup-io.mjs';
import { loadPublicConfig } from './load-public-config.mjs';
import { publicationReport } from './publication-report.mjs';

try {
  const { values } = parseArgs({ options: { file: { type: 'string' }, origin: { type: 'string' }, preview: { type: 'boolean' }, help: { type: 'boolean' } } });
  if (values.help) console.log('npm run build:static -- [--file public-settings.json] [--origin https://site-origin] [--preview]\nBuilds an isolated static artifact with browser-only source search. No server API or paid AI.');
  else {
    const original = process.cwd();
    const settings = readCustomization(values.file || path.join(original, 'src/config/customization.json'));
    const directory = createPreview(original, settings);
    const { content, siteUrl } = loadPublicConfig(directory);
    const origin = values.origin || siteUrl;
    const report = publicationReport(directory, content, { siteUrl: origin, preview: !!values.preview, deployment: 'static' });
    if (!report.passed) throw new Error(report.errors.map(issue => `${issue.field}: ${issue.message}`).join('\n'));
    const api = path.resolve(directory, 'src/app/api');
    if (!api.startsWith(directory + path.sep) || (existsSync(api) && lstatSync(api).isSymbolicLink())) throw new Error('static export: unsafe API staging path');
    rmSync(api, { recursive: true, force: true });
    rmSync(path.join(directory, 'src/app/page.tsx'), { force: true });
    for (const file of ['src/app/[locale]/layout.tsx', 'src/app/[locale]/projects/[slug]/page.tsx', 'src/app/[locale]/blog/[slug]/page.tsx']) {
      const target = path.join(directory, file);
      writeFileSync(target, 'export const dynamicParams = false;\n' + readFileSync(target, 'utf8'));
    }
    for (const file of ['src/app/robots.ts', 'src/app/sitemap.ts']) {
      const target = path.join(directory, file);
      writeFileSync(target, "export const dynamic = 'force-static';\n" + readFileSync(target, 'utf8'));
    }
    const child = spawn(process.execPath, [path.join(original, 'node_modules/next/dist/bin/next'), 'build', '--webpack'], {
      cwd: directory, stdio: 'pipe', env: { ...process.env, OPENAI_API_KEY: '', OPENAI_MODEL: '', PORTFOLIO_STATIC_EXPORT: '1', NEXT_TELEMETRY_DISABLED: '1', SITE_URL: origin || '' },
    });
    let output = '';
    child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { output += data; });
    await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(output.slice(-14000)))); });
    const destination = `/${content.site.defaultLocale}/`;
    writeFileSync(path.join(directory, 'out/index.html'), `<!doctype html><html lang="${content.site.defaultLocale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="${content.profile.isExample ? 'noindex,nofollow' : 'index,follow'}"><meta http-equiv="refresh" content="0;url=${destination}"><title>Portfolio</title></head><body><a href="${destination}">Open portfolio / 打开作品集</a></body></html>`);
    const artifact = path.join(original, '.cache/static', path.basename(directory)); mkdirSync(artifact, { recursive: true });
    cpSync(path.join(directory, 'out'), path.join(artifact, 'dist'), { recursive: true });
    writeFileSync(path.join(artifact, 'readiness.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ result: 'passed', directory: artifact, staticDirectory: path.join(artifact, 'dist'), sourceDirectory: directory, warnings: report.warnings.length, mode: report.mode, origin: origin || null }));
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
