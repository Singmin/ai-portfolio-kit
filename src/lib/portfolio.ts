import { site } from '@/config/site';
import { profile } from '@/config/profile';
import { projects } from '@/config/projects';
import { contributions } from '@/config/contributions';
import { postMetadata } from '@/content/post-metadata';
import { createPortfolio } from './configuration';
import { validatePublicContent } from '../../scripts/validate-public-content.mjs';
import { customization } from '@/config/customization';
import { filterStarterContent } from '@/config/customization-schema.mjs';
import { getSiteUrl } from './site-url';
// One validated public configuration, shared by pages, navigation, sitemap and Q&A.
const publicProjects = filterStarterContent(projects, 'projects', customization);
const publicPosts = filterStarterContent(postMetadata, 'posts', customization);
const hiddenSlugs = new Set(projects.filter(project => !publicProjects.some(item => item.slug === project.slug)).map(project => project.slug));
const publicSite = customization.content?.hideStarterContent ? { ...site, home: { modules: site.home.modules.map(module => {
  if (!module.featured?.length) return module;
  const featured = module.featured.filter(slug => !hiddenSlugs.has(slug));
  return { ...module, featured: featured.length ? featured : undefined };
}) } } : site;
export const portfolio = createPortfolio({ site: publicSite, profile, projects: publicProjects, posts: publicPosts, contributions });
if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
  validatePublicContent(process.cwd(), portfolio, getSiteUrl());
}
