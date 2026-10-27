import { z } from 'zod';
import { appearanceSchema } from './appearance';
import { customization } from './customization';
import { customizeSite } from './customization-schema.mjs';

export const localizedSchema = z.object({ en: z.string().min(1), zh: z.string().min(1) });
export const publicUrlSchema = z.url().refine(value => ['https:', 'http:'].includes(new URL(value).protocol), 'Use an http(s) URL');
export const pageIds = ['resume', 'projects', 'blog', 'contributions', 'ask'] as const;
export type PageId = typeof pageIds[number];
const moduleSchema = z.object({
  type: z.enum(['projects', 'experience', 'posts', 'contributions', 'about', 'contact', 'assistant']),
  enabled: z.boolean(),
  limit: z.number().int().min(1).max(50).optional(),
  featured: z.array(z.string().min(1)).optional(),
});
export const siteSchema = z.object({
  appearance: appearanceSchema.default(() => appearanceSchema.parse({})),
  brand: localizedSchema,
  defaultLocale: z.enum(['zh', 'en']),
  enabledLocales: z.array(z.enum(['en', 'zh'])).min(1).default(['en', 'zh']),
  missingTranslation: z.enum(['hide', 'fallback']).default('hide'),
  template: z.object({ name: z.string().min(1), repository: publicUrlSchema.nullable() }),
  footer: z.object({ wordmark: z.string().min(1), statement: localizedSchema, signature: localizedSchema, showTemplateCredit: z.boolean() }),
  pages: z.object({ resume: z.boolean(), projects: z.boolean(), blog: z.boolean(), contributions: z.boolean(), ask: z.boolean() }).strict(),
  navigation: z.array(z.enum(pageIds)),
  home: z.object({ modules: z.array(moduleSchema) }),
});
export type SiteConfig = z.infer<typeof siteSchema>;
export type HomeModule = SiteConfig['home']['modules'][number];

const defaultSite: SiteConfig = {
  appearance: { preset: 'editorial', motion: 'full', allowSwitching: true },
  brand: { en: 'Portfolio Kit', zh: 'Portfolio Kit' },
  defaultLocale: 'zh',
  enabledLocales: ['en', 'zh'],
  missingTranslation: 'hide',
  template: { name: 'AI Portfolio Kit', repository: 'https://github.com/Singmin/ai-portfolio-kit' },
  footer: {
    wordmark: 'PORTFOLIO',
    statement: { en: 'A personal portfolio. An open foundation.', zh: '一个个人作品集，一份开放的基础。' },
    signature: { en: 'Built to be inspected.', zh: '让作品经得起核验。' },
    showTemplateCredit: true,
  },
  pages: { resume: true, projects: true, blog: true, contributions: true, ask: true },
  navigation: ['resume', 'projects', 'blog', 'contributions'],
  home: { modules: [
    { type: 'projects', enabled: true, featured: ['ai-portfolio-kit'], limit: 3 },
    { type: 'posts', enabled: true, limit: 3 },
    { type: 'experience', enabled: true, limit: 3 },
    { type: 'contributions', enabled: true, limit: 3 },
    { type: 'about', enabled: true },
    { type: 'contact', enabled: true },
    { type: 'assistant', enabled: true },
  ] },
};
export const site: SiteConfig = siteSchema.parse(customizeSite(defaultSite, customization));
