# Local verification — 2026-10-23

Project: `C:\Users\Singmin\Desktop\code\ai-portfolio-kit`

The repository was created independently on `main` using a new `git init`. No private bagCollection source, environment files, configuration, or commit history was copied. No remote repository or public deployment has been created.

## Verified results

| Check | Result |
| --- | --- |
| Dependency installation | Clean `npm ci` succeeded using the committed exact versions and lockfile; 436 packages installed. |
| Dependency audit | 0 known vulnerabilities in the installed dependency tree at verification time. |
| Lint | Passed with zero lint warnings. |
| TypeScript | `tsc --noEmit` passed. |
| Unit / API tests | 26 passed across four files on Vitest 5.0.5. |
| Production build | `next build --webpack` passed, producing bilingual static pages and the Node Q&A route. |
| Production HTTP smoke | Both localhost and 127.0.0.1 returned 200/offline with the expected stack citation. |
| Browser tests | 12 passed in 9.1 seconds across desktop Chromium and emulated iPhone 13 Chromium. |
| Development smoke | Next dev (Turbopack) started; Chinese home, English MDX article, and Chinese offline Q&A returned 200 with expected content. |
| Visual inspection | English and Chinese at 1440, 768, and 390 pixels: 0 failures; all four real UI preview images loaded; headings fit within two lines. Screenshots were visually reviewed. |

Runtime: bundled Node 24.19.0. Core packages: Next.js 16.4.2, React 19.3.1, Tailwind CSS 4.3.3, TypeScript 5.9.3. The system Node was older, so the included `run.ps1` selects the available bundled Node 24 runtime without changing global settings.

The browser suite exercises navigation, correct HTML language, preserved article slugs across language switches, MDX rendering, search and empty states, Q&A citation navigation, 404 status, print CSS, image loading, and horizontal overflow. The image-loading test explicitly requests reduced motion so an intentionally moving preview does not interfere with Playwright's element-stability check. Other flows run with normal motion.

Unit/API coverage includes English/Chinese retrieval, unknown answers, offline behavior without credentials, model-selected source validation, rejected generated text/foreign IDs, provider-failure fallback, exhausted model budgets, injection-shaped inputs, malformed JSON, unsupported locale/fields, oversized bodies without Content-Length, origin checks, normalized Next.js host handling, durable rate budgets, expiry, corrupt/locked stores, hashed client identities, 429/Retry-After, and generic 503 behavior.

## Scope and limits

- A real API key was not configured or used. Live OpenAI generation was not exercised; the provider boundary is verified with simulated responses/failures. Offline retrieval was verified over real HTTP and through the browser.
- The optional model selects source IDs only. Returned answer text is always the original public excerpt; this is deliberately narrower than unconstrained conversational generation.
- The limiter is durable on one writable persistent disk. Multi-host/serverless enforcement is not implemented; use a shared atomic store before enabling paid AI on such a deployment.
- The personal identity and biography are labelled examples, and work/education/external contribution records remain empty. These are ready for verified public personalization, not a claim of a completed personal CV.
- GitHub CI is prepared but has not run remotely. This local project has no configured public remote or deployment.
- The design inspector retains one informational warning about the absence of video. No honest project footage was supplied; real UI captures with subtle motion communicate the actual kit instead of unrelated footage.
- Vitest currently emits a future Vite native-config-loader compatibility notice. The pinned current configuration and all tests run successfully. It is a tooling notice, not a failed check.

## Reproduce

```powershell
cd C:\Users\Singmin\Desktop\code\ai-portfolio-kit
powershell -ExecutionPolicy Bypass -File .\run.ps1 ci
powershell -ExecutionPolicy Bypass -File .\run.ps1 check
powershell -ExecutionPolicy Bypass -File .\run.ps1 test:e2e
powershell -ExecutionPolicy Bypass -File .\run.ps1 dev
```

Browser tests need Chromium installed with `npx playwright install chromium`. On a clean machine install Node 24 LTS first. Start from a free port 3000 for the production browser suite. Keep API credentials unset for offline verification.

Open `http://localhost:3000/zh` or `http://localhost:3000/en` after starting the development server. Stop it with Ctrl+C. Production: run `build`, then `start` through the same helper. The verification servers were stopped after the checks; no background process is required.
