import { parseArgs } from 'node:util';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { createPreview, readCustomization } from './setup-io.mjs';

try {
  const { values } = parseArgs({ options: { file: { type: 'string' }, port: { type: 'string', default: '3200' }, help: { type: 'boolean' } } });
  if (values.help) console.log('npm run setup:preview -- --file <draft.json> [--port 3200]\nUses an isolated copy and loopback only. Ctrl+C stops this preview.');
  else {
    if (!values.file) throw new Error('preview: provide --file <reviewed-public-draft.json>');
    const port = Number(values.port);
    if (!/^\d+$/.test(values.port) || !Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('preview.port: choose an integer from 1024 to 65535');
    const probe = createServer();
    await new Promise((resolve, reject) => { probe.once('error', () => reject(new Error(`preview.port: ${port} is unavailable; choose --port`))); probe.listen(port, '127.0.0.1', () => probe.close(resolve)); });
    const previewDirectory = createPreview(process.cwd(), readCustomization(values.file));
    const url = `http://127.0.0.1:${port}`;
    console.log(JSON.stringify({ previewDirectory, url }));
    // Webpack supports this isolated copy's shared dependency junction.
    const child = spawn(process.execPath, [path.join(process.cwd(), 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], {
      cwd: previewDirectory, stdio: 'inherit', env: { ...process.env, OPENAI_API_KEY: '', SITE_URL: url, AI_RATE_LIMIT_DIR: path.join(previewDirectory, '.cache/qa'), NEXT_TELEMETRY_DISABLED: '1' },
    });
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { child.kill(signal); });
    child.once('error', error => { console.error(`preview: ${error.message}`); process.exitCode = 1; });
    child.once('exit', code => { process.exitCode = code ?? 0; });
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
