import { z } from 'zod';
const translation = z.object({ title: z.string().trim().min(1), excerpt: z.string().trim().min(1) }).strict();
export const postSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.enum(['published', 'draft', 'example']), date: z.iso.date(),
  aiIndex: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1)),
  translations: z.object({ en: translation.optional(), zh: translation.optional() }).strict()
    .refine(value => !!(value.en || value.zh), 'Provide at least one translation'),
}).strict();
