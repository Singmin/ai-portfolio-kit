import type { Metadata } from 'next';
import { requireLocale } from '@/lib/i18n';
import { portfolio } from '@/lib/portfolio';
import { requirePage } from '@/lib/page-access';
import { ContributionsView } from '@/components/contributions-view';
export const metadata: Metadata = { title: 'Open source / 开源贡献' };
export default async function Contributions({ params }: { params: Promise<{ locale: string }> }) {
  requirePage('contributions');
  return <ContributionsView locale={requireLocale((await params).locale)} content={portfolio} />;
}
