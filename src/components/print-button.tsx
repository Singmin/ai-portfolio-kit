'use client';
import { text, type Locale } from '@/lib/i18n';
export function PrintButton({ locale }: { locale: Locale }) { return <button className="button print-button" onClick={() => window.print()}>{text(locale, 'Print / save PDF', '打印 / 保存 PDF')} ↗</button>; }
