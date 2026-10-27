import Link from 'next/link';
import { text, type Locale } from '@/lib/i18n';
import type { Portfolio } from '@/lib/configuration';
export function Footer({ locale, content }: { locale: Locale; content: Portfolio }) {
  const { site } = content;
  const contact = content.contact(locale);
  return <footer className="site-footer">
    <div className="footer-top"><p>{site.footer.statement[locale]}</p>
      <div>{content.enabled('resume') && <><Link href={`/${locale}/resume`}>{text(locale, 'Read the resume', '阅读简历')} ↗</Link><br /></>}
        {contact && <a href={contact.href}>{contact.label} ↗</a>}</div>
      <p>{site.footer.showTemplateCredit && <>{site.template.repository ? <a href={site.template.repository}>{site.template.name} ↗</a> : site.template.name}<br /></>}{text(locale, 'Public sources only', '仅使用公开资料')}</p></div>
    <p className="footer-word">{site.footer.wordmark}</p><p className="footer-legal">{site.footer.signature[locale]}</p>
  </footer>;
}
