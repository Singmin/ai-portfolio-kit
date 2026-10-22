# Security boundaries

Only `src/lib/qa/public-sources.ts` is available to Q&A. No private repository, CV, upload, remote website, or environment variable is an evidence source. Local MDX is trusted code reviewed through Git. The optional provider receives only the question and retrieved public passages. Model-generated facts and links are never rendered; only validated source IDs influence ordering/selection.

The API validates origin and JSON schema, enforces a streaming 4 KiB body cap and 5-second body-read timeout, caps questions at 500 characters, applies durable local request/model budgets, and times out provider calls. Responses are not cached. Provider failures and raw exceptions are never returned. The application does not log questions or store conversations. Limiter state contains hashed client buckets, counts, and expiry times, without raw IPs or questions.

The limiter is for a persistent **single machine**, including local workers sharing the same disk. Shared hosting across machines requires a shared atomic limiter. Proxy headers are ignored by default. Any inability to verify the request budget fails closed. See the README for crash-lock recovery. Paid AI is optional and must remain disabled when the limiter's persistence cannot be guaranteed.

The CSP supplies framing/object/base restrictions, not a complete script-src policy; Next.js hydration currently relies on its normal scripts. Extend with tested per-request nonces when deploying under a strict script policy. Security headers are configured in `next.config.mjs`.

For a vulnerability, do not post credentials or personal data in a public issue. Use the repository owner's private security reporting channel after one is configured. This local template has no remote owner contact yet. Rotate exposed credentials immediately through the provider, and remove them from any published history.
