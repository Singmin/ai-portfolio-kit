import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkRequest, readQuestion } from '@/lib/qa/request';
const req = (body: string, headers: Record<string,string> = {}) => new Request('http://localhost:3000/api/ask', { method: 'POST', body, headers: { 'content-type': 'application/json', ...headers } });
afterEach(() => vi.unstubAllEnvs());
describe('request validation', () => {
  it('accepts valid bilingual input and trims whitespace', async () => {
    expect(await readQuestion(req('{"question":"  技术栈是什么  ","locale":"zh"}'))).toEqual({ question: '技术栈是什么', locale: 'zh' });
  });
  it.each(['invalid', '{"question":"x","locale":"en"}', '{"question":"hello","locale":"fr"}', '{"question":"hello","locale":"en","secret":true}'])('rejects malformed or unsupported input', async body => {
    await expect(readQuestion(req(body))).rejects.toMatchObject({ status: 400 });
  });
  it('rejects chunked oversized bodies even without content-length', async () => {
    await expect(readQuestion(req(JSON.stringify({ question: '字'.repeat(2000), locale: 'zh' })))).rejects.toMatchObject({ status: 413 });
  });
  it('rejects cross-origin requests and unsupported content types', () => {
    expect(() => checkRequest(req('{}', { origin: 'https://evil.invalid' }))).toThrow('Cross-origin');
    expect(() => checkRequest(req('{}', { 'sec-fetch-site': 'cross-site' }))).toThrow('Cross-origin');
    expect(() => checkRequest(req('{}', { 'content-type': 'text/plain' }))).toThrow('application/json');
    expect(() => checkRequest(req('{}', { 'content-length': '5000' }))).toThrow('too large');
  });
  it('uses the configured origin instead of an untrusted host', () => {
    vi.stubEnv('SITE_URL','https://portfolio.example');
    expect(() => checkRequest(req('{}', { origin: 'http://localhost:3000' }))).toThrow('Cross-origin');
    expect(() => checkRequest(req('{}', { origin: 'https://portfolio.example' }))).not.toThrow();
  });
  it('accepts the browser-facing host when Next normalizes the internal URL', () => {
    vi.stubEnv('SITE_URL','');
    expect(() => checkRequest(req('{}', { host:'127.0.0.1:3000', origin:'http://127.0.0.1:3000' }))).not.toThrow();
    expect(() => checkRequest(req('{}', { host:'127.0.0.1:3000', origin:'https://evil.invalid', 'x-forwarded-host':'evil.invalid' }))).toThrow('Cross-origin');
  });
});
