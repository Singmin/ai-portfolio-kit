import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { projects } from '@/config/projects';
import { requireLocale, locales, text } from '@/lib/i18n';
type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() { return locales.flatMap(locale => projects.map(p => ({ locale, slug: p.slug }))); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; return { title: projects.find(p => p.slug === slug)?.name ?? 'Project' }; }
export default async function ProjectPage({ params }: Props) {
  const { locale: value, slug } = await params; const locale = requireLocale(value);
  const project = projects.find(p => p.slug === slug); if (!project) notFound();
  return <article className="document-page page-pad case-study"><Link className="back-link" href={`/${locale}/projects`}>← {text(locale, 'All projects', '全部项目')}</Link><h1>{project.name}</h1><p className="page-intro">{project.summary[locale]}</p><p className="meta">{project.status[locale]} · {project.stack.join(' / ')}</p>
    <div className="case-body">{(['problem','decisions','outcome'] as const).map((key,i) => <section key={key}><h2>{text(locale, ['The problem','The decisions','The result'][i], ['面对的问题','关键判断','实现结果'][i])}</h2><p>{project[key][locale]}</p></section>)}</div>
    <div className="flex flex-wrap gap-6">{project.repository && <a className="text-link" href={project.repository}>{text(locale, 'Source repository', '源代码仓库')} ↗</a>}{project.demo && <a className="text-link" href={project.demo}>{text(locale, 'Live demo', '在线演示')} ↗</a>}</div>
    {!project.repository && <p className="notice">{text(locale, 'This project is local. A public repository URL has not been configured.', '当前项目位于本地，尚未配置公开仓库链接。')}</p>}
  </article>;
}
