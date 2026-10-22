# Contributing

Use Node 24 LTS. Install with `npm ci`. Keep a change focused, run `npm run check`, then run `npx playwright install chromium` and `npm run test:e2e` when changing navigation, content rendering, or user flows.

Keep English and Chinese routes/content paired. Never invent personal achievements, merged pull requests, users, or measurements. Include sources for public factual additions. Only trusted maintainers may add executable local MDX; never compile visitor-submitted or fetched MDX.

For AI changes, preserve the explicit public-content boundary, original-excerpt answers, strict output validation, request limits, model budget, and fail-closed limiter behavior. Add meaningful tests for changed boundaries. Do not put API keys, `.env.local`, runtime state, or private resumes into commits.

Open an issue describing the problem and a reproducible example, then submit a focused PR with validation evidence. If you fork this kit as your own portfolio, review your public profile before publication.
