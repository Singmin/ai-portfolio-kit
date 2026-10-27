import { portfolio } from '@/lib/portfolio';
import { sitemapEntries } from '@/lib/sitemap-entries';
import { getSiteUrl } from '@/lib/site-url';
export default function sitemap() { return sitemapEntries(portfolio, getSiteUrl()); }
