'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { text, type Locale } from '@/lib/i18n';
import type { Answer } from '@/lib/qa/types';
import { rankSources } from '@/lib/qa/rank';
import type { Citation } from '@/lib/qa/types';
export function AskForm({ locale, suggestions = [], browseHref, hasSources = true, offlineSources }: { locale: Locale; suggestions?: string[]; browseHref?: string; hasSources?: boolean; offlineSources?: (Citation & { keywords: string })[] }) {
  const [question, setQuestion] = useState(''); const [answer, setAnswer] = useState<Answer | null>(null);
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!hasSources || pending) return; setPending(true); setError(''); setAnswer(null);
    if (offlineSources) {
      const sources = rankSources(question, offlineSources).map(({ id, title, url, excerpt, revision }) => ({ id, title, url, excerpt, revision }));
      setAnswer({ mode: 'offline', sources, message: sources.length ? text(locale, 'Original excerpts from the public portfolio:', '以下内容摘自作品集公开资料：') : text(locale, 'No authorized public passage answers that question. You can inspect the public pages for more context.', '已授权的公开资料中没有这个问题的答案。可直接阅读公开页面了解更多。') });
      setPending(false); return;
    }
    try { const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, locale }), signal: AbortSignal.timeout(16000) });
      if (!response.ok) { if (response.status === 429) throw new Error(text(locale, 'Too many questions. Please wait a minute and try again.', '提问次数过多，请稍等一分钟后重试。')); throw new Error(text(locale, 'The answer is unavailable. Try again, or browse the public pages.', '暂时无法获取答案，请重试或直接阅读公开页面。')); }
      setAnswer(await response.json() as Answer);
    } catch (e) { setError(e instanceof Error && e.name !== 'TimeoutError' ? e.message : text(locale, 'The request timed out. Please try again.', '请求超时，请重试。')); }
    finally { setPending(false); }
  }
  return <div className="qa"><form onSubmit={submit}><label htmlFor="question">{text(locale, 'Your question', '你的问题')}</label><textarea id="question" name="question" value={question} onChange={e => setQuestion(e.target.value)} minLength={2} maxLength={500} required rows={3} placeholder={text(locale, 'What would you like to know about the work?', '想了解作品的哪些方面？')} aria-describedby="question-help" />
    <div className="question-actions"><span id="question-help">{question.length} / 500</span><button className="button" type="submit" disabled={!hasSources || pending || question.trim().length < 2}>{pending ? text(locale, 'Finding sources…', '正在查找资料…') : text(locale, 'Find sources', '查找来源')} <span aria-hidden="true">↗</span></button></div>
    <div className="suggestions">{suggestions.map(s => <button type="button" key={s} disabled={pending} onClick={() => { setQuestion(s); document.getElementById('question')?.focus(); }}>{s}</button>)}</div></form>
    <div className="answer-region" aria-live="polite" aria-busy={pending}>{error && <p role="alert" className="error">{error}</p>}{answer && <section><p className="mode">{text(locale, { offline: 'Public-source search', 'ai-assisted': 'AI-assisted source selection', fallback: 'Public-source search · AI unavailable' }[answer.mode], { offline: '公开资料检索', 'ai-assisted': 'AI 辅助筛选来源', fallback: '公开资料检索 · AI 暂不可用' }[answer.mode])}</p><h2>{text(locale, 'What the sources say', '公开资料怎么说')}</h2><p>{answer.message}</p>{answer.sources.map(s => <blockquote key={s.id}><p>{s.excerpt}</p><cite><Link href={s.url}>{s.title} ↗</Link></cite></blockquote>)}</section>}</div>
    {!hasSources && <p>{text(locale, 'No public passages have been authorized for this language yet.', '当前语言尚无获准检索的公开段落。')}</p>}
    <noscript><p>{text(locale, 'The source search needs JavaScript. You can still read the public pages.', '资料检索需要 JavaScript，仍可直接阅读公开页面。')} {browseHref && <Link href={browseHref}>{text(locale, 'Browse public pages', '阅读公开页面')} ↗</Link>}</p></noscript>
  </div>;
}
