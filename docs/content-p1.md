# 内容与语言配置（P1-02）

## 新增一篇文章

在 `src/content/posts/` 新建 `my-note.json`：

```json
{
  "slug": "my-note",
  "status": "draft",
  "date": "2026-10-27",
  "tags": ["Engineering"],
  "translations": {
    "zh": { "title": "我的文章", "excerpt": "简短摘要。" }
  }
}
```

正文放在同目录的 `my-note.zh.mdx`。需要英文时，增加 `translations.en` 与 `my-note.en.mdx`。文件名必须与 slug 和语言一致；每篇只维护一份 JSON，无需修改页面、文章导入、搜索或站点地图。

`next dev` 启动和 `next build` 会自动验证并生成 `post-metadata.ts`、`post-loaders.ts`。这两个生成文件跟随源文件提交，不手工编辑。P1-03 起开发服务器会监视本目录的 JSON/MDX 变化，自动同步登记与授权摘录；也可执行 `npm run content:sync`。发布前重新构建并重启/部署，生成文件不会让已经构建的生产页面自动更新。

MDX 是可信仓库代码，会执行组件和导入。仅接受已审核的本地维护者内容；不支持从访客上传或任意远程地址加载 MDX，链接检查也不是代码沙箱。

## 发布边界

| status | 页面、首页和搜索 | sitemap | AI 来源 |
| --- | --- | --- | --- |
| `draft` | 不可访问，正文不进入编译导入，元数据不进入公开登记文件 | 不进入 | 不进入 |
| `example` | 仅 `profile.isExample: true` 时显示，并标注示例；详情 noindex | 不进入 | 不进入 |
| `published` | 按页面开关和语言配置展示 | 真实资料且配置 SITE_URL 后进入 | 还需 `aiIndex: true` 和明确的 `PublicExcerpt` 段落 |

当前两篇模板说明文章是已发布的真实模板文档，不代表个人经历。P1-03 已把授权移到内容条目，摘录从可见原文生成；见 [来源授权与迁移](evidence-p1.md)。文章如果变成草稿、示例、撤销授权、禁用页面或缺少当前语言，就不会成为该语言的问答来源。

## 站点语言

在 `src/config/site.ts` 设置：

```ts
enabledLocales: ['zh'], // 或 ['en']、['en', 'zh']
defaultLocale: 'zh',    // 必须已启用
missingTranslation: 'hide', // 或 'fallback'
```

仅启用一种语言时，另一语言的所有页面返回 404，语言切换隐藏，问答 API 拒绝停用语言；导航、首页、静态参数和 sitemap 共用有效内容清单。现有 profile、project、站点品牌等共享配置仍沿用 P0 的中英文对象合同；本次允许文章只提供一种正文及元数据，不改变共享资料的字段类型。

- `hide`：该语言的首页、列表、搜索、静态参数和 sitemap 不含缺失翻译的文章，直接访问返回 404。
- `fallback`：如果文章具有默认语言，列表展示原文标题、摘要和原文语言，并直接链接到原文；直接访问缺失翻译的文章地址临时重定向到默认语言原文。如果连默认语言也没有，则隐藏并返回 404。
- 切换文章语言时，优先进入该文章已有翻译；缺失时返回目标语言的文章列表，列表没有有效内容则返回目标语言首页。
- sitemap 与文章 metadata 的 alternate 只列出真实可访问的翻译；不为回退内容虚构语言副本。配置 SITE_URL 后文章 canonical 指向实际正文语言地址。
- 缺失语言的正文不会搭配另一语言的人工问答摘录，避免来源与引用语言错配。

## 校验与错误定位

构建前检查 JSON 字段、slug 与文件名、重复 slug、真实日期、标题与摘要、登记正文和未登记的 MDX。站点配置继续检查精选项目引用、导航和模块重复、URL 协议、局部媒体路径，并增加启用/默认语言约束、配置媒体文件存在性、SITE_URL 和文章静态内部链接的目标检查。

错误包含文件或配置路径，例如 `src/content/posts/my-note.json.translations.zh.title`、`projects.0.cover.src`、`site.defaultLocale`、`my-note.zh.mdx.links`。删除项目、文章或语言时，应一并调整其静态引用。草稿仍需合法登记，但正文不会编译。

链接检查覆盖普通 Markdown 行内链接/图片，以及字面量 JSX `href`/`src`。相对站点链接使用 `/en/...` 或 `/zh/...`，图片使用 `/public` 内资源对应的 `/...` 地址。不请求远程站点验证 HTTP 可达性，也不检查锚点是否存在；动态 JSX 表达式、组件内部生成链接和 Markdown 引用式链接需要维护者审核及浏览器验证。

## 从 P0/P1-01 迁移

原 `post-metadata.ts` 的标题/摘要移入对应 JSON 的 `translations`，原 `posts.ts` 的固定导入由脚本生成。原 `evidence.en.mdx`、`evidence.zh.mdx` 改为与 slug 一致的 `evidence-first-ai.en.mdx`、`evidence-first-ai.zh.mdx`；公开文章 URL 不变。

旧站点保持双语言和 `hide` 默认值；仓库默认配置显式列出它们。开启 `fallback` 前确认默认语言正文存在。正常使用无需 Key，也不会自动授予 AI 索引权限。

验证命令：`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、`npm run test:e2e`、`npm run test:content-fixtures`。隔离场景保存在 `.cache/content-fixtures-*`，不会修改开发服务器的配置。
