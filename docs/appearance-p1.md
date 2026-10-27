# P1-01：三套阅读与视觉预设

同一套公开资料可用三种排版展示。首页顶部的“阅读方式”可即时切换，选择只保存在当前浏览器的本地存储中，不修改源码或公开资料。

| 预设 | 默认外观 | 排版与阅读重点 |
| --- | --- | --- |
| `editorial` 编辑式 | 森林绿、浅绿、Imbue / Albert | 大标题、整屏叙事与大幅作品图片，延续原版方向 |
| `engineering` 工程式 | 蓝白、Albert | 双栏介绍、明确技术方向；项目决策与截图并排，详情以资料侧栏配合正文 |
| `resume` 履历式 | 白纸、深绿、Albert | 限制内容宽度、压缩间距、紧凑项目列表与小图，适合快速阅读 |

## 配置入口

在 `src/config/site.ts` 中修改：

```ts
appearance: {
  preset: 'engineering',
  motion: 'full',
  allowSwitching: true,
},
```

`preset` 决定服务器首屏、未开启 JavaScript 时的布局及无有效本地选择时的默认值。已有浏览器选择优先于该默认值；清除浏览器本地存储中的 `portfolio-reading-preset-v1` 可重新使用站点默认值。

`allowSwitching: false` 隐藏切换入口，忽略旧的浏览器选择，始终使用配置的预设。访问者的选择不会写入 URL，也不会生成额外站点地图条目。

以下可选字段独立覆盖全部预设的默认外观：

| 字段 | 允许值 | 效果 |
| --- | --- | --- |
| `palette` | `forest` / `blueprint` / `paper` | 配色、正文和表单对比色 |
| `typography` | `expressive` / `sans` | 标题使用 Imbue 配 Albert，或统一 Albert；中文使用系统中文回退 |
| `density` | `comfortable` / `compact` | 全局内容间距及正文密度，仍保留各预设的布局差异 |
| `mediaRatio` | `landscape` / `square` / `native` | 4:3 裁切、方形裁切或图片自然比例 |
| `motion` | `full` / `reduced` | 动态效果；系统“减少动态效果”优先关闭动画与过渡 |

示例：保持工程式布局，改用纸张配色、紧凑间距和自然图片比例：

```ts
appearance: {
  preset: 'engineering',
  palette: 'paper',
  density: 'compact',
  mediaRatio: 'native',
  motion: 'reduced',
  allowSwitching: false,
},
```

仅设置 `preset` 时其余视觉参数随预设切换；显式填写的可选覆盖项则保留。不要以切换主题来表达资料发布或 AI 授权，这些仍由内容与页面配置管理。

## 迁移与样式结构

旧站点配置未提供 `appearance` 时，运行时校验会补上编辑式、完整动态、允许切换的默认值。若显式使用 `SiteConfig` 类型编写配置，加入上面的完整基础对象即可满足类型约束。其他资料字段无需迁移。

原全局样式中积累的覆盖已整理为四个文件，在语言布局的同一入口按顺序导入：

1. `src/styles/tokens.css`：本地字体、共享角色、配色与可选参数。
2. `src/styles/components.css`：共用组件及基础响应式布局。
3. `src/styles/presets.css`：三种内容构图及其手机适配。
4. `src/styles/accessibility.css`：键盘焦点、动态降级、统一 A4 打印规则。

切换器采用带 `aria-pressed` 的原生按钮，可用 Tab、Enter 或空格操作。浏览器禁用存储时仍可在当前页面切换。JavaScript 关闭时显示站点默认排版与说明；页面内容、导航和项目来源链接继续可用。

三套预设都使用同一份事实。工程式额外展开的是已有项目决策与技能字段；没有添加示例之外的个人经历、成绩或第三方背书。

简历打印会统一使用白底黑字、隐藏导航、阅读控件和示例横幅；打印结果不保留屏幕主题配色。验证结果及当前限制见 `docs/verification-p1-01.md`。
