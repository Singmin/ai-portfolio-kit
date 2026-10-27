import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireLocale, locales } from '@/lib/i18n';
import { portfolio } from '@/lib/portfolio';
import { requirePage } from '@/lib/page-access';
import { ProjectView } from '@/components/project-views';
type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() { return portfolio.enabled('projects') ? locales.flatMap(locale => portfolio.projects.map(project => ({ locale, slug: project.slug }))) : []; }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  requirePage('projects');
  const { slug } = await params;
  const project = portfolio.projects.find(item => item.slug === slug);
  if (!project) notFound();
  return { title: project.name };
}
export default async function ProjectPage({ params }: Props) {
  requirePage('projects');
  const { locale: value, slug } = await params;
  const locale = requireLocale(value);
  const project = portfolio.projects.find(item => item.slug === slug);
  if (!project) notFound();
  return <ProjectView locale={locale} project={project} />;
}
