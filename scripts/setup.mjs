import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { readCustomization, writeDraft, applyDraft } from './setup-io.mjs';
import { parseCustomization } from '../src/config/customization-schema.mjs';

const { values } = parseArgs({ options: { input: { type: 'string' }, output: { type: 'string' }, apply: { type: 'boolean' }, help: { type: 'boolean' } } });
async function wizard() {
  if (!process.stdin.isTTY) throw new Error('setup: open an interactive terminal, or use --input <public-settings.json>');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (label, fallback = '') => (await rl.question(`${label}${fallback ? ` [${fallback}]` : ''}: `)).trim() || fallback;
  try {
    console.log('Portfolio setup / 作品集初始化\n只填写准备公开的资料；不要填写 Key、私人简历或凭据。默认生成草稿供检查。');
    const choice = await ask('语言 Languages: zh / en / both', 'zh');
    if (!['zh', 'en', 'both'].includes(choice)) throw new Error('site.enabledLocales: choose zh, en or both');
    const enabledLocales = choice === 'both' ? ['zh', 'en'] : [choice];
    const defaultLocale = choice === 'both' ? await ask('默认语言 Default language: zh / en', 'zh') : choice;
    const preset = await ask('主题 Preset: editorial / engineering / resume', 'editorial');
    const profile = { aiIndex: false, skills: [], email: null, github: null };
    const brand = {};
    for (const locale of enabledLocales) {
      for (const [field, label] of [['name', '公开姓名 Name'], ['role', '公开角色 Role'], ['headline', '首页标题 Headline'], ['summary', '站点简介 Summary'], ['bio', '个人简介 Bio'], ['location', '所在地区 Location（可留空）']]) {
        profile[field] ??= {}; profile[field][locale] = await ask(`${label} (${locale})`);
      }
      brand[locale] = await ask(`站点品牌 Brand (${locale})`, profile.name[locale]);
    }
    profile.skills = (await ask('真实公开技能 Skills，逗号分隔（可留空）')).split(',').map(value => value.trim()).filter(Boolean);
    profile.email = await ask('公开邮箱 Email（可留空）') || null;
    profile.github = await ask('公开 GitHub URL（可留空）') || null;
    profile.isExample = (await ask('这些资料仍是示例？Example data: y / n', 'y')).toLowerCase() !== 'n';
    const selectedPages = (await ask('启用页面 Pages，逗号分隔：resume,projects,blog,contributions,ask（none 为全部关闭）', 'resume,projects,blog,contributions')).split(',').map(value => value.trim());
    const pageIds = ['resume', 'projects', 'blog', 'contributions', 'ask'];
    if (selectedPages.some(value => value !== 'none' && !pageIds.includes(value)) || (selectedPages.includes('none') && selectedPages.length !== 1)) throw new Error('site.pages: choose known pages or none');
    const moduleIds = ['projects', 'posts', 'experience', 'contributions', 'about', 'contact', 'assistant'];
    const selectedModules = (await ask(`首页模块顺序 Modules: ${moduleIds.join(',')}（none 为全部隐藏）`, 'projects,posts,experience,about,contact')).split(',').map(value => value.trim());
    if (selectedModules.some(value => value !== 'none' && !moduleIds.includes(value)) || (selectedModules.includes('none') && selectedModules.length !== 1)) throw new Error('site.home.modules: choose known modules or none');
    const keepStarter = (await ask('保留模板项目与两篇说明文章（包含原有来源授权）？y / n', 'n')).toLowerCase() === 'y';
    const publicUrl = await ask('最终公开域名 Origin，例如 https://your-domain.com（可留空稍后配置）');
    return parseCustomization({ version: 1, profile,
      site: { brand, enabledLocales, defaultLocale, appearance: { preset },
        pages: Object.fromEntries(pageIds.map(page => [page, selectedPages.includes(page)])),
        navigation: pageIds.filter(page => selectedPages.includes(page) && page !== 'ask'),
        home: { modules: selectedModules.filter(type => type !== 'none').map(type => ({ type, enabled: true })) } },
      content: { hideStarterContent: !keepStarter }, ...(publicUrl ? { seo: { url: publicUrl } } : {}),
    });
  } finally { rl.close(); }
}

try {
  if (values.help) console.log('npm run setup\nnpm run setup -- --input <public-settings.json> [--output <new-file.json>]\nnpm run setup -- --apply --input <reviewed-draft.json>\nDraft creation never overwrites an existing file. Apply saves a backup first.');
  else if (values.apply) {
    if (!values.input || values.output) throw new Error('setup: --apply requires --input and does not accept --output');
    const result = applyDraft(process.cwd(), readCustomization(values.input));
    console.log(JSON.stringify(result, null, 2)); console.log('Applied public settings. Run npm run publish:check before release.');
  } else {
    const input = values.input ? readCustomization(values.input) : await wizard();
    const file = writeDraft(process.cwd(), input, values.output);
    console.log(`Draft: ${file}\nPreview: npm run setup:preview -- --file "${file}"\nApply after review: npm run setup -- --apply --input "${file}"`);
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
