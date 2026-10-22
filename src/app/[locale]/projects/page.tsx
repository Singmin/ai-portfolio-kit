import type { Metadata } from 'next';
import Link from 'next/link';
import { projects } from '@/config/projects';
import { requireLocale, text } from '@/lib/i18n';
export const metadata: Metadata = { title: 'Projects / 项目作品' };
export default async function Projects({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  return <div className="document-page page-pad"><h1>{text(locale, 'Selected work', '项目作品')}</h1><p className="page-intro">{text(locale, 'A closer look at the problem, the decisions, and what was built.', '从问题、判断到实现，完整记录一个项目。')}</p>
    {projects.map(p => <article className="project-entry" key={p.slug}><div><p className="meta">{p.status[locale]}</p><h2><Link href={`/${locale}/projects/${p.slug}`}>{p.name} ↗</Link></h2></div><div><p className="lead">{p.summary[locale]}</p><p>{p.stack.join(' / ')}</p><Link className="text-link" href={`/${locale}/projects/${p.slug}`}>{text(locale, 'Read the case study', '阅读项目案例')} ↗</Link></div></article>)}
  </div>;
}
