import { notFound } from 'next/navigation';
import type { PageId } from '@/config/site';
import { portfolio } from './portfolio';
export function requirePage(page: PageId) {
  if (!portfolio.enabled(page)) notFound();
}
