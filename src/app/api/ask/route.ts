import { portfolio } from '@/lib/portfolio';
import { answerQuestion } from '@/lib/qa/answer';
import { consumeLimits, clientKey } from '@/lib/qa/rate-limit';
import { checkRequest, readQuestion, RequestError } from '@/lib/qa/request';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
export async function POST(request: Request) {
  if (!portfolio.enabled('ask')) return Response.json({ error: 'Not found.' }, { status: 404, headers });
  try {
    checkRequest(request);
    const budget = await consumeLimits([
      { key: `client:${clientKey(request.headers)}`, limit: 10, windowMs: 60_000 },
      { key: 'global:requests', limit: 60, windowMs: 60_000 },
    ]);
    if (!budget.allowed) return Response.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429, headers: { ...headers, 'Retry-After': String(budget.retryAfter) } });
    const { question, locale } = await readQuestion(request);
    if (!portfolio.site.enabledLocales.includes(locale)) return Response.json({ error: 'Language is not enabled.' }, { status: 400, headers });
    const answer = await answerQuestion(question, locale, {
      apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL,
      reserveModelCall: async () => (await consumeLimits([{ key: 'global:model', limit: 60, windowMs: 3_600_000 }])).allowed,
    });
    return Response.json(answer, { headers });
  } catch (error) {
    if (error instanceof RequestError) return Response.json({ error: error.message }, { status: error.status, headers });
    return Response.json({ error: 'The service is temporarily unavailable. Browse the public pages or try again later.' }, { status: 503, headers });
  }
}
