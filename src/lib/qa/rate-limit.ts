import { mkdirSync, readFileSync, writeFileSync, renameSync, rmdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';
const stateSchema = z.record(z.string(), z.object({ count: z.number().int().nonnegative(), reset: z.number().finite() }));
type Rule = { key: string; limit: number; windowMs: number };
export type LimitResult = { allowed: boolean; retryAfter: number };
// Atomic directory lock serializes read/modify/write across Node workers on one disk.
// A failed/corrupt store fails closed in the route. It is NOT a multi-host limiter.
export async function consumeLimits(rules: Rule[], options: { directory?: string; now?: number } = {}): Promise<LimitResult> {
  const directory = options.directory ?? process.env.AI_RATE_LIMIT_DIR ?? path.join(process.cwd(), '.cache', 'qa');
  mkdirSync(directory, { recursive: true });
  const lock = path.join(directory, 'lock'); let acquired = false;
  for (let i = 0; i < 25; i++) {
    try { mkdirSync(lock); acquired = true; break; }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e; await new Promise(r => setTimeout(r, 8)); }
  }
  if (!acquired) throw new Error('Rate-limit store locked');
  try {
    const now = options.now ?? Date.now(); const file = path.join(directory, 'limits.json');
    const state = stateSchema.parse(existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {});
    for (const key of Object.keys(state)) if (state[key].reset <= now) delete state[key];
    if (Object.keys(state).length > 4096) throw new Error('Rate-limit store full');
    const blocked = rules.filter(r => state[r.key]?.count >= r.limit);
    if (blocked.length) return { allowed: false, retryAfter: Math.max(1, ...blocked.map(r => Math.ceil((state[r.key].reset - now) / 1000))) };
    for (const rule of rules) { state[rule.key] ??= { count: 0, reset: now + rule.windowMs }; state[rule.key].count++; }
    const temp = path.join(directory, `limits.${process.pid}.tmp`);
    writeFileSync(temp, JSON.stringify(state), { mode: 0o600 }); renameSync(temp, file);
    return { allowed: true, retryAfter: 0 };
  } finally { rmdirSync(lock); }
}
export function clientKey(headers: Headers) {
  // A caller-supplied XFF is ignored unless a trusted, overwriting proxy is configured.
  const ip = process.env.TRUST_PROXY === 'true' ? (headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'shared').slice(0,128) : 'shared';
  return createHash('sha256').update(ip).digest('hex');
}
