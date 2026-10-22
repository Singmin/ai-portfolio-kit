import { notFound } from 'next/navigation';
export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];
export type Localized = Record<Locale, string>;
export function isLocale(value: string): value is Locale { return locales.includes(value as Locale); }
export function requireLocale(value: string): Locale { if (!isLocale(value)) notFound(); return value; }
export const text = (locale: Locale, en: string, zh: string) => locale === 'zh' ? zh : en;
export const nav = [
  { path: 'resume', en: 'Resume', zh: '简历' },
  { path: 'projects', en: 'Projects', zh: '作品' },
  { path: 'blog', en: 'Writing', zh: '文章' },
  { path: 'contributions', en: 'Open source', zh: '开源' },
] as const;
