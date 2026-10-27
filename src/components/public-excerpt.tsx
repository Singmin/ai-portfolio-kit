import type { ReactNode } from 'react';

export function PublicExcerpt({ id, children }: { id: string; children: ReactNode }) {
  return <section id={`evidence-${id}`} data-public-excerpt={id}>{children}</section>;
}
