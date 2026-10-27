import { createProcessor } from '@mdx-js/mdx';

// Parse syntax only. Never import, evaluate, render, or fetch an MDX dependency.
export function extractPassages(body, file) {
  const tree = createProcessor().parse(body);
  const passages = [];
  const ids = new Set();
  function inline(node) {
    if (node.type === 'text' || node.type === 'inlineCode') return node.value;
    if (node.type === 'break') return '\n';
    if (['emphasis', 'strong', 'link', 'linkReference'].includes(node.type)) return node.children.map(inline).join('');
    throw new Error(`${file}.PublicExcerpt: only static text, emphasis, inline code and links are supported`);
  }
  function containsMarker(node) {
    return node.name === 'PublicExcerpt' || node.children?.some(containsMarker);
  }
  for (const node of tree.children) {
    if (node.type !== 'mdxJsxFlowElement' || node.name !== 'PublicExcerpt') {
      if (containsMarker(node)) throw new Error(`${file}.PublicExcerpt: place passages at the top level, outside other components`);
      continue;
    }
    const attribute = node.attributes[0];
    if (node.attributes.length !== 1 || attribute.type !== 'mdxJsxAttribute' || attribute.name !== 'id' || typeof attribute.value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(attribute.value)) throw new Error(`${file}.PublicExcerpt.id: use one literal slug ID and no other attributes`);
    if (ids.has(attribute.value)) throw new Error(`${file}.PublicExcerpt.id: duplicate ${attribute.value}`);
    if (node.children.length !== 1 || node.children[0].type !== 'paragraph') throw new Error(`${file}.PublicExcerpt: wrap exactly one static paragraph`);
    const excerpt = node.children[0].children.map(inline).join('').trim();
    if (!excerpt || excerpt.length > 2000) throw new Error(`${file}.PublicExcerpt.${attribute.value}: use 1–2000 characters`);
    ids.add(attribute.value); passages.push({ id: attribute.value, excerpt });
  }
  if (passages.length > 12) throw new Error(`${file}.PublicExcerpt: at most 12 passages per translation`);
  return passages;
}
