import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { appearanceAttributes, appearanceSchema, presets } from '@/config/appearance';
import { site, siteSchema } from '@/config/site';
import { AppearanceSwitcher } from '@/components/appearance-switcher';

describe('appearance configuration and server fallback', () => {
  it('migrates existing site configuration without an appearance field', () => {
    const { appearance: _appearance, ...legacy } = site;
    expect(_appearance).toBeDefined();
    expect(siteSchema.parse(legacy).appearance).toEqual({ preset: 'editorial', motion: 'full', allowSwitching: true });
  });
  it('assigns distinct layouts and default presentation without changing content', () => {
    const settings = appearanceSchema.parse({});
    const attributes = presets.map(preset => appearanceAttributes(settings, preset));
    expect(attributes.map(value => value['data-palette'])).toEqual(['forest', 'blueprint', 'paper']);
    expect(attributes.map(value => value['data-preset'])).toEqual([...presets]);
    expect(attributes[2]['data-density']).toBe('compact');
  });
  it('respects independent overrides for every preset and rejects invalid settings', () => {
    const config = appearanceSchema.parse({ palette: 'paper', typography: 'sans', density: 'compact', mediaRatio: 'square', motion: 'reduced' });
    for (const preset of presets) expect(appearanceAttributes(config, preset)).toMatchObject({ 'data-palette': 'paper', 'data-typography': 'sans', 'data-density': 'compact', 'data-media-ratio': 'square', 'data-motion': 'reduced' });
    for (const invalid of [{ preset: 'unknown' }, { mediaRatio: 'remote' }, { motion: 'fast' }, { palette: 'invalid' }]) expect(() => appearanceSchema.parse(invalid)).toThrow();
  });
  it('renders the configured selection on the server and supports locked appearance', () => {
    const config = appearanceSchema.parse({ preset: 'engineering' });
    const html = renderToStaticMarkup(<AppearanceSwitcher locale="zh" config={config} />);
    expect(html).toContain('aria-pressed="true">工程式');
    expect(html).toContain('启用 JavaScript');
    expect(renderToStaticMarkup(<AppearanceSwitcher locale="en" config={{ ...config, allowSwitching: false }} />)).toBe('');
  });
});
