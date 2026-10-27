import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: { static: { type: 'string', default: 'http://127.0.0.1:3300' }, setup: { type: 'string', default: 'http://127.0.0.1:3200' } } });
const root = process.cwd(); const output = path.join(root, '.cache/setup/browser-verification'); mkdirSync(output, { recursive: true });
const before = readFileSync(path.join(root, 'src/config/customization.json'), 'utf8');
let assertions = 0;
const check = (condition, message) => { assert(condition, message); assertions++; };
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${values.setup}/zh`);
  check(await page.locator('html').getAttribute('data-preset') === 'engineering', 'Generated theme is applied');
  check((await page.locator('header .brand').innerText()).includes('示例工作室'), 'Generated public brand is applied');
  check((await page.locator('main').innerText()).includes('虚构'), 'Example identity stays labelled');
  check(await page.locator('nav a.language').count() === 0, 'Single-language setup hides the switch');
  check((await fetch(`${values.setup}/en`)).status === 404, 'Disabled setup language returns 404');
  check((await fetch(`${values.setup}/zh/projects/ai-portfolio-kit`)).status === 404, 'Hidden starter project is not publicly accessible');
  check((await fetch(`${values.setup}/api/ask`, { method: 'POST' })).status === 404, 'Disabled assistant has no API');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Setup preview fits the viewport');
    await page.screenshot({ path: path.join(output, `setup-${width}.png`), fullPage: true });
  }
  const requests = []; page.on('request', request => { if (request.method() === 'POST' || request.url().includes('/api/ask')) requests.push(request.url()); });
  await page.goto(values.static); await page.waitForURL(/\/zh\/$/);
  check(await page.locator('html').getAttribute('lang') === 'zh-CN', 'Static root opens the configured language');
  for (const locale of ['en', 'zh']) for (const route of ['', '/resume/', '/projects/', '/blog/', '/contributions/', '/ask/']) {
    await page.goto(`${values.static}/${locale}${route || '/'}`);
    check(await page.locator('main h1').isVisible(), 'Static public page renders');
  }
  await page.goto(`${values.static}/en/ask/`);
  check((await page.locator('.privacy-note').innerText()).includes('not sent'), 'Static search explains browser-local privacy');
  await page.getByLabel('Your question').fill('technology stack');
  await page.getByRole('button', { name: 'Find sources' }).click();
  await page.locator('blockquote').first().waitFor();
  check((await page.locator('blockquote').first().innerText()).includes('Next.js'), 'Static source search returns original excerpts');
  await page.locator('blockquote a').first().click(); await page.waitForURL(/\/en\/projects\/ai-portfolio-kit\/?$/);
  check(await page.locator('main h1').innerText() === 'AI Portfolio Kit', 'Static citation navigation works');
  await page.goto(`${values.static}/en/ask/`);
  await page.getByLabel('Your question').fill('salary bank passport address'); await page.getByRole('button', { name: 'Find sources' }).click();
  check((await page.locator('.answer-region').innerText()).includes('No authorized'), 'Static unknown questions stay unknown');
  check(requests.length === 0, 'Static questions make no POST or API requests');
  check((await fetch(`${values.static}/api/ask`)).status === 404, 'Static artifact does not expose a server API');
  await page.goto(`${values.static}/zh/ask/`);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Static preview fits the viewport');
    await page.screenshot({ path: path.join(output, `static-${width}.png`), fullPage: true });
  }
  check(errors.length === 0, `No browser exceptions: ${errors.join('; ')}`);
  check(readFileSync(path.join(root, 'src/config/customization.json'), 'utf8') === before, 'Live setup settings are unchanged');
  console.log(JSON.stringify({ result: 'passed', assertions, directory: output }));
} finally { await browser.close(); }
