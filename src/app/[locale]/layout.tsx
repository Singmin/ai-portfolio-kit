import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AppearanceSwitcher } from '@/components/appearance-switcher';
import { appearanceAttributes } from '@/config/appearance';
import { requireLocale, locales, text } from '@/lib/i18n';
import { portfolio } from '@/lib/portfolio';
const { profile } = portfolio;
import '../globals.css';
import '../../styles/tokens.css';
import '../../styles/components.css';
import '../../styles/presets.css';
import '../../styles/accessibility.css';
export function generateStaticParams() { return locales.map(locale => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = requireLocale((await params).locale);
  return { title: { default: `${profile.name[locale]} · ${portfolio.site.brand[locale]}`, template: `%s · ${portfolio.site.brand[locale]}` },
    description: profile.summary[locale], robots: profile.isExample ? { index: false, follow: false } : undefined,
    openGraph: { title: `${profile.name[locale]} · ${portfolio.site.brand[locale]}`, description: profile.summary[locale], locale: locale === 'zh' ? 'zh_CN' : 'en_US', type: 'website' } };
}
export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  return <html lang={locale === 'zh' ? 'zh-CN' : 'en'} {...appearanceAttributes(portfolio.site.appearance)}><body>
    <a className="skip-link" href="#main">{text(locale, 'Skip to content', '跳转到正文')}</a>
    <Header locale={locale} brand={portfolio.site.brand[locale]} navigation={portfolio.navigation(locale)} showAsk={portfolio.enabled('ask')} languagePaths={portfolio.languagePaths} />
    <AppearanceSwitcher locale={locale} config={portfolio.site.appearance} />
    {profile.isExample && <aside className="example-notice">{text(locale, 'Starter preview — this personal profile is sample content. Replace examples and verify public experience before publishing.', '模板预览：个人资料为示例。请在发布前替换示例资料，检查项目来源，并核验公开经历和贡献记录。')}</aside>}
    <main id="main">{children}</main><Footer locale={locale} content={portfolio} />
  </body></html>;
}
