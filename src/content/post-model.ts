import { z } from 'zod';
import type { Locale } from '@/lib/i18n';
import { postSchema as registrationSchema } from './post-schema.mjs';
const passageSchema = z.array(z.object({ id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), excerpt: z.string().min(1).max(2000) })).max(12);
export const postSchema = registrationSchema.extend({ passages: z.object({ en: passageSchema.optional(), zh: passageSchema.optional() }).optional() });
export type PostMetadata = z.infer<typeof postSchema>;
export type PostEntry = Omit<PostMetadata, 'translations'> & { title: string; excerpt: string; locale: Locale };
