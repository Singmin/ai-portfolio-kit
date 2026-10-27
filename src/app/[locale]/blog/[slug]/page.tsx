import type { Metadata } from 'next';
import { requirePage } from '@/lib/page-access';
import { portfolio } from '@/lib/portfolio';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { loadPost } from '@/content/posts';
import { getSiteUrl } from '@/lib/site-url';
import { requireLocale, locales, text } from '@/lib/i18n';
type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() { return locales.flatMap(locale => portfolio.postsFor(locale).filter(post => post.locale === locale).map(post => ({ locale, slug: post.slug }))); }
function findPost(locale: 'en' | 'zh', slug: string) {
  const post = portfolio.postsFor(locale).find(post => post.slug === slug);
  if (!post) notFound();
  return post;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  requirePage('blog'); const { locale: value, slug } = await params; const locale = requireLocale(value);
  const post = findPost(locale, slug);
  const languages = Object.fromEntries(locales.filter(language => portfolio.postsFor(language).some(item => item.slug === slug && item.locale === language)).map(language => [language, `/${language}/blog/${slug}`]));
  const origin = getSiteUrl();
  return { title: post.title, description: post.excerpt, ...(post.status === 'example' ? { robots: { index: false, follow: false } } : {}),
    ...(origin ? { alternates: { canonical: new URL(`/${post.locale}/blog/${slug}`, origin).href, languages: Object.fromEntries(Object.entries(languages).map(([key, url]) => [key, new URL(url, origin).href])) } } : {}) };
}
export default async function Post({ params }: Props) {
  requirePage('blog');
  const { locale: value, slug } = await params; const locale = requireLocale(value);
  const post = findPost(locale, slug);
  if (post.locale !== locale) redirect(`/${post.locale}/blog/${slug}`);
  const Content = await loadPost(slug, locale);
  return <article className="document-page page-pad"><Link className="back-link" href={`/${locale}/blog`}>← {text(locale, 'All notes', '全部文章')}</Link><h1 className="article-title">{post.title}</h1><p className="meta">{post.date} · {post.tags.join(' / ')}{post.status === 'example' && ` · ${text(locale, 'Example', '示例')}`}</p><div className="prose"><Content /></div></article>;
}
