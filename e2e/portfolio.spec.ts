import { expect, test } from '@playwright/test';
test('home, locale switch, and every principal page are usable', async ({ page }) => {
  await page.goto('/zh'); await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');
  await expect(page.getByRole('heading',{level:1})).toHaveText('用作品，讲清能力。');
  await page.getByRole('navigation').getByRole('link',{ name:'EN',exact:true }).click();
  await expect(page).toHaveURL(/\/en$/); await expect(page.locator('html')).toHaveAttribute('lang','en');
  for(const route of ['resume','projects','blog','contributions','ask']) {
    await page.goto(`/en/${route}`); await expect(page.locator('main h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
test('MDX article renders and keeps its slug when switching languages', async ({ page }) => {
  await page.goto('/en/blog/evidence-first-ai');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.getByRole('heading',{name:'Retrieval before generation'})).toBeVisible();
  await page.getByRole('navigation').getByRole('link',{ name:'中文',exact:true }).click();
  await expect(page).toHaveURL(/\/zh\/blog\/evidence-first-ai$/);
  await expect(page.getByRole('heading',{name:'先检索，再选择'})).toBeVisible();
});
test('search shows results and the empty state', async ({ page }) => {
  await page.goto('/en/blog'); await page.getByRole('searchbox').fill('no-matching-topic');
  await expect(page.getByText('No notes match that search. Try another word.')).toBeVisible();
  await page.getByRole('searchbox').fill('source'); await expect(page.getByRole('heading',{name:'Let the source do the talking'})).toBeVisible();
  await page.getByRole('searchbox').fill('talking'); await expect(page.getByRole('status')).toHaveText('1 note');
});
test('question form returns source links without credentials', async ({ page }) => {
  await page.goto('/en/ask'); await page.getByLabel('Your question').fill('What is the technology stack?');
  await page.getByRole('button',{name:'Find sources'}).click();
  await expect(page.getByRole('heading',{name:'What the sources say'})).toBeVisible();
  await expect(page.locator('blockquote').first()).toContainText('Next.js');
  await page.locator('blockquote a').first().click(); await expect(page).toHaveURL(/\/en\/projects\/ai-portfolio-kit$/);
});
test('unknown articles return 404 and resume print mode hides controls', async ({ page }) => {
  const response = await page.goto('/en/blog/no-such-note'); expect(response?.status()).toBe(404);
  await page.goto('/en/resume'); await page.emulateMedia({ media:'print' });
  await expect(page.locator('.site-header')).toBeHidden(); await expect(page.locator('.print-button')).toBeHidden();
  await expect(page.locator('main h1')).toBeVisible();
});
test('article citations match the visible original paragraph and stable anchor', async ({ page }) => {
  await page.goto('/en/ask');
  await expect(page.locator('.page-intro')).toContainText('Search authorized public passages');
  expect(await page.locator('.suggestions button').count()).toBeGreaterThan(0);
  await page.getByLabel('Your question').fill('Without an API key');
  const response = page.waitForResponse(response => response.url().endsWith('/api/ask'));
  await page.getByRole('button', { name: 'Find sources' }).click();
  const result = await (await response).json();
  expect(result.mode).toBe('offline');
  expect(result.sources[0].id).toBe('post:evidence-first-ai:retrieval');
  expect(result.sources[0].revision).toMatch(/^[a-f0-9]{16}$/);
  const quote = await page.locator('blockquote p').first().innerText();
  await page.locator('blockquote a').first().click();
  await expect(page).toHaveURL(/\/en\/blog\/evidence-first-ai#evidence-retrieval$/);
  await expect(page.locator('#evidence-retrieval')).toHaveText(quote);
});
test('mobile and desktop home contain no broken previews or overflow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const images = page.locator('.preview-gallery img'); await expect(images).toHaveCount(4);
  for(const image of await images.all()) { await image.scrollIntoViewIfNeeded(); await expect.poll(() => image.evaluate((e:HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true); }
});
