import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { compileFunction } from 'node:vm';
import ts from 'typescript';
import { readRegistry } from './content-registry.mjs';

// Execute the same trusted public config modules as Next, without building or writing files.
// This is a local maintainer tool, not a sandbox for untrusted repositories.
export function loadPublicConfig(directory = process.cwd(), customization) {
  const root = realpathSync(directory);
  const cache = new Map();
  function resolveSource(candidate) {
    const file = ['', '.ts', '.tsx', '.mjs', '.js', '.json'].map(extension => candidate + extension)
      .find(file => existsSync(file) && statSync(file).isFile());
    if (!file) throw new Error(`configuration: cannot resolve ${path.relative(root, candidate)}`);
    const resolved = realpathSync(file);
    if (!resolved.startsWith(root + path.sep)) throw new Error('configuration: local imports must stay inside this repository');
    return resolved;
  }
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    if (customization && file === path.join(root, 'src/config/customization.json')) {
      module.exports = customization; return module.exports;
    }
    if (file === path.join(root, 'src/content/post-metadata.ts')) {
      module.exports = { postMetadata: readRegistry(root).filter(post => post.status !== 'draft') };
      return module.exports;
    }
    if (file.endsWith('.json')) {
      try { module.exports = JSON.parse(readFileSync(file, 'utf8')); }
      catch { throw new Error(`${path.relative(root, file)}: expected valid JSON`); }
      return module.exports;
    }
    const nativeRequire = createRequire(file);
    if (!/\.tsx?$/.test(file)) { module.exports = nativeRequire(file); return module.exports; }
    const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
      fileName: file, reportDiagnostics: true,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    });
    if (compiled.diagnostics?.some(item => item.category === ts.DiagnosticCategory.Error)) throw new Error(`${path.relative(root, file)}: invalid TypeScript syntax`);
    const require = specifier => {
      if (specifier.startsWith('@/')) return load(resolveSource(path.join(root, 'src', specifier.slice(2))));
      if (specifier.startsWith('.')) return load(resolveSource(path.resolve(path.dirname(file), specifier)));
      return nativeRequire(specifier);
    };
    compileFunction(compiled.outputText, ['exports', 'require', 'module', '__filename', '__dirname'], { filename: file })(module.exports, require, module, file, path.dirname(file));
    return module.exports;
  }
  const previous = process.cwd();
  try {
    process.chdir(root);
    const content = load(path.join(root, 'src/lib/portfolio.ts')).portfolio;
    const siteUrl = load(path.join(root, 'src/lib/site-url.ts')).getSiteUrl();
    return { content, siteUrl };
  } finally { process.chdir(previous); }
}
