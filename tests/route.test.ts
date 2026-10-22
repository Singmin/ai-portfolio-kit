import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/ask/route';
let dir: string;
beforeEach(() => { dir = mkdtempSync(path.join(os.tmpdir(),'portfolio-route-')); vi.stubEnv('AI_RATE_LIMIT_DIR',dir); vi.stubEnv('SITE_URL',''); vi.stubEnv('OPENAI_API_KEY',''); vi.stubEnv('TRUST_PROXY','false'); });
afterEach(() => { rmSync(dir, { recursive:true, force:true }); vi.unstubAllEnvs(); });
const request = (body = '{"question":"technology stack","locale":"en"}', headers = {}) => new Request('http://localhost:3000/api/ask', { method:'POST', headers:{ 'content-type':'application/json', ...headers }, body });
describe('ask route integration', () => {
  it('returns a no-store offline response with valid citations', async () => {
    const response = await POST(request()); expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('no-store');
    const answer = await response.json(); expect(answer.mode).toBe('offline'); expect(answer.sources[0].id).toBe('stack');
  });
  it('returns 429 with Retry-After and persists across requests', async () => {
    for(let i=0;i<10;i++) expect((await POST(request())).status).toBe(200);
    const response = await POST(request()); expect(response.status).toBe(429); expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
  });
  it('returns 400 for malformed JSON and 403 for foreign origins', async () => {
    expect((await POST(request('not json'))).status).toBe(400);
    expect((await POST(request('{}',{origin:'https://evil.invalid'}))).status).toBe(403);
  });
  it('returns a generic 503 if the budget cannot be verified', async () => {
    mkdirSync(path.join(dir,'lock')); writeFileSync(path.join(dir,'private-key'),'not-a-real-key');
    const response = await POST(request()); expect(response.status).toBe(503); expect(await response.text()).not.toContain(dir);
  });
});
