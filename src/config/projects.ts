import type { Localized } from '@/lib/i18n';
export type Project = {
  slug: string; name: string; status: Localized; summary: Localized;
  problem: Localized; decisions: Localized; outcome: Localized;
  stack: string[]; repository: string | null; demo: string | null;
};
export const projects: Project[] = [{
  slug: 'ai-portfolio-kit', name: 'AI Portfolio Kit',
  status: { en: 'Local project · v0.1', zh: '本地项目 · v0.1' },
  summary: { en: 'A bilingual portfolio with a public-content Q&A and a reusable foundation.', zh: '一个双语作品集，包含基于公开资料的问答和可复用的工程基础。' },
  problem: { en: 'A portfolio needs to explain the work clearly and let readers inspect the evidence without exposing private material.', zh: '作品集需要讲清楚工程实践，也需要让读者核验依据，同时避免暴露私人资料。' },
  decisions: { en: 'Locale-prefixed routes, local MDX, typed profile configuration, and an explicit public evidence index. The optional model selects source IDs; the server returns original excerpts.', zh: '使用带语言前缀的路由、本地 MDX、类型化个人资料配置和明确的公开资料索引。可选模型只筛选来源编号，服务器返回原文摘录。' },
  outcome: { en: 'One independent starter for a resume, project case studies, writing, and an honest contribution record. No external adoption or merged contributions are claimed.', zh: '用一个独立模板承载简历、项目案例、文章和真实的贡献记录。这里不声称已有外部用户或合并的社区贡献。' },
  stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'MDX', 'Vitest', 'Playwright'],
  repository: null, demo: null,
}];
