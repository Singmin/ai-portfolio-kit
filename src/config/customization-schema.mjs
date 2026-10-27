import { z } from 'zod';

const language = z.enum(['en', 'zh']);
const localized = z.object({ en: z.string().trim().min(1).optional(), zh: z.string().trim().min(1).optional() }).strict();
const url = z.url().refine(value => ['https:', 'http:'].includes(new URL(value).protocol), 'Use an http(s) URL');
const pages = ['resume', 'projects', 'blog', 'contributions', 'ask'];
const modules = ['projects', 'experience', 'posts', 'contributions', 'about', 'contact', 'assistant'];
export const customizationSchema = z.object({
  version: z.literal(1),
  profile: z.object({
    isExample: z.boolean().optional(), aiIndex: z.boolean().optional(),
    name: localized.optional(), role: localized.optional(), headline: localized.optional(),
    summary: localized.optional(), bio: localized.optional(), location: z.object({ en: z.string().trim().optional(), zh: z.string().trim().optional() }).strict().optional(),
    email: z.email().nullable().optional(), github: url.nullable().optional(),
    skills: z.array(z.string().trim().min(1)).max(50).optional(),
    experience: z.array(z.object({ company: z.string().trim().min(1), period: z.string().trim().min(1), role: localized, description: localized }).strict()).max(20).optional(),
    education: z.array(z.object({ institution: z.string().trim().min(1), period: z.string().trim().min(1), degree: localized }).strict()).max(20).optional(),
  }).strict().optional(),
  site: z.object({
    brand: localized.optional(), enabledLocales: z.array(language).min(1).max(2).optional(), defaultLocale: language.optional(),
    missingTranslation: z.enum(['hide', 'fallback']).optional(),
    appearance: z.object({
      preset: z.enum(['editorial', 'engineering', 'resume']).optional(),
      palette: z.enum(['forest', 'blueprint', 'paper']).optional(), typography: z.enum(['expressive', 'sans']).optional(),
      density: z.enum(['comfortable', 'compact']).optional(), mediaRatio: z.enum(['landscape', 'square', 'native']).optional(),
      motion: z.enum(['full', 'reduced']).optional(), allowSwitching: z.boolean().optional(),
    }).strict().optional(),
    pages: z.object({ resume: z.boolean().optional(), projects: z.boolean().optional(), blog: z.boolean().optional(), contributions: z.boolean().optional(), ask: z.boolean().optional() }).strict().optional(),
    navigation: z.array(z.enum(pages)).optional(),
    home: z.object({ modules: z.array(z.object({
      type: z.enum(modules), enabled: z.boolean(), limit: z.number().int().min(1).max(50).optional(), featured: z.array(z.string().min(1)).optional(),
    }).strict()) }).strict().optional(),
  }).strict().optional(),
  content: z.object({ hideStarterContent: z.boolean() }).strict().optional(),
  seo: z.object({ url: url.refine(value => {
    const parsed = new URL(value);
    return !parsed.username && !parsed.password && parsed.pathname === '/' && !parsed.search && !parsed.hash;
  }, 'Use a public origin without credentials, path, query or fragment') }).strict().optional(),
}).strict().superRefine((value, context) => {
  const enabled = value.site?.enabledLocales ?? ['en', 'zh'];
  if (new Set(enabled).size !== enabled.length) context.addIssue({ code: 'custom', path: ['site', 'enabledLocales'], message: 'Duplicate languages' });
  if (value.site?.defaultLocale && !enabled.includes(value.site.defaultLocale)) context.addIssue({ code: 'custom', path: ['site', 'defaultLocale'], message: 'Default language must be enabled' });
  function checkTranslations(item, field) {
    if (!item || typeof item !== 'object') return;
    if ('en' in item || 'zh' in item) {
      for (const locale of enabled) if (typeof item[locale] !== 'string') context.addIssue({ code: 'custom', path: [...field, locale], message: 'Provide every enabled translation' });
    } else for (const [key, child] of Object.entries(item)) checkTranslations(child, [...field, key]);
  }
  checkTranslations(value.profile, ['profile']);
  if (value.site?.brand) for (const locale of enabled) if (!value.site.brand[locale]) context.addIssue({ code: 'custom', path: ['site', 'brand', locale], message: 'Provide every enabled translation' });
});

export function parseCustomization(input) {
  const result = customizationSchema.safeParse(input);
  if (!result.success) throw new Error(result.error.issues.map(issue => `customization.${issue.path.join('.')}: ${issue.message}`).join('\n'));
  return result.data;
}
const localize = value => ({ en: value.en ?? value.zh, zh: value.zh ?? value.en });
function normalize(value) {
  if (!value || typeof value !== 'object') return value;
  if ('en' in value || 'zh' in value) return localize(value);
  if (Array.isArray(value)) return value.map(normalize);
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, normalize(child)]));
}

/** @template T @param {T} base @param {ReturnType<typeof parseCustomization>} settings @returns {T} */
export function customizeProfile(base, settings) {
  return { ...base, ...normalize(settings.profile) };
}

/** @template T @param {T} base @param {ReturnType<typeof parseCustomization>} settings @returns {T} */
export function customizeSite(base, settings) {
  const patch = settings.site ?? {};
  return { ...base, ...patch,
    ...(patch.brand ? { brand: localize(patch.brand) } : {}),
    appearance: { ...base.appearance, ...patch.appearance }, pages: { ...base.pages, ...patch.pages },
    defaultLocale: patch.defaultLocale ?? patch.enabledLocales?.[0] ?? base.defaultLocale,
    home: patch.home ?? base.home,
  };
}

/** @template {{slug: string}} T @param {T[]} items @param {string} kind @param {ReturnType<typeof parseCustomization>} settings @returns {T[]} */
export function filterStarterContent(items, kind, settings) {
  if (!settings.content?.hideStarterContent) return items;
  const reserved = kind === 'projects' ? ['ai-portfolio-kit'] : ['evidence-first-ai', 'own-your-kit'];
  return items.filter(item => !reserved.includes(item.slug));
}
