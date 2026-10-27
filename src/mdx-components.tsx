import type { MDXComponents } from 'mdx/types';
import { PublicExcerpt } from '@/components/public-excerpt';
export function useMDXComponents(components: MDXComponents): MDXComponents { return { PublicExcerpt, ...components }; }
