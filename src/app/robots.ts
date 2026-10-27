import type { MetadataRoute } from 'next';
import { profile } from '@/config/profile';
import { getSiteUrl } from '@/lib/site-url';
export default function robots(): MetadataRoute.Robots { const url = getSiteUrl(); return { rules: { userAgent: '*', disallow: profile.isExample ? '/' : '/api/' }, sitemap: url ? `${new URL(url).origin}/sitemap.xml` : undefined }; }
