import type { Localized } from '@/lib/i18n';
export type Contribution = { title: string; url: string; status: 'open' | 'merged' | 'closed'; summary: Localized };
// Only add verified public contribution URLs and their actual status.
export const contributions: Contribution[] = [];
