'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { nav, text, type Locale } from '@/lib/i18n';
export function Header({ locale }: { locale: Locale }) {
  const path = usePathname();
  const other = locale === 'en' ? 'zh' : 'en';
  const switchPath = path.replace(/^\/(en|zh)(?=\/|$)/, `/${other}`);
  return <header className="site-header">
    <Link className="brand" href={`/${locale}`} aria-label={text(locale, 'AI Portfolio Kit home', 'AI Portfolio Kit 首页')}>Portfolio Kit<span aria-hidden="true">↗</span></Link>
    <nav aria-label={text(locale, 'Main navigation', '主导航')}>
      {nav.map(item => <Link key={item.path} href={`/${locale}/${item.path}`} aria-current={path.includes(`/${item.path}`) ? 'page' : undefined}>{item[locale]}</Link>)}
      <Link href={switchPath} lang={other} hrefLang={other} className="language">{other === 'zh' ? '中文' : 'EN'}</Link>
      <Link className="button small" href={`/${locale}/ask`}>{text(locale, 'Ask the portfolio', '问问作品集')} <span aria-hidden="true">↗</span></Link>
    </nav>
  </header>;
}
