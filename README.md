# AI Portfolio Kit

A bilingual personal portfolio **and** a reusable open-source starter. Built from scratch with Next.js App Router, TypeScript, Tailwind CSS, and local MDX. No private project files or commit history are used.

一个中英双语个人作品集，也是一份可复用的开源模板。所有个人资料为明确标注的示例；项目案例对应本仓库，不虚构工作经历、指标或社区贡献。

## Run locally / 本地运行

Use Node.js **24 LTS**, npm, and Git. On this Windows machine `run.ps1` automatically uses the bundled Node 24 runtime when the system Node is older.

```powershell
cd C:\Users\Singmin\Desktop\code\ai-portfolio-kit
npm ci
npm run dev
```

On this machine you can also run `powershell -ExecutionPolicy Bypass -File .\run.ps1 dev`. Use `run.ps1 ci` to install with the same runtime. The helper changes no global settings.

Open http://localhost:3000 (redirects to `/zh`); English: http://localhost:3000/en. The server binds only to loopback. No environment file or API key is needed for the default public-source search.

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run start
```

`build` uses webpack for predictable MDX compilation. `package-lock.json` locks the installed versions; use `npm ci` for reproduction. Typecheck works before or after a build. E2E tests start a production server when port 3000 is free.

## What is included

- `/en` and `/zh`: responsive editorial home; language switch preserves page/article.
- `resume`: configuration-driven profile, skills, experience, education, projects; printable / save-as-PDF layout.
- `projects` and `projects/ai-portfolio-kit`: problem, decisions, result, honest local-only status.
- `blog` and two bilingual MDX articles: local search, readable article layouts, shared slugs.
- `contributions`: actual public contribution records; starts empty with a truthful empty state.
- `ask` and `POST /api/ask`: bilingual public-source search, optional AI-assisted selection, citations, rate limits, graceful fallback.
- Accessible labels, skip link, focus states, reduced motion, mobile layouts, security headers, robots and sitemap.
- MIT license, contribution guide, security guidance, CI, unit/API tests, browser tests.

## Make it yours / 定制

| File | Edit |
| --- | --- |
| `src/config/profile.ts` | Public identity, biography, contact links, skills, experience, education. Replace sample data before setting `isExample: false`. |
| `src/config/projects.ts` | Case studies and real repository/demo URLs. Keep unsupported URLs null. |
| `src/config/contributions.ts` | Verified public PR URLs and their actual status. |
| `src/content/posts/*.mdx` | Trusted local English and Chinese writing. |
| `src/content/posts.ts` | Register both language versions under one shared slug. |
| `src/lib/qa/public-sources.ts` | Explicit public Q&A allowlist; make each excerpt visible at its linked page. |

No personal documents are read automatically. Updating a blog post does **not** silently add it to the AI index; deliberately update the allowlist too. The initial name, location, and bio are examples because no publishable personal profile was supplied. The example profile is marked `noindex`, and the sitemap stays empty until a real profile and `SITE_URL` are configured.

## Optional AI / 可选 AI

Copy `.env.example` to `.env.local`, then set server-only `OPENAI_API_KEY`, `OPENAI_MODEL`, and the actual `SITE_URL`. Restart the server. Do not use a `NEXT_PUBLIC_` key. The example model can be replaced with a Responses API model supporting strict JSON-schema output that your account can access.

The model **only selects IDs** from at most three pre-retrieved public passages. The server validates every ID, discards all generated prose, and returns original excerpts with canonical local links. It uses no tools, URL fetching, private-file access, or arbitrary MDX execution. Requests use `store: false`, an 8-second timeout, and a 160-token output cap. This deliberately offers constrained source selection rather than free-form generated personal claims. It cannot guarantee relevance, and keyword matching can miss paraphrases.

- Missing key/model → `mode: offline`, no external request.
- Provider failure, timeout, refusal, invalid output, or exhausted model budget → `mode: fallback`, same public-source excerpts.
- No relevant evidence → an explicit unknown answer, no provider call.
- Questions are not logged or saved by this app. Optional AI sends the question and candidate public passages to OpenAI; provider retention policies still apply.

API: JSON `{ "question": "What is the technology stack?", "locale": "en" }`. Maximum 500 characters, 4 KiB request body, strict schema. HTML is rendered as plain text, never injected.

## Rate limits and hosting boundary

The default file-backed limiter persists across restarts and serializes local Node workers using an atomic directory lock. It allows **10 requests per minute per trusted client identity**, **60 total requests per minute**, and **60 model calls per hour globally**. By default, proxy headers are ignored and visitors share one conservative client bucket. Enable `TRUST_PROXY=true` only behind a proxy that overwrites `x-forwarded-for`.

`AI_RATE_LIMIT_DIR` must point to writable persistent storage on **one machine**. Use `npm run start` on a persistent Node host for this first version. An unavailable/corrupt/locked store returns a generic 503 and does not call the provider. A crash while holding the lock requires the operator to stop the server, inspect `.cache/qa`, remove the empty `lock` directory, and restart. Never remove a live worker's lock.

For multi-host/serverless production, implement and test an atomic shared Redis/KV limiter before enabling paid AI. Ephemeral files or per-instance memory are insufficient. Do not advertise this local limiter as a distributed abuse control. Normal same-origin browser requests are accepted; foreign origins are rejected. CLI clients may omit Origin; rate limits still apply.

## Architecture

Server Components read typed public configuration; MDX is compiled from fixed local imports at build time. Only the search box, language navigation, print action, and question form need client code. The Q&A route runs in Node, validates input, reserves a durable budget, retrieves allowlisted sources, optionally selects IDs via the OpenAI Responses API, and returns bounded public excerpts. Credentials and limiter code are imported only by server code. There is no database or vector service dependency.

## Open source

This is an independent local Git repository with no remote configured. Add your own public origin when you choose to publish. Review configuration and licensing first. Code and sample content use MIT; bundled Imbue and Albert Sans fonts use SIL OFL (licenses in `public/fonts`). Preview images are real screenshots of this kit, generated by `node scripts/capture-previews.mjs` with the local server running.

Fonts are bundled from the OFL-licensed Fontsource packages. To refresh them after a deliberate package update, run `node scripts/prepare-fonts.mjs`; no external font request is made by a visitor or build.

See `CONTRIBUTING.md`, `SECURITY.md`, and `docs/verification.md` for the contribution workflow, boundaries, and actual verification results.
