import { redirect } from 'next/navigation';
import { portfolio } from '@/lib/portfolio';
export default function Index() { redirect(`/${portfolio.site.defaultLocale}`); }
