import Link from 'next/link';
import { text, type Locale } from '@/lib/i18n';
import type { Portfolio } from '@/lib/configuration';
import { ProjectMedia } from './project-media';
export function HomeView({ locale, content }: { locale: Locale; content: Portfolio }) {
  const { profile } = content;
  const action = content.primaryAction(locale);
  return <>
    <section className="hero page-pad"><h1>{profile.headline[locale]}</h1>
      <div className="hero-bottom"><div><p className="hero-role">{profile.name[locale]} / {profile.role[locale]}</p><p className="hero-description">{profile.summary[locale]}</p></div>
        {action && <Link href={action.href} className="button">{action.label} <span aria-hidden="true">↗</span></Link>}</div>
      {!!profile.skills.length && <div className="hero-capabilities"><h2>{text(locale, 'Working with', '技术方向')}</h2><p>{profile.skills.join(' / ')}</p></div>}
    </section>
    {content.modulesFor(locale).map(module => {
      const limit = module.limit ?? 3;
      switch (module.type) {
        case 'projects': return <section key={module.type} data-module="projects" className="work-section page-pad"><div className="section-top"><h2>{text(locale, 'Selected work', '项目作品')}</h2><p>{text(locale, 'The decisions behind the interface.', '看见界面背后的判断。')}</p></div>
          {content.featured(module).map(project => <article key={project.slug} className="home-project"><div className="project-names"><Link href={`/${locale}/projects/${project.slug}`}>{project.name} ↗</Link></div><div className="project-summary"><p>{project.summary[locale]}</p><p>{project.stack.join(' / ')}</p></div>{project.role && <p className="project-role">{project.role[locale]}{project.period && ` · ${project.period}`}</p>}<div className="engineering-details"><h3>{text(locale, 'Implementation decisions', '实现决策')}</h3><p>{project.decisions[locale]}</p><Link className="text-link" href={`/${locale}/projects/${project.slug}`}>{text(locale, 'Inspect the case study', '查看案例与依据')} ↗</Link></div><ProjectMedia project={project} locale={locale} linkToProject /></article>)}
        </section>;
        case 'posts': return !content.postsFor(locale).length ? null : <section key={module.type} data-module="posts" className="notes-section page-pad"><h2>{text(locale, 'Field notes', '工程札记')}</h2><div className="note-rows">{content.postsFor(locale).slice(0, limit).map(post => <Link key={post.slug} href={`/${post.locale}/blog/${post.slug}`} lang={post.locale}><span>{post.title}{post.status === 'example' && ` · ${text(locale, 'Example', '示例')}`}</span><span className="note-date">{post.date}{post.locale !== locale && ` · ${post.locale.toUpperCase()}`} ↗</span></Link>)}</div></section>;
        case 'about': return <section key={module.type} data-module="about" className="about-section page-pad"><h2>{text(locale, 'Behind the work', '关于这些作品')}</h2><p>{profile.bio[locale]}</p>{content.enabled('resume') && <Link className="text-link" href={`/${locale}/resume`}>{text(locale, 'Read the full profile', '阅读完整简历')} ↗</Link>}</section>;
        case 'experience': return <section key={module.type} data-module="experience" className="notes-section page-pad"><h2>{text(locale, 'Experience', '工作经历')}</h2><div className="module-reading">{profile.experience.slice(0, limit).map(item => <article key={item.company + item.period}><h3>{item.role[locale]} · {item.company}</h3><p>{item.period}</p><p>{item.description[locale]}</p></article>)}</div></section>;
        case 'contributions': return <section key={module.type} data-module="contributions" className="work-section page-pad"><h2>{text(locale, 'Open contributions', '公开贡献')}</h2><div className="module-reading">{content.contributions.slice(0, limit).map(item => <article key={item.url}><h3><a href={item.url}>{item.title} ↗</a></h3><p>{item.status} · {item.summary[locale]}</p></article>)}</div><Link className="text-link" href={`/${locale}/contributions`}>{text(locale, 'View contribution record', '查看贡献记录')} ↗</Link></section>;
        case 'contact': { const contact = content.contact(locale)!; return <section key={module.type} data-module="contact" className="about-section page-pad"><h2>{text(locale, 'Get in touch', '联系我')}</h2><div><p>{text(locale, 'Continue the conversation through a public contact channel.', '通过公开联系方式，继续交流。')}</p><a className="text-link" href={contact.href}>{contact.label} ↗</a>{profile.email && profile.github && <p><a className="text-link" href={profile.github}>GitHub ↗</a></p>}</div></section>; }
        case 'assistant': return <section key={module.type} data-module="assistant" className="ask-section page-pad"><h2>{text(locale, 'Follow the evidence.', '从来源，了解更多。')}</h2><div><p>{text(locale, 'Find relevant public passages and follow their sources.', '查找相关公开原文，并查看对应来源。')}</p><Link href={`/${locale}/ask`} className="button">{text(locale, 'Ask the portfolio', '问问作品集')} ↗</Link><noscript><p>{text(locale, 'You can also browse the public pages using the navigation.', '也可通过导航直接阅读公开页面。')}</p></noscript></div></section>;
      }
    })}
  </>;
}
