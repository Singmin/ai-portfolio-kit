'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { text, type Locale } from '@/lib/i18n';
import type { PageId } from '@/config/site';
export function Header({ locale, brand, navigation, showAsk, languagePaths = {} }: { locale: Locale; brand: string; navigation: { path: PageId; label: string }[]; showAsk: boolean; languagePaths?: Partial<Record<Locale, string[]>> }) {
  const path = usePathname();
  const other = locale === 'en' ? 'zh' : 'en';
  const suffix = path.replace(/^\/(en|zh)(?=\/|$)/, '');
  const targetPaths = languagePaths[other];
  const destination = targetPaths?.includes(suffix) ? suffix : suffix.startsWith('/blog/') && targetPaths?.includes('/blog') ? '/blog' : '';
  const switchPath = `/${other}${destination}`;
  return <header className="site-header">
    <Link className="brand" href={`/${locale}`} aria-label={text(locale, `${brand} home`, `${brand} 首页`)}>{brand}<span aria-hidden="true">↗</span></Link>
    <nav aria-label={text(locale, 'Main navigation', '主导航')}>
      {navigation.map(item => <Link key={item.path} href={`/${locale}/${item.path}`} aria-current={path === `/${locale}/${item.path}` || path.startsWith(`/${locale}/${item.path}/`) ? 'page' : undefined}>{item.label}</Link>)}
      {targetPaths && <Link href={switchPath} lang={other} hrefLang={other} className="language">{other === 'zh' ? '中文' : 'EN'}</Link>}
      {showAsk && !navigation.some(item => item.path === 'ask') && <Link className="button small" href={`/${locale}/ask`}>{text(locale, 'Ask the portfolio', '问问作品集')} <span aria-hidden="true">↗</span></Link>}
    </nav>
  </header>;
}
