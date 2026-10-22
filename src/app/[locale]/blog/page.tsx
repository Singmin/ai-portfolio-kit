import type { Metadata } from 'next';
import { posts } from '@/content/posts';
import { requireLocale, text } from '@/lib/i18n';
import { PostList } from '@/components/post-list';
export const metadata: Metadata = { title: 'Writing / 文章' };
export default async function Blog({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  return <div className="document-page page-pad"><h1>{text(locale, 'Field notes', '工程札记')}</h1><p className="page-intro">{text(locale, 'Decisions, small experiments, and the things worth writing down.', '记录工程判断、小实验，以及值得留下来的思考。')}</p><PostList locale={locale} posts={posts.map(({ components: _components, ...post }) => { void _components; return post; })} /></div>;
}
