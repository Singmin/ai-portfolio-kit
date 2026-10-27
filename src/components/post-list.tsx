'use client';
import { useState } from 'react';
import Link from 'next/link';
import { text, type Locale } from '@/lib/i18n';
import type { PostEntry } from '@/content/post-model';
export function PostList({ locale, posts }: { locale: Locale; posts: PostEntry[] }) {
  const [query, setQuery] = useState('');
  const filtered = posts.filter(p => `${p.title} ${p.excerpt} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <><label className="search-label" htmlFor="post-search">{text(locale, 'Find a note', '查找文章')}</label>
    <input id="post-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={text(locale, 'Search title, topic, or keyword', '搜索标题、主题或关键词')} />
    <p className="search-count" role="status">{text(locale, `${filtered.length} ${filtered.length === 1 ? 'note' : 'notes'}`, `${filtered.length} 篇文章`)}</p>
    <div className="reading-list">{filtered.map(p => <article key={p.slug} lang={p.locale}><p className="meta">{p.date} · {p.tags.join(' / ')}{p.status === 'example' && ` · ${text(locale, 'Example', '示例')}`}{p.locale !== locale && ` · ${text(locale, 'Available in Chinese', '提供英文原文')}`}</p><h2><Link href={`/${p.locale}/blog/${p.slug}`}>{p.title} <span aria-hidden="true">↗</span></Link></h2><p>{p.excerpt}</p></article>)}</div>
    {!filtered.length && <p>{text(locale, 'No notes match that search. Try another word.', '没有匹配文章，换个关键词试试。')}</p>}</>;
}
