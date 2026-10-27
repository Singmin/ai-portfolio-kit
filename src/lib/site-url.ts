import { customization } from '@/config/customization';
export function getSiteUrl(): string | undefined { return process.env.SITE_URL || customization.seo?.url; }
