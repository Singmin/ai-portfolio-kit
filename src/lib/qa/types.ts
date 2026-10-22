export type Citation = { id: string; title: string; url: string; excerpt: string };
export type Answer = { mode: 'offline' | 'ai-assisted' | 'fallback'; message: string; sources: Citation[] };
