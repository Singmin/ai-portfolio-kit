import type { Localized } from '@/lib/i18n';

// All entries in this file are PUBLIC. Replace the clearly labelled sample
// identity before publication. Do not put addresses, credentials, or private CVs here.
export const profile = {
  isExample: true,
  name: { en: 'Your name', zh: '你的名字' } satisfies Localized,
  role: { en: 'Software engineer', zh: '软件工程师' } satisfies Localized,
  headline: { en: 'Work, with evidence.', zh: '用作品，讲清能力。' } satisfies Localized,
  summary: {
    en: 'A personal space for the things I build, the ideas I write down, and the work I share in the open.',
    zh: '在这里记录我构建的作品、写下的思考，以及公开分享的工程实践。',
  } satisfies Localized,
  bio: {
    en: 'This is a working portfolio starter. Add your public experience, explain your project decisions, and link the evidence a reader can inspect.',
    zh: '这是一个已经可以运行的作品集模板。写入真实公开的经历，说明项目背后的判断，并附上读者可以核验的来源。',
  } satisfies Localized,
  location: { en: 'Add your city', zh: '填写所在城市' } satisfies Localized,
  email: null as string | null,
  github: null as string | null,
  skills: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'MDX'],
  experience: [] as { company: string; period: string; role: Localized; description: Localized }[],
  education: [] as { institution: string; period: string; degree: Localized }[],
};
