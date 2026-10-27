import type { Metadata } from 'next';
import { requirePage } from '@/lib/page-access';
import { requireLocale, text } from '@/lib/i18n';
import { AskForm } from '@/components/ask-form';
import { portfolio } from '@/lib/portfolio';
import { buildPublicSources, suggestedQuestions } from '@/lib/qa/public-sources';
export const metadata: Metadata = { title: 'Ask the portfolio / 作品集问答' };
export default async function Ask({ params }: { params: Promise<{ locale: string }> }) {
  requirePage('ask');
  const locale = requireLocale((await params).locale);
  const sources = buildPublicSources(locale, portfolio);
  const staticMode = process.env.PORTFOLIO_STATIC_EXPORT === '1';
  const offlineSources = staticMode ? sources.map(({ id, title, url, excerpt, revision, keywords }) => ({ id, title, url, excerpt, revision, keywords })) : undefined;
  return <div className="document-page page-pad ask-page"><h1>{text(locale, 'Ask. Then inspect.', '提问，也查看依据。')}</h1><p className="page-intro">{staticMode ? text(locale, 'Search authorized public passages in your browser and follow their sources. Responses remain original excerpts; missing evidence stays unknown.', '在浏览器中检索已授权的公开段落，查看对应来源。回答仍为原文摘录；资料不足时会明确说明。') : text(locale, 'Search authorized public passages and follow their sources. Optional AI selects relevant sources; responses remain original excerpts. Missing evidence stays unknown.', '检索已授权的公开段落，查看对应来源。可选 AI 只筛选相关来源，回答仍为原文摘录；资料不足时会明确说明。')}</p><AskForm locale={locale} suggestions={suggestedQuestions(locale, sources)} hasSources={sources.length > 0} browseHref={`/${locale}`} offlineSources={offlineSources} /><p className="privacy-note">{staticMode ? text(locale, 'This static preview searches in your browser. Questions are not sent to a server or model, and paid AI is not enabled.', '此静态预览在你的浏览器中检索，问题不会发送到服务器或模型，未启用付费 AI。') : text(locale, 'Do not include private information. If optional AI is configured, your question and up to three matching, explicitly authorized public excerpts are sent to OpenAI. This app does not save questions. Without a key, retrieval stays on this server.', '请勿输入私人信息。配置可选 AI 时，问题及最多三条匹配且明确获准的公开摘录会发送到 OpenAI。本应用不保存问题；未配置 Key 时，检索在本站服务器内进行。')}</p></div>;
}
