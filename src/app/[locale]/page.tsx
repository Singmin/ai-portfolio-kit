import { requireLocale } from '@/lib/i18n';
import { portfolio } from '@/lib/portfolio';
import { HomeView } from '@/components/home-view';
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  return <HomeView locale={requireLocale((await params).locale)} content={portfolio} />;
}
