import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { requireLocale, locales, text } from '@/lib/i18n';
import { profile } from '@/config/profile';
import '../globals.css';
export function generateStaticParams() { return locales.map(locale => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = requireLocale((await params).locale);
  return { title: { default: `${profile.name[locale]} · AI Portfolio Kit`, template: '%s · AI Portfolio Kit' },
    description: profile.summary[locale], robots: profile.isExample ? { index: false, follow: false } : undefined,
    openGraph: { title: `${profile.name[locale]} · AI Portfolio Kit`, description: profile.summary[locale], locale: locale === 'zh' ? 'zh_CN' : 'en_US', type: 'website' } };
}
export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  return <html lang={locale === 'zh' ? 'zh-CN' : 'en'}><body>
    <a className="skip-link" href="#main">{text(locale, 'Skip to content', '跳转到正文')}</a>
    <Header locale={locale} />
    {profile.isExample && <aside className="example-notice">{text(locale, 'Starter preview — the personal profile is sample content. Project details describe this local kit.', '模板预览：个人资料为示例，项目内容对应当前本地 Kit。请在发布前替换示例资料，并核验公开经历和贡献记录。')}</aside>}
    <main id="main">{children}</main><Footer locale={locale} />
  </body></html>;
}
