import Link from 'next/link';
import Image from 'next/image';
import { requireLocale, text } from '@/lib/i18n';
import { profile } from '@/config/profile';
import { projects } from '@/config/projects';
import { posts } from '@/content/posts';
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  return <>
    <section className="hero page-pad"><h1>{profile.headline[locale]}</h1>
      <div className="hero-bottom"><div><p className="hero-role">{profile.name[locale]} / {profile.role[locale]}</p><p className="hero-description">{profile.summary[locale]}</p></div>
      <Link href={`/${locale}/projects`} className="button">{text(locale, 'Explore the work', '查看项目作品')} <span aria-hidden="true">↗</span></Link></div>
    </section>
    <section className="work-section page-pad"><div className="section-top"><h2>{text(locale, 'Selected work', '项目作品')}</h2><p>{text(locale, 'The decisions behind the interface.', '看见界面背后的判断。')}</p></div>
      <div className="project-names">{projects.map(p => <Link key={p.slug} href={`/${locale}/projects/${p.slug}`}>{p.name} <span aria-hidden="true">↗</span></Link>)}</div>
      <div className="project-summary"><p>{projects[0].summary[locale]}</p><p>{projects[0].stack.join(' / ')}</p></div>
      <div className="preview-gallery">{(['resume','projects','blog','contributions'] as const).map((name, i) => <Link key={name} href={`/${locale}/${name}`}><figure><Image src={`/previews/${name}.png`} width={1000} height={750} alt={text(locale, `Actual kit interface: ${name}`, `Kit 实际页面预览：${['简历','作品','文章','开源'][i]}`)} unoptimized /><figcaption>{text(locale, ['Resume','Case studies','Field notes','Open source'][i], ['简历','项目案例','文章札记','开源记录'][i])} ↗</figcaption></figure></Link>)}</div>
    </section>
    <section className="notes-section page-pad"><h2>{text(locale, 'Field notes', '工程札记')}</h2><div className="note-rows">{posts.map(p => <Link key={p.slug} href={`/${locale}/blog/${p.slug}`}><span>{p.title[locale]}</span><span className="note-date">{p.date} ↗</span></Link>)}</div></section>
    <section className="about-section page-pad"><h2>{text(locale, 'Behind the work', '关于这些作品')}</h2><p>{profile.bio[locale]}</p><Link className="text-link" href={`/${locale}/resume`}>{text(locale, 'Read the full profile', '阅读完整简历')} ↗</Link></section>
    <section className="ask-section page-pad"><h2>{text(locale, 'Follow the evidence.', '从来源，了解更多。')}</h2><div><p>{text(locale, 'Ask about the stack, the project, or how to make this kit your own. Every result links back to public material.', '了解技术栈、项目设计或定制方法。每条结果都能追溯到公开资料。')}</p><Link href={`/${locale}/ask`} className="button">{text(locale, 'Ask the portfolio', '问问作品集')} ↗</Link><noscript><p><Link href={`/${locale}/projects`}>{text(locale, 'Browse the public projects', '直接阅读公开项目')}</Link></p></noscript></div></section>
  </>;
}
