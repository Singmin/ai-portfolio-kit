import type { Locale } from '@/lib/i18n';
import { publicSources } from './public-sources';
const stop = new Set('a an and are as at be can do does for from how i in is it me of on or please tell that the this to use what which who with you your 这个 什么 如何 怎么 是否 一个 可以'.split(' '));
export function tokens(input: string): string[] {
  const words = input.toLowerCase().match(/[a-z0-9+#.]+|[\u3400-\u9fff]+/g) ?? [];
  return [...new Set(words.flatMap(w => /[\u3400-\u9fff]/.test(w) && w.length > 2 ? [...Array.from({ length: w.length - 1 }, (_, i) => w.slice(i, i + 2)), w] : [w]).filter(w => !stop.has(w) && w.length > 1))];
}
export function retrieve(question: string, locale: Locale) {
  const query = tokens(question);
  return publicSources(locale).map(source => {
    const keywords = new Set(tokens(source.keywords));
    const body = new Set(tokens(`${source.title} ${source.excerpt}`));
    return { source, score: query.reduce((n,t) => n + (keywords.has(t) ? 3 : body.has(t) ? 1 : 0), 0) };
  }).filter(x => x.score >= 2).sort((a,b) => b.score - a.score).slice(0,3).map(x => x.source);
}
