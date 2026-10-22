import type { MetadataRoute } from 'next';
import { profile } from '@/config/profile';
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: '*', disallow: profile.isExample ? '/' : '/api/' }, sitemap: process.env.SITE_URL ? `${new URL(process.env.SITE_URL).origin}/sitemap.xml` : undefined }; }
