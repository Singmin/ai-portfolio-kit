import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { loadPublicConfig } from './load-public-config.mjs';
import { publicationReport } from './publication-report.mjs';

const { values } = parseArgs({ options: { json: { type: 'boolean' }, strict: { type: 'boolean' }, preview: { type: 'boolean' }, deployment: { type: 'string', default: 'node' }, help: { type: 'boolean' } } });
if (values.help) {
  console.log('npm run publish:check -- [--json] [--strict] [--preview] [--deployment node|static|serverless|multi]\nRead-only local readiness check. Preview permits explicitly labelled sample identities; it is not personal-site release clearance.');
} else {
  let report;
  try {
    if (!['node', 'static', 'serverless', 'multi'].includes(values.deployment)) throw new Error('deployment: choose node, static, serverless or multi');
    const require = createRequire(import.meta.url);
    // Use Next's own env loader so .env precedence matches the application. Never print values.
    const nextRequire = createRequire(require.resolve('next/package.json'));
    nextRequire('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
    const { content, siteUrl } = loadPublicConfig();
    report = publicationReport(process.cwd(), content, { siteUrl, deployment: values.deployment, preview: !!values.preview,
      rateLimitDir: process.env.AI_RATE_LIMIT_DIR, hasModel: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL) });
  } catch (error) {
    report = { version: 1, passed: false, errors: [{ code: 'configuration', field: 'configuration', message: error.message }], warnings: [] };
  }
  if (values.json) console.log(JSON.stringify(report, null, 2));
  else {
    for (const issue of report.errors) console.log(`ERROR ${issue.field}: ${issue.message}`);
    for (const issue of report.warnings) console.log(`WARN  ${issue.field}: ${issue.message}`);
    console.log(`${report.errors.length} errors, ${report.warnings.length} warnings. ${report.passed ? 'No blocking configuration errors.' : 'Resolve blocking errors before release.'}`);
    console.log(report.scope ?? 'Configuration could not be loaded. No files were changed.');
  }
  process.exitCode = report.errors.length || (values.strict && report.warnings.length) ? 1 : 0;
}
