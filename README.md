# AI Portfolio Kit

A bilingual personal portfolio **and** a reusable open-source starter. Built from scratch with Next.js App Router, TypeScript, Tailwind CSS, and local MDX. No private project files or commit history are used.

一个中英双语个人作品集，也是一份可复用的开源模板。所有个人资料为明确标注的示例；项目案例对应本仓库，不虚构工作经历、指标或社区贡献。

## Run locally / 本地运行

Use Node.js **24 LTS**, npm, and Git. On this Windows machine `run.ps1` automatically uses the bundled Node 24 runtime when the system Node is older.

```powershell
git clone https://github.com/Singmin/ai-portfolio-kit.git
cd ai-portfolio-kit
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

`build` uses webpack for predictable MDX compilation. `package-lock.json` locks the installed versions; use `npm ci` for reproduction. Typecheck works before or after a build. E2E tests start an isolated production server on port 3100 and never reuse the live development preview.

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
| `src/config/site.ts` | Enabled/default languages, missing-translation policy, modules, pages and appearance. |
| `src/content/posts/*.json` | One record per article: status, slug, date, tags and available translated titles/excerpts. |
| `src/content/posts/<slug>.<locale>.mdx` | Trusted local article bodies; imports are generated automatically. |
| `src/lib/qa/public-sources.ts` | Builds authorized sources and suggested questions from published configuration and marked article paragraphs. |

No personal documents are read automatically. Publishing does **not** grant AI indexing permission: entries need `aiIndex: true`, and articles also need explicit `PublicExcerpt` markers around approved static prose. Excerpts come from visible content instead of separately copied text. The initial name, location, and bio are examples because no publishable personal profile was supplied; the example identity is never indexed. The example profile is marked `noindex`, and the sitemap stays empty until a real profile and `SITE_URL` are configured.

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

Server Components read typed public configuration; MDX is compiled from fixed local imports at build time. Only the search box, language navigation, print action, and question form need client code. Validated site configuration drives module visibility, page access, navigation, sitemap entries, and public Q&A references. The Q&A route runs in Node, validates input, reserves a durable budget, retrieves allowlisted sources, optionally selects IDs via the OpenAI Responses API, and returns bounded public excerpts. Credentials and limiter code are imported only by server code. There is no database or vector service dependency.

## Open source

The template repository is published at https://github.com/Singmin/ai-portfolio-kit. Fork or create your own copy and configure its public identity before publication. Review configuration and licensing first. Code and sample content use MIT; bundled Imbue and Albert Sans fonts use SIL OFL (licenses in `public/fonts`). Preview images are real screenshots of this kit, generated by `node scripts/capture-previews.mjs` with the local server running.

Fonts are bundled from the OFL-licensed Fontsource packages. To refresh them after a deliberate package update, run `node scripts/prepare-fonts.mjs`; no external font request is made by a visitor or build.

See `CONTRIBUTING.md`, `SECURITY.md`, and `docs/verification.md` for the contribution workflow, boundaries, and actual verification results.

## Development roadmap / 开发路线

See [产品与开发路线](docs/ROADMAP.md) for the current product gaps, prioritized tasks, acceptance criteria, and continuation notes.

## Configurable template (P0)

See [配置与迁移指南](docs/configuration-p0.md) for site branding, independent page/module switches, module ordering, featured projects, optional case-study media/roles/metrics/evidence, and migration from the initial kit. New fields are optional and existing project fields remain supported. Empty content hides home modules/navigation; enabled empty list pages remain directly accessible. Disabled pages and details return 404 and disappear from sitemap/Q&A; disabling the assistant also disables its API.

Content validation rejects duplicate project/post slugs, module types and navigation items, missing featured projects, invalid local media and non-HTTP evidence URLs. Default module list limits are 3. Update featured references when removing a project.

`npm run test:fixtures` builds isolated copies with clearly fictional replacement data and checks actual HTTP behavior on ports 3111/3112. It never changes the live configuration. Results for this implementation are recorded in [P0 verification](docs/verification-p0.md); earlier verification records remain historical.

## Reading styles (P1)

The header's reading-style controls switch the same public content between editorial, engineering and resume layouts, and remember the choice in the current browser. Configure the server default, optional palette/type/density/media/motion overrides, or a locked layout in `site.appearance`. The original editorial layout remains the default. All presets support both languages, keyboard controls, reduced motion and a shared print layout.

See [三套视觉预设与配置](docs/appearance-p1.md) for configuration and migration, and [P1-01 verification](docs/verification-p1-01.md) for the checks performed locally. This is a local implementation; it does not imply the remote repository or a deployed site has been updated.

## Content and languages (P1-02)

Register each article once in `src/content/posts/<slug>.json`, with trusted bodies in `<slug>.en.mdx` and/or `<slug>.zh.mdx`. Development startup and builds generate the shared metadata and lazy imports; the dev server now watches post records and bodies automatically. `npm run content:sync` remains available for manual generation. Drafts have no public entries or compiled MDX imports; examples appear only in the labelled template preview. Published articles still require separate explicit approval for AI indexing.

Configure `site.enabledLocales`, `site.defaultLocale` and `site.missingTranslation` for a Chinese-only, English-only or bilingual site. Missing articles can be hidden or linked to their default-language original; navigation, search, language switching and sitemap all use the available content. See [内容与语言配置](docs/content-p1.md) for the exact behavior, build validation and migration, and [P1-02 verification](docs/verification-p1-02.md) for local evidence. `npm run test:content-fixtures` verifies production builds and browser behavior in isolated copies.

## Authorized source search (P1-03)

Source search uses published, explicitly authorized content. Add `aiIndex: true` to approved projects, contributions or a real profile; it defaults to off. For articles, also wrap approved static paragraphs in `<PublicExcerpt id="stable-id">` and keep `status: "published"`. The generated source has a stable ID, a visible page link and a revision that changes with the content. Revoking indexing keeps the public page readable; drafts, examples, disabled pages and missing translations cannot become model sources.

Suggestions follow the actual authorized skills, roles, contributions, contact channels and articles. Optional AI selects up to three retrieved source IDs; the server still returns original excerpts, including when AI is absent or fails. No general chat, invented personal facts, private-file crawling or automatic training is added.

See [来源授权与迁移](docs/evidence-p1.md) and [P1-03 verification](docs/verification-p1-03.md). `npm run test:evidence-fixtures` builds isolated authorized/revoked sites and checks browser citations, API boundaries and development auto-sync. Production source or permission changes require rebuilding and restarting/redeploying the site.

## Setup and publication (P2)

Run `npm run setup` in a terminal to prepare public identity, languages, preset and module order. It writes a reviewable draft, then `npm run setup:preview -- --file <draft.json>` opens an isolated local preview. Apply with `npm run setup -- --apply --input <reviewed.json>`; the existing settings are backed up first. The current starter identity is preserved until you deliberately replace it.

`npm run publish:check` reads the same real configuration and reports field-level errors/warnings without building or publishing. `--json` supports automation, `--strict` also fails warnings, and explicit `--preview` permits labelled template samples without certifying a real personal-site release. `SITE_URL` overrides `customization.json`'s public `seo.url`.

Three complete, explicitly labelled examples live in `examples/setup/`: Chinese engineering, English resume with fictional layout records, and bilingual editorial retaining the real Kit project/docs. See [初始化与检查](docs/setup-p2.md), [部署、升级与排错](docs/deployment-p2.md), and [P2 verification](docs/verification-p2.md).

For static hosting/Sites, `npm run build:static -- --origin <public-origin>` exports an isolated artifact with browser-local source search; add `--preview` for the labelled template demo. Static mode has no API/paid AI. Full server-side source selection is supported on one persistent Node host; paid serverless/multi-host AI is not supported by the local limiter. See the deployment matrix before choosing a host.
