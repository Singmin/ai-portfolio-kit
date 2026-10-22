import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientKey, consumeLimits } from '@/lib/qa/rate-limit';
const directories: string[] = [];
function directory() { const p = mkdtempSync(path.join(os.tmpdir(),'portfolio-test-')); directories.push(p); return p; }
afterEach(() => { directories.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); vi.unstubAllEnvs(); });
describe('persistent local limiter', () => {
  it('persists counts, blocks at the boundary, and resets after expiry', async () => {
    const dir = directory(); const rules = [{ key: 'client', limit: 2, windowMs: 60000 }];
    expect((await consumeLimits(rules, { directory: dir, now: 1000 })).allowed).toBe(true);
    expect((await consumeLimits(rules, { directory: dir, now: 1001 })).allowed).toBe(true);
    expect(await consumeLimits(rules, { directory: dir, now: 1002 })).toEqual({ allowed: false, retryAfter: 60 });
    expect((await consumeLimits(rules, { directory: dir, now: 61000 })).allowed).toBe(true);
  });
  it('honors the global budget even when client identities rotate', async () => {
    const dir = directory(); const global = { key: 'global', limit: 1, windowMs: 60000 };
    await consumeLimits([global, { key: 'one', limit: 10, windowMs: 60000 }], { directory: dir });
    expect((await consumeLimits([global, { key: 'two', limit: 10, windowMs: 60000 }], { directory: dir })).allowed).toBe(false);
  });
  it('fails closed on corrupt state or a held lock', async () => {
    const dir = directory(); writeFileSync(path.join(dir,'limits.json'),'broken');
    await expect(consumeLimits([{ key: 'x', limit: 2, windowMs: 1000 }], { directory: dir })).rejects.toThrow();
    mkdirSync(path.join(dir,'lock'));
    await expect(consumeLimits([], { directory: dir })).rejects.toThrow('locked');
  });
  it('ignores spoofed proxy headers by default and hashes trusted IPs', () => {
    vi.stubEnv('TRUST_PROXY','false');
    expect(clientKey(new Headers({ 'x-forwarded-for':'1.2.3.4' }))).toBe(clientKey(new Headers()));
    vi.stubEnv('TRUST_PROXY','true');
    expect(clientKey(new Headers({ 'x-forwarded-for':'1.2.3.4, 10.0.0.1' }))).not.toContain('1.2.3.4');
    expect(clientKey(new Headers({ 'x-forwarded-for':'1.2.3.4' }))).not.toBe(clientKey(new Headers({ 'x-forwarded-for':'5.6.7.8' })));
  });
});
