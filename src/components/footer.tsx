import Link from 'next/link';
import { profile } from '@/config/profile';
import { text, type Locale } from '@/lib/i18n';
export function Footer({ locale }: { locale: Locale }) {
  return <footer className="site-footer">
    <div className="footer-top"><p>{text(locale, 'A personal portfolio. An open foundation.', '一个个人作品集，一份开放的基础。')}</p>
      <div><Link href={`/${locale}/resume`}>{text(locale, 'Read the resume', '阅读简历')} ↗</Link><br />
        {profile.email ? <a href={`mailto:${profile.email}`}>{profile.email}</a> : <Link href={`/${locale}/blog/own-your-kit`}>{text(locale, 'Make it yours', '开始定制')} ↗</Link>}</div>
      <p>{text(locale, 'Template code: MIT', '模板代码：MIT')}<br />{text(locale, 'Public sources only', '仅使用公开资料')}</p></div>
    <p className="footer-word">PORTFOLIO</p><p className="footer-legal">AI Portfolio Kit · {text(locale, 'Built to be inspected.', '让作品经得起核验。')}</p>
  </footer>;
}
