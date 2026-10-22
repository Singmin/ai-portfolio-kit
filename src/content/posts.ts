import type { ComponentType } from 'react';
import type { Locale, Localized } from '@/lib/i18n';
import EvidenceEn from './posts/evidence.en.mdx';
import EvidenceZh from './posts/evidence.zh.mdx';
import KitEn from './posts/own-your-kit.en.mdx';
import KitZh from './posts/own-your-kit.zh.mdx';
export const posts: {
  slug: string; date: string; title: Localized; excerpt: Localized;
  tags: string[]; components: Record<Locale, ComponentType>;
}[] = [
  { slug: 'evidence-first-ai', date: '2026-10-23', tags: ['AI', 'Engineering'],
    title: { en: 'Let the source do the talking', zh: '让来源说话' },
    excerpt: { en: 'Why this portfolio returns public excerpts instead of invented answers.', zh: '为什么这个作品集返回公开原文，而不凭空生成个人经历。' },
    components: { en: EvidenceEn, zh: EvidenceZh } },
  { slug: 'own-your-kit', date: '2026-10-23', tags: ['Open source', 'Next.js'],
    title: { en: 'Make this space your own', zh: '把这个空间变成你的' },
    excerpt: { en: 'A small guide to the profile, MDX writing, and contribution record.', zh: '从个人资料、MDX 文章到贡献记录，一份简短的定制指南。' },
    components: { en: KitEn, zh: KitZh } },
];
