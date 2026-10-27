import { expect, test } from '@playwright/test';

const presets = ['editorial', 'engineering', 'resume'] as const;
const labels = { en: ['Editorial', 'Engineering', 'Resume'], zh: ['编辑式', '工程式', '履历式'] };

for (const locale of ['en', 'zh'] as const) {
  test(`${locale}: all reading styles preserve content and render responsive layouts`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}`);
    const heights: number[] = [];
    for (const [index, preset] of presets.entries()) {
      const group = page.getByRole('group', { name: locale === 'en' ? 'Reading style' : '阅读方式' });
      await group.getByRole('button', { name: labels[locale][index], exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('data-preset', preset);
      await expect(group.getByRole('button', { name: labels[locale][index], exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('main h1')).toHaveText(locale === 'en' ? 'Work, with evidence.' : '用作品，讲清能力。');
      await expect(page.locator('.preview-gallery img')).toHaveCount(4);
      if (preset === 'engineering') await expect(page.locator('.engineering-details')).toBeVisible();
      else await expect(page.locator('.engineering-details')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('.hero h1').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
      heights.push(await page.locator('.hero').evaluate(element => element.getBoundingClientRect().height));
      await page.goto(`/${locale}/projects/ai-portfolio-kit`);
      await expect(page.locator('html')).toHaveAttribute('data-preset', preset);
      await expect(page.locator('.project-evidence')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.goto(`/${locale}`);
    }
    expect(heights[2]).toBeLessThan(heights[0]);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-preset', 'resume');
    await page.getByRole('navigation').getByRole('link', { name: locale === 'en' ? '中文' : 'EN', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-preset', 'resume');
  });
}

test('reading controls support keyboard activation and print hides them in every preset', async ({ page }) => {
  await page.goto('/en/resume');
  const group = page.getByRole('group', { name: 'Reading style' });
  for (const [index, preset] of presets.entries()) {
    await page.emulateMedia({ media: 'screen' });
    const button = group.getByRole('button', { name: labels.en[index], exact: true });
    await button.focus();
    await expect(button).toBeFocused();
    expect(await button.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-preset', preset);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.appearance-bar')).toBeHidden();
    await expect(page.locator('.site-header')).toBeHidden();
    await expect(page.locator('main h1')).toBeVisible();
    expect(await page.locator('main h1').evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBe(40);
  }
});

test('storage failure and invalid saved presets do not block reading or switching', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('portfolio-reading-preset-v1', 'not-a-preset');
    Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); };
  });
  await page.goto('/en');
  await expect(page.locator('html')).toHaveAttribute('data-preset', 'editorial');
  await page.getByRole('group', { name: 'Reading style' }).getByRole('button', { name: 'Engineering', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-preset', 'engineering');
});

test('the configured default remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/en');
  await expect(page.locator('html')).toHaveAttribute('data-preset', 'editorial');
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.getByText('Enable JavaScript to switch styles.', { exact: false })).toBeVisible();
  await context.close();
});
