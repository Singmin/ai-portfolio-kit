import input from './customization.json';
import { parseCustomization } from './customization-schema.mjs';
// This file is bundled for readers. Public settings only; never put credentials here.
export const customization = parseCustomization(input);
