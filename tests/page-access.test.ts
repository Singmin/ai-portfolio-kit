import { afterEach, describe, expect, it, vi } from 'vitest';
import { portfolio } from '@/lib/portfolio';
import { requirePage } from '@/lib/page-access';
import { POST } from '@/app/api/ask/route';
import * as limits from '@/lib/qa/rate-limit';
vi.mock('@/content/posts', () => ({ loadPost: vi.fn() }));
afterEach(() => vi.restoreAllMocks());
describe('disabled route enforcement', () => {
  it('returns a generic API 404 without consuming budgets or reading provider keys', async () => {
    vi.spyOn(portfolio, 'enabled').mockReturnValue(false);
    const budget = vi.spyOn(limits, 'consumeLimits');
    const response = await POST(new Request('http://localhost/api/ask', { method: 'POST' }));
    expect(response.status).toBe(404); expect(await response.json()).toEqual({ error: 'Not found.' });
    expect(budget).not.toHaveBeenCalled();
  });
  it('uses Next notFound for disabled page access', () => {
    vi.spyOn(portfolio, 'enabled').mockReturnValue(false);
    expect(() => requirePage('projects')).toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  });
  it('guards every list, detail and assistant page before rendering', async () => {
    vi.spyOn(portfolio, 'enabled').mockReturnValue(false);
    const pages = [
      await import('@/app/[locale]/resume/page'), await import('@/app/[locale]/projects/page'),
      await import('@/app/[locale]/projects/[slug]/page'), await import('@/app/[locale]/blog/page'),
      await import('@/app/[locale]/blog/[slug]/page'), await import('@/app/[locale]/contributions/page'), await import('@/app/[locale]/ask/page'),
    ];
    for (const page of pages) await expect(page.default({ params: Promise.resolve({ locale: 'en', slug: 'ai-portfolio-kit' }) })).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
    expect((await import('@/app/[locale]/projects/[slug]/page')).generateStaticParams()).toEqual([]);
  });
});
