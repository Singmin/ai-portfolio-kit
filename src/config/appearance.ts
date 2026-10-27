import { z } from 'zod';

export const presets = ['editorial', 'engineering', 'resume'] as const;
export type Preset = typeof presets[number];
export const appearanceSchema = z.object({
  preset: z.enum(presets).default('editorial'),
  palette: z.enum(['forest', 'blueprint', 'paper']).optional(),
  typography: z.enum(['expressive', 'sans']).optional(),
  density: z.enum(['comfortable', 'compact']).optional(),
  mediaRatio: z.enum(['landscape', 'square', 'native']).optional(),
  motion: z.enum(['full', 'reduced']).default('full'),
  allowSwitching: z.boolean().default(true),
});
export type Appearance = z.infer<typeof appearanceSchema>;

const defaults = {
  editorial: { palette: 'forest', typography: 'expressive', density: 'comfortable', mediaRatio: 'landscape' },
  engineering: { palette: 'blueprint', typography: 'sans', density: 'comfortable', mediaRatio: 'landscape' },
  resume: { palette: 'paper', typography: 'sans', density: 'compact', mediaRatio: 'native' },
} as const;

export function appearanceAttributes(config: Appearance, preset: Preset = config.preset) {
  const base = defaults[preset];
  return {
    'data-preset': preset,
    'data-palette': config.palette ?? base.palette,
    'data-typography': config.typography ?? base.typography,
    'data-density': config.density ?? base.density,
    'data-media-ratio': config.mediaRatio ?? base.mediaRatio,
    'data-motion': config.motion,
  };
}
