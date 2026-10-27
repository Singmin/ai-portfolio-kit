import type { Locale } from '@/lib/i18n';
import { publicSources } from './public-sources';
import { rankSources } from './rank';
export { tokens } from './rank';
export function retrieve(question: string, locale: Locale) {
  return rankSources(question, publicSources(locale));
}
