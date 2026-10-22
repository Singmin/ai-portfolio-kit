import { mkdirSync, copyFileSync } from 'node:fs';
mkdirSync('public/fonts', { recursive:true });
for(const [name,pkg] of [['imbue','imbue'],['albert','albert-sans']]) {
  const root = `node_modules/@fontsource-variable/${pkg}`;
  copyFileSync(`${root}/files/${pkg}-latin-wght-normal.woff2`, `public/fonts/${name}-latin.woff2`);
  copyFileSync(`${root}/LICENSE`, `public/fonts/${name}-OFL.txt`);
}
