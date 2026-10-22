import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { posts } from '@/content/posts';
import { requireLocale, locales, text } from '@/lib/i18n';
type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() { return locales.flatMap(locale => posts.map(p => ({ locale, slug: p.slug }))); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { locale: value, slug } = await params; const locale = requireLocale(value); const p = posts.find(p => p.slug === slug); return { title: p?.title[locale], description: p?.excerpt[locale] }; }
export default async function Post({ params }: Props) {
  const { locale: value, slug } = await params; const locale = requireLocale(value);
  const post = posts.find(p => p.slug === slug); if (!post) notFound(); const Content = post.components[locale];
  return <article className="document-page page-pad"><Link className="back-link" href={`/${locale}/blog`}>← {text(locale, 'All notes', '全部文章')}</Link><h1 className="article-title">{post.title[locale]}</h1><p className="meta">{post.date} · {post.tags.join(' / ')}</p><div className="prose"><Content /></div></article>;
}
