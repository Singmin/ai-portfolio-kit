import type { Metadata } from 'next';
import Link from 'next/link';
import { requireLocale, text } from '@/lib/i18n';
import { portfolio } from '@/lib/portfolio';
import { requirePage } from '@/lib/page-access';
import { PrintButton } from '@/components/print-button';
export const metadata: Metadata = { title: 'Resume / 简历' };
export default async function Resume({ params }: { params: Promise<{ locale: string }> }) {
  requirePage('resume');
  const locale = requireLocale((await params).locale);
  const { profile } = portfolio;
  return <div className="document-page page-pad resume-page"><div className="page-title-row"><h1>{text(locale, 'Resume', '个人简历')}</h1><PrintButton locale={locale} /></div>
    <div className="resume-intro"><div><h2>{profile.name[locale]}</h2><p className="lead">{profile.role[locale]}</p><p>{profile.location[locale]}</p>{profile.email && <a href={`mailto:${profile.email}`}>{profile.email}</a>}{profile.github && <p><a href={profile.github} style={{ overflowWrap: 'anywhere' }}>{profile.github} ↗</a></p>}</div><p>{profile.bio[locale]}</p></div>
    {!!profile.skills.length && <section className="resume-row"><h2>{text(locale, 'Skills', '技能')}</h2><p className="skill-list">{profile.skills.join(' / ')}</p></section>}
    {!!profile.experience.length && <section className="resume-row"><h2>{text(locale, 'Experience', '工作经历')}</h2><div>{profile.experience.map(item => <article key={item.company + item.period}><h3>{item.role[locale]} · {item.company}</h3><p>{item.period}</p><p>{item.description[locale]}</p></article>)}</div></section>}
    {portfolio.visible('projects') && <section className="resume-row"><h2>{text(locale, 'Projects', '项目')}</h2><div>{portfolio.projects.map(project => <article key={project.slug}><h3><Link href={`/${locale}/projects/${project.slug}`}>{project.name} ↗</Link></h3><p>{project.summary[locale]}</p>{project.role && <p>{project.role[locale]}</p>}<p>{project.stack.join(' / ')}</p></article>)}</div></section>}
    {!!profile.education.length && <section className="resume-row"><h2>{text(locale, 'Education', '教育背景')}</h2><div>{profile.education.map(item => <p key={item.institution}>{item.institution} · {item.degree[locale]} · {item.period}</p>)}</div></section>}
  </div>;
}
