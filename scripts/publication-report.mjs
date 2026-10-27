import { accessSync, constants, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { validatePublicContent } from './validate-public-content.mjs';

const placeholder = /your name|你的名字|add your city|填写所在城市|this is a working portfolio starter|这是一个已经可以运行的作品集模板|\b(?:TODO|TBD|replace me|fictional|illustrative)\b|虚构|示例(?:姓名|资料|身份)/i;
const exampleHost = hostname => /(^|\.)example\.(com|org|net)$|(^|\.)localhost$|\.local$|\.invalid$|\.test$|^127\.|^0\.0\.0\.0$|^\[?::1\]?$|^10\.|^192\.168\.|^172\.(?:1[6-9]|2\d|3[01])\./i.test(hostname);

export function publicationReport(root, content, options = {}) {
  const errors = []; const warnings = [];
  const add = (target, code, field, message) => target.push({ code, field, message });
  const { profile, site } = content;
  const identityIssues = options.preview && profile.isExample ? warnings : errors;
  if (profile.isExample) add(identityIssues, 'example-profile', 'profile.isExample', 'Sample identity: keep the preview label/noindex; replace and verify it before a personal-site release.');
  for (const locale of site.enabledLocales) for (const field of ['name', 'role', 'headline', 'summary', 'bio', 'location']) {
    const value = profile[field]?.[locale];
    if (field !== 'location' && (typeof value !== 'string' || !value.trim())) add(errors, 'missing-profile', `profile.${field}.${locale}`, 'Provide the public text for this enabled language.');
    if (typeof value === 'string' && placeholder.test(value)) add(identityIssues, 'placeholder', `profile.${field}.${locale}`, 'Starter/example text remains; replace or explicitly remove it before a personal-site release.');
  }
  if (!profile.email && !profile.github) add(identityIssues, 'missing-contact', 'profile.email / profile.github', 'Provide at least one public contact channel for a personal-site release.');
  if (profile.email && exampleHost(profile.email.split('@')[1])) add(identityIssues, 'example-contact', 'profile.email', 'The contact address uses an example or local domain.');
  if (profile.github && exampleHost(new URL(profile.github).hostname)) add(identityIssues, 'example-contact', 'profile.github', 'The contact link uses an example or local domain.');
  const url = options.siteUrl;
  let publicOrigin;
  if (!url) add(options.preview ? warnings : errors, 'missing-site-url', 'seo.url / env.SITE_URL', 'Set the final public origin for sitemap and canonical URLs.');
  else {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error();
      if (exampleHost(parsed.hostname)) add(options.preview ? warnings : errors, 'local-site-url', 'seo.url / env.SITE_URL', 'Use a public origin, not localhost or an example/test/private address.');
      else publicOrigin = parsed.origin;
      if (parsed.protocol === 'http:') add(warnings, 'https', 'seo.url / env.SITE_URL', 'The configured public origin uses HTTP; check HTTPS before release.');
    } catch { add(errors, 'invalid-site-url', 'seo.url / env.SITE_URL', 'Use an absolute http(s) origin without credentials, path, query or fragment.'); }
  }
  for (const post of content.posts.filter(post => post.status === 'published')) for (const locale of site.enabledLocales) {
    if (!post.translations[locale]) add(warnings, 'missing-translation', `posts.${post.slug}.translations.${locale}`, `No native translation; the configured ${site.missingTranslation} policy applies.`);
  }
  for (const locale of site.enabledLocales) if (/^Portfolio Kit$/i.test(site.brand[locale])) add(warnings, 'starter-brand', `site.brand.${locale}`, 'The starter brand is still configured.');
  if (content.projects.some(project => project.slug === 'ai-portfolio-kit') || content.posts.some(post => ['evidence-first-ai', 'own-your-kit'].includes(post.slug))) add(warnings, 'starter-content', 'content.hideStarterContent', 'Bundled project/docs remain. Review their attribution and AI permissions for your own site.');
  for (const [page, count] of [['projects', content.projects.length], ['blog', content.posts.length], ['contributions', content.contributions.length]]) {
    if (site.pages[page] && !count) add(warnings, 'empty-page', `site.pages.${page}`, 'This page is enabled but has no public records; it is hidden from navigation.');
  }
  try { validatePublicContent(root, content, url); }
  catch (error) { add(errors, 'invalid-content', 'content', error.message); }
  const deployment = options.deployment ?? 'node';
  if (!['node', 'static'].includes(deployment)) add(errors, 'unsupported-deployment', 'deployment', 'Supported targets are a single Node host or static export with browser-only retrieval; paid serverless/multi-host AI is not implemented.');
  if (site.pages.ask && deployment === 'node') {
    const target = path.resolve(root, options.rateLimitDir || '.cache/qa');
    let existing = target;
    while (!existsSync(existing) && path.dirname(existing) !== existing) existing = path.dirname(existing);
    try { if (!statSync(existing).isDirectory()) throw new Error(); accessSync(existing, constants.W_OK); }
    catch { add(errors, 'unwritable-storage', 'env.AI_RATE_LIMIT_DIR', 'The configured rate-limit path or its parent is not a writable directory.'); }
    if (options.hasModel && !options.rateLimitDir) add(warnings, 'persistent-storage', 'env.AI_RATE_LIMIT_DIR', 'Paid AI uses the default local store. Verify a persistent disk and production service-user permissions.');
  }
  return { version: 1, mode: options.preview ? 'preview' : 'release', passed: errors.length === 0, deployment, ...(publicOrigin ? { publicOrigin } : {}), errors, warnings,
    scope: 'Configuration and local assets only; no deployment, remote URL/DNS check, or verification of personal claims.' };
}
