import type { Metadata } from 'next';
import { requireLocale } from '@/lib/i18n';
import { portfolio } from '@/lib/portfolio';
import { requirePage } from '@/lib/page-access';
import { ProjectsView } from '@/components/project-views';
export const metadata: Metadata = { title: 'Projects / 项目作品' };
export default async function Projects({ params }: { params: Promise<{ locale: string }> }) {
  requirePage('projects');
  return <ProjectsView locale={requireLocale((await params).locale)} content={portfolio} />;
}
