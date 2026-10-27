import Link from 'next/link';
import { text, type Locale } from '@/lib/i18n';
import { projectEvidence, type Portfolio } from '@/lib/configuration';
import type { Project } from '@/config/projects';
import { ProjectMedia } from './project-media';

export function ProjectsView({ locale, content }: { locale: Locale; content: Portfolio }) {
  return <div className="document-page page-pad"><h1>{text(locale, 'Selected work', '项目作品')}</h1><p className="page-intro">{text(locale, 'A closer look at the problem, the decisions, and what was built.', '从问题、判断到实现，完整记录一个项目。')}</p>
    {!content.projects.length && <p>{text(locale, 'No public projects added yet.', '暂未添加公开项目。')}</p>}
    {content.projects.map(project => <article className="project-entry" key={project.slug}><div><p className="meta">{project.status[locale]}{project.period && ` · ${project.period}`}</p><h2><Link href={`/${locale}/projects/${project.slug}`}>{project.name} ↗</Link></h2>{project.role && <p className="project-role">{project.role[locale]}</p>}</div><div><p className="lead">{project.summary[locale]}</p><p>{project.stack.join(' / ')}</p>{project.cover && <ProjectMedia project={{ ...project, screenshots: [] }} locale={locale} linkToProject />}<Link className="text-link" href={`/${locale}/projects/${project.slug}`}>{text(locale, 'Read the case study', '阅读项目案例')} ↗</Link></div></article>)}
  </div>;
}
export function ProjectView({ locale, project }: { locale: Locale; project: Project }) {
  const links = projectEvidence(project, locale);
  return <article className="document-page page-pad case-study"><Link className="back-link" href={`/${locale}/projects`}>← {text(locale, 'All projects', '全部项目')}</Link><h1>{project.name}</h1><p className="page-intro">{project.summary[locale]}</p><p className="meta">{project.status[locale]}{project.period && ` · ${project.period}`} · {project.stack.join(' / ')}</p>
    <dl className="project-facts">{project.role && <div><dt>{text(locale, 'My role', '个人角色')}</dt><dd>{project.role[locale]}</dd></div>}{project.team && <div><dt>{text(locale, 'Team context', '团队背景')}</dt><dd>{project.team[locale]}</dd></div>}{project.contribution && <div><dt>{text(locale, 'My contribution', '贡献范围')}</dt><dd>{project.contribution[locale]}</dd></div>}</dl>
    <ProjectMedia project={project} locale={locale} />
    <div className="case-body">{(['problem', 'decisions', 'outcome'] as const).map((key, i) => <section key={key}><h2>{text(locale, ['The problem', 'The decisions', 'The result'][i], ['面对的问题', '关键判断', '实现结果'][i])}</h2><p>{project[key][locale]}</p></section>)}</div>
    {!!project.metrics?.length && <section className="project-metrics"><h2>{text(locale, 'Results in context', '结果与依据')}</h2>{project.metrics.map((metric, i) => <div key={i}><h3>{metric.value}</h3><p>{metric.label[locale]}</p>{metric.evidenceUrl && <a className="text-link" href={metric.evidenceUrl}>{text(locale, 'Inspect the evidence', '查看依据')} ↗</a>}</div>)}</section>}
    {!!links.length && <section className="project-evidence"><h2>{text(locale, 'Inspect the work', '核验作品')}</h2><ul>{links.map(link => <li key={link.url}><a className="text-link" href={link.url}>{link.title} ↗</a></li>)}</ul></section>}
  </article>;
}
