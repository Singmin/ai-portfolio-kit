import type { Metadata } from 'next';
import Link from 'next/link';
import { contributions } from '@/config/contributions';
import { requireLocale, text } from '@/lib/i18n';
export const metadata: Metadata = { title: 'Open source / 开源贡献' };
export default async function Contributions({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  return <div className="document-page page-pad"><h1>{text(locale, 'Out in the open.', '把实践，放到开源。')}</h1><p className="page-intro">{text(locale, 'A record of public work, with the links to inspect it.', '记录公开的工程实践，让每一项贡献都有据可查。')}</p>
    <section className="contribution-intro"><h2>AI Portfolio Kit</h2><div><p>{text(locale, 'An independent local repository, prepared for reuse under the MIT license. A public remote has not been configured.', '一个独立的本地仓库，使用 MIT 许可证，可作为模板复用。尚未配置公开远程仓库。')}</p><Link className="text-link" href={`/${locale}/projects/ai-portfolio-kit`}>{text(locale, 'Explore the project', '查看项目详情')} ↗</Link></div></section>
    <section className="contribution-log"><h2>{text(locale, 'Contribution record', '贡献记录')}</h2>{contributions.length ? contributions.map(c => <article key={c.url}><h3><a href={c.url}>{c.title} ↗</a></h3><p>{c.status} · {c.summary[locale]}</p></article>) : <><p className="lead">{text(locale, 'No external contributions added yet.', '暂未添加外部社区贡献。')}</p><p>{text(locale, 'Add a verified public pull request, its status, and a short explanation. Local work is not presented as a merged community contribution.', '可添加已核实的公开 Pull Request、实际状态和简要说明。本地工作不等同于已合并的社区贡献。')}</p></>}</section>
    <Link className="text-link" href={`/${locale}/blog/own-your-kit`}>{text(locale, 'How to reuse this kit', '如何复用这个模板')} ↗</Link>
  </div>;
}
