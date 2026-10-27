import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseCustomization } from '../src/config/customization-schema.mjs';
import { loadPublicConfig } from './load-public-config.mjs';
import { validatePublicContent } from './validate-public-content.mjs';

export function readCustomization(file) {
  const text = readFileSync(file, 'utf8');
  if (Buffer.byteLength(text) > 128 * 1024) throw new Error('customization: use a public settings file smaller than 128 KiB');
  let input;
  try { input = JSON.parse(text); } catch { throw new Error('customization: expected valid JSON'); }
  return parseCustomization(input);
}
export function writeDraft(root, input, output) {
  const settings = parseCustomization(input);
  const file = path.resolve(root, output || `.cache/setup/draft-${Date.now()}-${randomUUID().slice(0, 6)}.json`);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(settings, null, 2) + '\n', { flag: 'wx' });
  return file;
}
export function applyDraft(directory, input) {
  const root = realpathSync(directory); const settings = parseCustomization(input);
  const target = path.join(root, 'src/config/customization.json');
  if (!realpathSync(path.dirname(target)).startsWith(root + path.sep) || (existsSync(target) && lstatSync(target).isSymbolicLink())) throw new Error('customization: apply target must be a regular file inside this project');
  const { content, siteUrl } = loadPublicConfig(root, settings);
  validatePublicContent(root, content, siteUrl);
  const backup = path.join(root, '.cache/setup/backups', `${Date.now()}-${randomUUID().slice(0, 6)}.json`);
  mkdirSync(path.dirname(backup), { recursive: true });
  if (existsSync(target)) cpSync(target, backup, { errorOnExist: true, force: false });
  const temporary = path.join(path.dirname(target), `.customization-${randomUUID()}.tmp`);
  writeFileSync(temporary, JSON.stringify(settings, null, 2) + '\n', { flag: 'wx' });
  renameSync(temporary, target);
  return { target, ...(existsSync(backup) ? { backup } : {}) };
}
export function createPreview(directory, input) {
  const root = realpathSync(directory); const settings = parseCustomization(input);
  const previewDirectory = path.join(root, '.cache/setup', `preview-${Date.now()}-${randomUUID().slice(0, 6)}`);
  mkdirSync(previewDirectory, { recursive: true });
  // Copy only the public application sources, never Git, .env, private files or caches.
  for (const file of ['src', 'public', 'scripts', 'next.config.mjs', 'tsconfig.json', 'postcss.config.mjs', 'package.json', 'package-lock.json']) cpSync(path.join(root, file), path.join(previewDirectory, file), { recursive: true });
  writeFileSync(path.join(previewDirectory, 'src/config/customization.json'), JSON.stringify(settings, null, 2) + '\n');
  symlinkSync(path.join(root, 'node_modules'), path.join(previewDirectory, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  return previewDirectory;
}
