# P0 配置与迁移指南

P0 增加了站点设置、模块组合和可选项目资料。继续保留中英文内容。后续 P1-01 已增加三套主题与阅读切换，说明见 [三套视觉预设](appearance-p1.md)；单语言内容和自动文章发现仍属于待办。

## 配置入口

| 文件 | 负责内容 |
| --- | --- |
| `src/config/site.ts` | 站点品牌、默认语言、模板信息、页脚、页面开关、导航顺序、首页模块 |
| `src/config/profile.ts` | 个人资料、联系方式、技能、经历和教育；所有字段都是公开数据 |
| `src/config/projects.ts` | 项目案例、可选媒体、个人职责、结果和证据 |
| `src/config/contributions.ts` | 已核验的公开贡献及实际状态 |
| `src/content/post-metadata.ts` | 文章 slug、标题、日期、摘要和标签 |
| `src/content/posts/*.json` | 每篇文章的唯一登记；P1-02 自动生成可信 MDX 导入，见 [内容与语言配置](content-p1.md) |

站点自己的品牌与模板署名分开配置。`site.brand` 用于页眉和标题；`site.footer` 控制页脚文字与模板署名开关；`site.template.repository` 只表示模板仓库，不会被当作个人项目或已合并的社区贡献。

## 首页模块

身份主视觉始终展示，下面的模块按照 `site.home.modules` 数组顺序排列：

```ts
home: {
  modules: [
    { type: 'posts', enabled: true, limit: 2 },
    { type: 'projects', enabled: true, featured: ['my-tool', 'my-site'], limit: 2 },
    { type: 'experience', enabled: true, limit: 3 },
    { type: 'contributions', enabled: false },
    { type: 'about', enabled: true },
    { type: 'contact', enabled: true },
    { type: 'assistant', enabled: true },
  ],
}
```

`featured` 只允许出现在项目模块中，按指定顺序选择项目；省略时按项目配置顺序选择。显式空数组表示不推荐项目。列表模块默认展示 3 项，`limit` 必须是 1–50 的整数。删除项目时，同步移除它的精选 slug；否则配置校验会明确报告失效引用。

模块类型不能重复。项目、文章和贡献模块在内容为空时自动隐藏；经历模块要求有经历且简历页已启用；联系模块要求有邮箱或 GitHub；资料助手模块要求问答页已启用。

主视觉行动优先进入有内容且启用的项目页，其次为启用的简历页，再次为公开联系地址；没有目标则不显示按钮。邮件地址优先于 GitHub。

## 页面开关与导航

`site.pages` 包含 `resume`、`projects`、`blog`、`contributions`、`ask` 的布尔开关。`site.navigation` 是这些页面 ID 的有序数组。

| 操作 | 行为 |
| --- | --- |
| 关闭一个首页模块 | 页面继续可访问；导航、站点地图和现有公开问答来源不因此关闭 |
| 关闭一个页面 | 页面及详情返回 404；对应首页模块、导航、行动链接、站点地图与问答引用一并移除 |
| 关闭 `ask` | 问答页和 `POST /api/ask` 均返回 404；不会读取请求内容、消耗配额或调用模型 |
| 已启用的列表内容为空 | 首页模块和导航自动隐藏；直接访问列表页仍有中英文空状态 |

问答可作为导航项；没有放入导航时显示独立问答入口，避免重复入口。示例资料继续显示提示并禁止搜索引擎索引。真实站点地图需要关闭示例标记并配置 `SITE_URL`，这不等于资料已自动获得真实性认证。

## 项目新增字段

原有字段继续有效，新增字段全部可选：

```ts
period: '2026',
role: { en: 'Your actual role', zh: '你的实际角色' },
team: { en: 'Public team context', zh: '可公开的团队背景' },
contribution: { en: 'Your verified scope', zh: '你实际负责的范围' },
cover: {
  src: '/projects/my-tool/cover.png',
  alt: { en: 'What the image shows', zh: '图片内容说明' },
  caption: { en: 'Optional caption', zh: '可选说明' },
},
screenshots: [],
metrics: [],
evidence: [
  { type: 'document', title: { en: 'Design notes', zh: '设计说明' }, url: 'https://example.org/design' },
],
```

示例只说明结构，请替换为真实资料。媒体路径对应 `public/` 下的本地文件，不能使用远程 URL、路径回退或脚本地址。每张图片必须提供中英文替代文本。`metrics` 每项包含 `value`、双语 `label` 和可选 `evidenceUrl`；未提供指标时不显示结果指标区。

证据类型为 `source`、`demo`、`article`、`pr`、`document`。原有 `repository`、`demo` 仍可使用，并与证据列表统一展示；重复 URL 去重，显式证据标题优先。缺少媒体、职责、指标或链接时省略对应区域，不生成假数据，不推断项目只能在本地使用。

## 问答资料边界

当前仍是显式白名单：公开简介、各项目技术栈和关键决策、已登记的公开贡献，以及原先明确批准的两篇文章摘录。项目来源 ID 为 `project:<slug>:stack` 和 `project:<slug>:decisions`；贡献使用 URL 派生的稳定 ID。删除内容或关闭页面后，相应引用消失。

新增项目的扩展字段不会自动进入 AI 索引；新增 MDX 不会自动被索引。完整内容索引和逐项 AI 授权留到 P1。API 的 `mode/message/sources` 成功响应结构保持兼容，来源 ID 属于可更新的内容标识，不应在客户端写死。

## 从旧配置迁移

1. 把旧页面中的站点品牌、页脚、模板仓库信息移入 `site.ts`；个人姓名和简介留在 `profile.ts`。
2. 按需要关闭页面、排列导航和模块。只想隐藏首页区块时不要关闭整个页面。
3. 保留原有项目字段，按需添加新字段。封面和截图跟随具体项目配置；替换项目时不会继承 Kit 的四张图片。
4. 维护文章时，在元数据文件填写资料，并在组件登记文件导入对应 MDX；站点地图使用元数据，无需单独维护 slug 列表。
5. 将旧测试或外部集成中写死的 `stack`、`project` 来源 ID 改为读取实际响应中的 ID。

## 验证

```powershell
powershell -ExecutionPolicy Bypass -File .\run.ps1 check
powershell -ExecutionPolicy Bypass -File .\run.ps1 test:e2e
powershell -ExecutionPolicy Bypass -File .\run.ps1 test:fixtures
```

浏览器测试独立使用 3100 端口、空 API Key 和专用限流目录，不复用用户正在运行的 3000 预览。`test:fixtures` 在忽略的 `.cache/fixture-*` 中构建隔离副本，以虚构示例资料验证替换效果，并使用 3111、3112 端口检查实际 HTTP 状态；原始配置不会被修改。隔离副本共享依赖目录，因此更新依赖时不要并行运行该检查。

更新 Kit 预览图时可设置 PREVIEW_URL 指向独立生产服务，再运行 node scripts/capture-previews.mjs，避免捕获开发工具角标。
