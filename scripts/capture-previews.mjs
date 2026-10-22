import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
// Run against the locally built kit. These are real UI captures, not mockups.
mkdirSync('public/previews', { recursive:true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport:{ width:1000, height:750 }, reducedMotion:'reduce' });
  for(const name of ['resume','projects','blog','contributions']) {
    await page.goto(`http://127.0.0.1:3000/en/${name}`, { waitUntil:'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path:`public/previews/${name}.png` });
  }
} finally { await browser.close(); }
