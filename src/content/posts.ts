import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import { postLoaders } from './post-loaders';
export async function loadPost(slug: string, locale: Locale) {
  const load = postLoaders[`${slug}:${locale}`];
  if (!load) notFound();
  return (await load()).default;
}
