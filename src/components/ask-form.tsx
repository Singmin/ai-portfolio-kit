'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { text, type Locale } from '@/lib/i18n';
import type { Answer } from '@/lib/qa/types';
export function AskForm({ locale }: { locale: Locale }) {
  const [question, setQuestion] = useState(''); const [answer, setAnswer] = useState<Answer | null>(null);
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); if (pending) return; setPending(true); setError(''); setAnswer(null);
    try { const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, locale }), signal: AbortSignal.timeout(16000) });
      if (!response.ok) { if (response.status === 429) throw new Error(text(locale, 'Too many questions. Please wait a minute and try again.', '提问次数过多，请稍等一分钟后重试。')); throw new Error(text(locale, 'The answer is unavailable. Try again, or browse the public pages.', '暂时无法获取答案，请重试或直接阅读公开页面。')); }
      setAnswer(await response.json() as Answer);
    } catch (e) { setError(e instanceof Error && e.name !== 'TimeoutError' ? e.message : text(locale, 'The request timed out. Please try again.', '请求超时，请重试。')); }
    finally { setPending(false); }
  }
  const suggestions = locale === 'zh' ? ['这个项目的技术栈是什么？', '如何定制个人资料？', 'AI 问答如何安全降级？'] : ['What is the technology stack?', 'How do I customize the profile?', 'How does AI work without a key?'];
  return <div className="qa"><form onSubmit={submit}><label htmlFor="question">{text(locale, 'Your question', '你的问题')}</label><textarea id="question" name="question" value={question} onChange={e => setQuestion(e.target.value)} minLength={2} maxLength={500} required rows={3} placeholder={text(locale, 'What would you like to know about the work?', '想了解作品的哪些方面？')} aria-describedby="question-help" />
    <div className="question-actions"><span id="question-help">{question.length} / 500</span><button className="button" type="submit" disabled={pending || question.trim().length < 2}>{pending ? text(locale, 'Finding sources…', '正在查找资料…') : text(locale, 'Find an answer', '查找答案')} <span aria-hidden="true">↗</span></button></div>
    <div className="suggestions">{suggestions.map(s => <button type="button" key={s} disabled={pending} onClick={() => { setQuestion(s); document.getElementById('question')?.focus(); }}>{s}</button>)}</div></form>
    <div className="answer-region" aria-live="polite" aria-busy={pending}>{error && <p role="alert" className="error">{error}</p>}{answer && <section><p className="mode">{text(locale, { offline: 'Public-source search', 'ai-assisted': 'AI-assisted source selection', fallback: 'Public-source search · AI unavailable' }[answer.mode], { offline: '公开资料检索', 'ai-assisted': 'AI 辅助筛选来源', fallback: '公开资料检索 · AI 暂不可用' }[answer.mode])}</p><h2>{text(locale, 'What the sources say', '公开资料怎么说')}</h2><p>{answer.message}</p>{answer.sources.map(s => <blockquote key={s.id}><p>{s.excerpt}</p><cite><Link href={s.url}>{s.title} ↗</Link></cite></blockquote>)}</section>}</div>
    <noscript><p>{text(locale, 'The question form needs JavaScript. You can still read every public source.', '问答表单需要 JavaScript，仍可直接阅读所有公开资料。')} <Link href={`/${locale}/projects`}>{text(locale, 'Browse projects', '阅读项目')} ↗</Link></p></noscript>
  </div>;
}
