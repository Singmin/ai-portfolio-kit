type SearchableSource = { title: string; excerpt: string; keywords: string };
const stop = new Set('a an and are as at be can do does for from how i in is it me of on or please tell that the this to use what which who with you your 这个 什么 如何 怎么 是否 一个 可以'.split(' '));
export function tokens(input: string): string[] {
  const words = input.toLowerCase().match(/[a-z0-9+#.]+|[\u3400-\u9fff]+/g) ?? [];
  return [...new Set(words.flatMap(word => /[\u3400-\u9fff]/.test(word) && word.length > 2 ? [...Array.from({ length: word.length - 1 }, (_, index) => word.slice(index, index + 2)), word] : [word]).filter(word => !stop.has(word) && word.length > 1))];
}
export function rankSources<T extends SearchableSource>(question: string, sources: T[]): T[] {
  const query = tokens(question);
  return sources.map(source => {
    const keywords = new Set(tokens(source.keywords));
    const body = new Set(tokens(`${source.title} ${source.excerpt}`));
    return { source, score: query.reduce((sum, token) => sum + (keywords.has(token) ? 3 : body.has(token) ? 1 : 0), 0) };
  }).filter(item => item.score >= 2).sort((a, b) => b.score - a.score).slice(0, 3).map(item => item.source);
}
