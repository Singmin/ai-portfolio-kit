import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '@/config/projects';
import type { Locale } from '@/lib/i18n';
export function ProjectMedia({ project, locale, linkToProject = false }: { project: Project; locale: Locale; linkToProject?: boolean }) {
  const media = [...(project.cover ? [project.cover] : []), ...(project.screenshots ?? [])];
  if (!media.length) return null;
  return <div className="preview-gallery">{media.map((item, i) => {
    const figure = <figure><Image src={item.src} width={1000} height={750} alt={item.alt[locale]} unoptimized />{item.caption && <figcaption>{item.caption[locale]}{linkToProject && ' ↗'}</figcaption>}</figure>;
    return linkToProject ? <Link key={`${item.src}:${i}`} href={`/${locale}/projects/${project.slug}`}>{figure}</Link> : <div key={`${item.src}:${i}`}>{figure}</div>;
  })}</div>;
}
