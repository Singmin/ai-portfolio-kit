import type { Metadata } from 'next';
import Link from 'next/link';
import { profile } from '@/config/profile';
import { projects } from '@/config/projects';
import { requireLocale, text } from '@/lib/i18n';
import { PrintButton } from '@/components/print-button';
export const metadata: Metadata = { title: 'Resume / 简历' };
export default async function Resume({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  return <div className="document-page page-pad resume-page"><div className="page-title-row"><h1>{text(locale, 'Resume', '个人简历')}</h1><PrintButton locale={locale} /></div>
    <div className="resume-intro"><div><h2>{profile.name[locale]}</h2><p className="lead">{profile.role[locale]}</p><p>{profile.location[locale]}</p>{profile.email && <a href={`mailto:${profile.email}`}>{profile.email}</a>}{profile.github && <p><a href={profile.github}>GitHub ↗</a></p>}</div><p>{profile.bio[locale]}</p></div>
    <section className="resume-row"><h2>{text(locale, 'Skills', '技能')}</h2><p className="skill-list">{profile.skills.join(' / ')}</p></section>
    <section className="resume-row"><h2>{text(locale, 'Experience', '工作经历')}</h2><div>{profile.experience.length ? profile.experience.map(e => <article key={e.company + e.period}><h3>{e.role[locale]} · {e.company}</h3><p>{e.period}</p><p>{e.description[locale]}</p></article>) : <p>{text(locale, 'No public work experience added. Replace this with verified roles and responsibilities in the profile configuration.', '尚未填写公开工作经历。请在资料配置中加入可核实的任职与职责。')}</p>}</div></section>
    <section className="resume-row"><h2>{text(locale, 'Projects', '项目')}</h2><div>{projects.map(p => <article key={p.slug}><h3><Link href={`/${locale}/projects/${p.slug}`}>{p.name} ↗</Link></h3><p>{p.summary[locale]}</p><p>{p.stack.join(' / ')}</p></article>)}</div></section>
    <section className="resume-row"><h2>{text(locale, 'Education', '教育背景')}</h2><div>{profile.education.length ? profile.education.map(e => <p key={e.institution}>{e.institution} · {e.degree[locale]} · {e.period}</p>) : <p>{text(locale, 'No public education record added yet.', '尚未填写公开教育背景。')}</p>}</div></section>
  </div>;
}
