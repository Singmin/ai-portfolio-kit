import type { Metadata } from 'next';
import { requireLocale, text } from '@/lib/i18n';
import { AskForm } from '@/components/ask-form';
export const metadata: Metadata = { title: 'Ask the portfolio / 作品集问答' };
export default async function Ask({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  return <div className="document-page page-pad ask-page"><h1>{text(locale, 'Ask. Then inspect.', '提问，也查看依据。')}</h1><p className="page-intro">{text(locale, 'Find answers in the public portfolio. Every answer is an original excerpt, linked to its source.', '从作品集的公开内容中查找答案。每条回答都是原文摘录，并附有来源链接。')}</p><AskForm locale={locale} /><p className="privacy-note">{text(locale, 'Do not include private information. If the optional AI is enabled, your question and matching public passages are sent to OpenAI. Questions are not saved by this app. Without a key, all retrieval stays on this server.', '请勿输入私人信息。启用可选 AI 时，问题及匹配的公开段落会发送到 OpenAI。本应用不保存问题；未配置 Key 时，检索完全在本站服务器内进行。')}</p></div>;
}
