import { text, type Locale } from '@/lib/i18n';
import type { Portfolio } from '@/lib/configuration';
export function ContributionsView({ locale, content }: { locale: Locale; content: Portfolio }) {
  return <div className="document-page page-pad"><h1>{text(locale, 'Out in the open.', '把实践，放到开源。')}</h1><p className="page-intro">{text(locale, 'A record of public work, with the links to inspect it.', '记录公开的工程实践，让每一项贡献都有据可查。')}</p>
    <section className="contribution-log"><h2>{text(locale, 'Contribution record', '贡献记录')}</h2>{content.contributions.length ? content.contributions.map(item => <article key={item.url}><h3><a href={item.url}>{item.title} ↗</a></h3><p>{item.status} · {item.summary[locale]}</p></article>) : <><p className="lead">{text(locale, 'No external contributions added yet.', '暂未添加外部社区贡献。')}</p><p>{text(locale, 'Only verified public contributions are listed here.', '这里只记录可核验的公开贡献。')}</p></>}</section>
  </div>;
}
