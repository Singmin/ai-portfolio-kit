import { z } from 'zod';
import { localizedSchema, publicUrlSchema } from './site';

export const mediaSchema = z.object({
  src: z.string().regex(/^\/(?!\/)(?!.*(?:\\|\.\.))[^?#]+$/, 'Use a local public/ asset path starting with /'),
  alt: localizedSchema,
  caption: localizedSchema.optional(),
});
export const projectSchema = z.object({
  publication: z.enum(['published', 'draft', 'example']).optional(),
  aiIndex: z.boolean().optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1), status: localizedSchema, summary: localizedSchema,
  problem: localizedSchema, decisions: localizedSchema, outcome: localizedSchema,
  stack: z.array(z.string().min(1)), repository: publicUrlSchema.nullable(), demo: publicUrlSchema.nullable(),
  period: z.string().min(1).optional(), role: localizedSchema.optional(),
  team: localizedSchema.optional(), contribution: localizedSchema.optional(),
  cover: mediaSchema.optional(), screenshots: z.array(mediaSchema).optional(),
  metrics: z.array(z.object({ value: z.string().min(1), label: localizedSchema, evidenceUrl: publicUrlSchema.optional() })).optional(),
  evidence: z.array(z.object({ type: z.enum(['source', 'demo', 'article', 'pr', 'document']), title: localizedSchema, url: publicUrlSchema })).optional(),
});
export type Project = z.infer<typeof projectSchema>;
export type ProjectMedia = z.infer<typeof mediaSchema>;

export const projects: Project[] = [{
  publication: 'published', aiIndex: true,
  slug: 'ai-portfolio-kit', name: 'AI Portfolio Kit',
  status: { en: 'Open-source starter · v0.1', zh: '开源模板 · v0.1' },
  summary: { en: 'A bilingual portfolio with a public-content Q&A and a reusable foundation.', zh: '一个双语作品集，包含基于公开资料的问答和可复用的工程基础。' },
  problem: { en: 'A portfolio needs to explain the work clearly and let readers inspect the evidence without exposing private material.', zh: '作品集需要讲清楚工程实践，也需要让读者核验依据，同时避免暴露私人资料。' },
  decisions: { en: 'Locale-prefixed routes, local MDX, typed profile configuration, and an explicit public evidence index. The optional model selects source IDs; the server returns original excerpts.', zh: '使用带语言前缀的路由、本地 MDX、类型化个人资料配置和明确的公开资料索引。可选模型只筛选来源编号，服务器返回原文摘录。' },
  outcome: { en: 'One independent starter for a resume, project case studies, writing, and an honest contribution record. No external adoption or merged contributions are claimed.', zh: '用一个独立模板承载简历、项目案例、文章和真实的贡献记录。这里不声称已有外部用户或合并的社区贡献。' },
  stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'MDX', 'Vitest', 'Playwright'],
  repository: 'https://github.com/Singmin/ai-portfolio-kit', demo: null,
  period: '2026',
  role: { en: 'Template implementation', zh: '模板实现' },
  cover: { src: '/previews/resume.png', alt: { en: 'Kit resume interface', zh: 'Kit 简历界面' }, caption: { en: 'Resume', zh: '简历' } },
  screenshots: [
    { src: '/previews/projects.png', alt: { en: 'Kit project interface', zh: 'Kit 项目界面' }, caption: { en: 'Case studies', zh: '项目案例' } },
    { src: '/previews/blog.png', alt: { en: 'Kit writing interface', zh: 'Kit 文章界面' }, caption: { en: 'Field notes', zh: '工程札记' } },
    { src: '/previews/contributions.png', alt: { en: 'Kit contribution interface', zh: 'Kit 贡献界面' }, caption: { en: 'Open source', zh: '开源记录' } },
  ],
}];
