import { createHash } from 'node:crypto';
import { portfolio } from '@/lib/portfolio';
import type { Portfolio } from '@/lib/configuration';
import { text, type Locale } from '@/lib/i18n';
import type { Citation } from './types';

type Category = 'skills' | 'role' | 'contribution' | 'contact' | 'article' | 'project' | 'profile';
export type PublicSource = Citation & { keywords: string; category: Category; subject: string };

export function buildPublicSources(locale: Locale, content: Portfolio): PublicSource[] {
  if (!content.enabled('ask') || !content.site.enabledLocales.includes(locale)) return [];
  const sources: PublicSource[] = [];
  const add = (id: string, title: string, url: string, original: string, category: Category, keywords: string, subject = title) => {
    if (!original.trim()) return;
    const excerpt = original.trim().slice(0, 2000);
    const revision = createHash('sha256').update(JSON.stringify([locale, title, url, original])).digest('hex').slice(0, 16);
    sources.push({ id, title, url, excerpt, revision, category, keywords, subject });
  };
  const { profile } = content;
  // Example identity is never evidence about a real person, even if opted in.
  if (content.enabled('resume') && !profile.isExample && profile.aiIndex === true) {
    const url = `/${locale}/resume`;
    add('profile', text(locale, 'Public profile', '个人简介'), url, profile.bio[locale], 'profile', 'profile biography person about 简介 个人 关于');
    add('profile:skills', text(locale, 'Public skills', '公开技能'), url, profile.skills.join(' / '), 'skills', 'skills abilities 技能 能力');
    if (profile.email) add('profile:contact', text(locale, 'Public contact', '公开联系方式'), url, profile.email, 'contact', 'contact email reach 联系 邮箱 联系方式');
    if (profile.github) add('profile:github', 'GitHub', url, profile.github, 'contact', 'contact github reach 联系 主页 联系方式');
  }
  if (content.enabled('projects')) for (const project of content.projects) {
    if (project.aiIndex !== true || (project.publication ?? 'published') !== 'published') continue;
    const url = `/${locale}/projects/${project.slug}`;
    add(`project:${project.slug}:stack`, `${project.name} · ${text(locale, 'Technology stack', '技术栈')}`, url, project.stack.join(' / '), 'skills', 'technology stack technologies skills 技术栈 技能 技术', project.name);
    for (const field of ['summary', 'problem', 'decisions', 'outcome', 'role', 'contribution'] as const) {
      const excerpt = project[field]?.[locale];
      if (!excerpt) continue;
      const category = field === 'role' || field === 'contribution' ? 'role' : 'project';
      const keywords = category === 'role' ? 'author role responsibility contribution scope 作者 角色 个人 职责 贡献 范围' : 'portfolio project architecture design decisions result 项目 作品 架构 设计 决策 结果';
      add(`project:${project.slug}:${field}`, project.name, url, excerpt, category, keywords, project.name);
    }
  }
  for (const post of content.posts) {
    if (!content.enabled('blog') || post.status !== 'published' || post.aiIndex !== true || !post.translations[locale]) continue;
    for (const passage of post.passages?.[locale] ?? []) {
      add(`post:${post.slug}:${passage.id}`, post.translations[locale]!.title, `/${locale}/blog/${post.slug}#evidence-${passage.id}`, passage.excerpt,
        'article', `${post.translations[locale]!.title} ${post.tags.join(' ')} article writing note 文章 笔记`);
    }
  }
  if (content.enabled('contributions')) for (const item of content.contributions) {
    if (item.aiIndex !== true || (item.publication ?? 'published') !== 'published') continue;
    add(`contribution:${encodeURIComponent(item.url)}`, item.title, `/${locale}/contributions`, `${item.status} · ${item.summary[locale]}`, 'contribution', 'contributions pull request community github opensource 开源 社区 贡献 合并');
  }
  return sources;
}

export function publicSources(locale: Locale): PublicSource[] { return buildPublicSources(locale, portfolio); }

export function suggestedQuestions(locale: Locale, sources: PublicSource[]): string[] {
  const questions: string[] = [];
  for (const category of ['skills', 'role', 'contribution', 'contact', 'article', 'profile', 'project'] as const) {
    const source = sources.find(source => source.category === category);
    if (!source) continue;
    const subject = source.subject.slice(0, 160);
    const question = {
      skills: source.id === 'profile:skills'
        ? text(locale, 'What skills are listed in the public profile?', '公开资料列出了哪些技能？')
        : text(locale, `What technology stack does ${subject} use?`, `${subject} 使用哪些技术栈？`),
      role: text(locale, `What is the author's role in ${subject}?`, `作者在 ${subject} 中的职责是什么？`),
      contribution: text(locale, `What public contribution is recorded for ${subject}?`, `${subject} 有哪些公开贡献记录？`),
      contact: text(locale, 'How can I contact the author?', '如何联系作者？'),
      article: text(locale, `What does “${subject}” explain?`, `《${subject}》介绍了什么？`),
      profile: text(locale, 'What does the public profile say?', '公开资料如何介绍作者？'),
      project: text(locale, `What decisions are documented for ${subject}?`, `${subject} 记录了哪些工程决策？`),
    }[category];
    questions.push(question);
    if (questions.length === 4) break;
  }
  return questions;
}
