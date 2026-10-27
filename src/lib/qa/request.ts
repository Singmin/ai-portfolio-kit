import { z } from 'zod';
import { getSiteUrl } from '@/lib/site-url';
export const questionSchema = z.object({ question: z.string().trim().min(2).max(500), locale: z.enum(['en','zh']) }).strict();
export class RequestError extends Error { constructor(public status: number, message: string) { super(message); } }
export function checkRequest(request: Request) {
  // Next may normalize request.url to localhost even when the browser used
  // 127.0.0.1. Host reflects the browser-facing authority; forwarded-host is ignored.
  const publicUrl = new URL(request.url);
  const configuredUrl = getSiteUrl();
  const expected = configuredUrl ? new URL(configuredUrl).origin
    : request.headers.get('host') ? new URL(`${publicUrl.protocol}//${request.headers.get('host')}`).origin : publicUrl.origin;
  const origin = request.headers.get('origin');
  if ((origin && origin !== expected) || request.headers.get('sec-fetch-site') === 'cross-site') throw new RequestError(403, 'Cross-origin requests are not allowed.');
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) throw new RequestError(415, 'Use application/json.');
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > 4096)) throw new RequestError(413, 'Request body is too large.');
}
export async function readQuestion(request: Request) {
  if (!request.body) throw new RequestError(400, 'A JSON body is required.');
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  const timer = setTimeout(() => { void reader.cancel().catch(() => {}); }, 5000);
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length;
      if (size > 4096) { void reader.cancel(); throw new RequestError(413, 'Request body is too large.'); } chunks.push(value); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const parsed = questionSchema.safeParse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
    if (!parsed.success) throw new RequestError(400, 'Use a question of 2–500 characters and locale en or zh.');
    return parsed.data;
  } catch (error) { if (error instanceof RequestError) throw error; throw new RequestError(400, 'Invalid JSON body.'); }
  finally { clearTimeout(timer); reader.releaseLock(); }
}
