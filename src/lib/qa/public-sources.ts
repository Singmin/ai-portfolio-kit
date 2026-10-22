import { profile } from '@/config/profile';
import { projects } from '@/config/projects';
import type { Locale } from '@/lib/i18n';
import type { Citation } from './types';
export type PublicSource = Citation & { keywords: string };
// Explicit allowlist. Never walk the filesystem, crawl URLs, or import private CVs.
// Keep every excerpt visible at its linked public page.
export function publicSources(locale: Locale): PublicSource[] {
  const zh = locale === 'zh'; const p = projects[0];
  return [
    { id: 'profile', title: zh ? '个人简介' : 'Public profile', url: `/${locale}/resume`,
      excerpt: profile.bio[locale], keywords: 'profile biography person name about 简介 个人 姓名 关于' },
    { id: 'stack', title: zh ? '技术栈' : 'Technology stack', url: `/${locale}/projects/ai-portfolio-kit`,
      excerpt: p.stack.join(' / '), keywords: 'technology stack technologies skills framework typescript next react mdx tailwind 技术栈 技能 框架 技术' },
    { id: 'project', title: 'AI Portfolio Kit', url: `/${locale}/projects/ai-portfolio-kit`,
      excerpt: p.decisions[locale], keywords: 'portfolio project architecture design decisions built 项目 作品 架构 设计 决策' },
    { id: 'ai', title: zh ? '让来源说话' : 'Let the source do the talking', url: `/${locale}/blog/evidence-first-ai`,
      excerpt: zh ? '服务器先把问题与公开段落进行匹配。没有 API Key 时，返回最相关的原文摘录和页面链接；如果没有匹配资料，就说明公开内容不足以回答。' : 'The server matches a question against public passages. Without an API key, it returns the closest passages with links. If no passage matches, it says the public material does not answer the question.',
      keywords: 'ai assistant safety key sources answers offline retrieval privacy 问答 助手 安全 密钥 降级 来源 隐私 公开 资料' },
    { id: 'customize', title: zh ? '把这个空间变成你的' : 'Make this space your own', url: `/${locale}/blog/own-your-kit`,
      excerpt: zh ? '修改 src/config/profile.ts，替换示例姓名、职位、公开简介、工作经历和教育背景。没有依据的字段先留空。完成替换后，再把 isExample 设为 false。' : 'Edit src/config/profile.ts to replace the example name, role, public biography, experience, and education. Leave fields empty until you can support them. Only turn off isExample after the sample identity is replaced.',
      keywords: 'customize configuration edit template reuse setup personal 定制 修改 配置 模板 复用 替换' },
    { id: 'contributions', title: zh ? '开源贡献记录' : 'Open-source record', url: `/${locale}/contributions`,
      excerpt: zh ? '暂未添加外部社区贡献。' : 'No external contributions added yet.',
      keywords: 'contributions merged pull request community github opensource 开源 社区 贡献 合并' },
  ];
}
