'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { appearanceAttributes, presets, type Appearance, type Preset } from '@/config/appearance';
import { text, type Locale } from '@/lib/i18n';

const storageKey = 'portfolio-reading-preset-v1';
const eventName = 'portfolio-reading-change';
let memoryPreset: string | null = null;
function subscribe(listener: () => void) {
  const onStorage = () => { memoryPreset = null; listener(); };
  window.addEventListener('storage', onStorage);
  window.addEventListener(eventName, listener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(eventName, listener);
  };
}
function snapshot() {
  try { return memoryPreset ?? window.localStorage.getItem(storageKey); }
  catch { return memoryPreset; }
}
const serverSnapshot = () => null;
const subscribeReady = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
function savePreset(value: Preset) {
  memoryPreset = value;
  try { window.localStorage.setItem(storageKey, value); } catch { /* Reading modes also work without storage. */ }
  window.dispatchEvent(new Event(eventName));
}
const labels = {
  editorial: { en: 'Editorial', zh: '编辑式' },
  engineering: { en: 'Engineering', zh: '工程式' },
  resume: { en: 'Resume', zh: '履历式' },
};
const descriptions = {
  editorial: { en: 'Room for the work and its story.', zh: '大字与留白，顺着作品读故事。' },
  engineering: { en: 'Decisions, implementation, evidence.', zh: '展开技术决策，查看实现与依据。' },
  resume: { en: 'A concise view for a closer read.', zh: '紧凑排列，快速了解经历与作品。' },
};

export function AppearanceSwitcher({ locale, config }: { locale: Locale; config: Appearance }) {
  const stored = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const ready = useSyncExternalStore(subscribeReady, clientReady, serverReady);
  const preset = config.allowSwitching && presets.includes(stored as Preset) ? stored as Preset : config.preset;
  useEffect(() => {
    for (const [key, value] of Object.entries(appearanceAttributes(config, preset))) {
      document.documentElement.setAttribute(key, value);
    }
  }, [config, preset]);

  if (!config.allowSwitching) return null;
  return <div className="appearance-bar page-pad" data-ui>
    <div className="appearance-controls" role="group" aria-label={text(locale, 'Reading style', '阅读方式')}>
      <span>{text(locale, 'Reading style', '阅读方式')}</span>
      {presets.map(value => <button type="button" key={value} disabled={!ready} aria-pressed={value === preset} onClick={() => savePreset(value)}>{labels[value][locale]}</button>)}
    </div>
    <p className="appearance-description" aria-live="polite">{descriptions[preset][locale]}</p>
    {!ready && <p className="appearance-fallback">{text(locale, 'The configured reading style is shown. Enable JavaScript to switch styles.', '当前显示配置的阅读方式，启用 JavaScript 后可切换。')}</p>}
  </div>;
}
