# 初始化、配置草稿与发布检查

要求 Node.js 24+、npm、Git。初始化是本地维护者工具，配置 JSON 只放准备公开的资料；环境变量和 Key 仍保留在 `.env.local` 或托管服务中。

## 从副本开始

使用 GitHub 仓库的 **Use this template → Create a new repository**，或 fork/clone：

```sh
git clone https://github.com/Singmin/ai-portfolio-kit.git
cd ai-portfolio-kit
npm ci
npm run setup
```

向导依次填写公开姓名、角色、首页标题、摘要、简介、可选地区、技能和联系渠道；选择语言/默认语言、主题、页面、首页模块顺序及是否保留模板内容。AI 索引默认关闭，不收集 Key，不根据职位自动编造技能或经历。双语需分别填写真实翻译；单语言只需该语言文本。

默认输出唯一的 `.cache/setup/draft-*.json`，不会覆盖现有配置。非交互模式可从 JSON 生成草稿：

```sh
npm run setup -- --input examples/setup/zh-preview.json
npm run setup:preview -- --file .cache/setup/<draft>.json --port 3200
```

预览运行在独立源文件副本，复用安装的依赖、绑定 `127.0.0.1`；不复制 `.git`、`.env` 或其他私人文件，不调用付费模型。当前 3000 端口开发站点不受影响。Ctrl+C 关闭该预览。端口占用时改 `--port`；依赖联接在 Windows 上使用 webpack。

## 审阅后应用与恢复

```sh
npm run setup -- --apply --input .cache/setup/<reviewed-draft>.json
npm run dev
```

固定应用到 `src/config/customization.json`。写入前使用实际配置模型检查页面、模块和引用，失败时不写；成功前保存原文件到 `.cache/setup/backups/`，再原子替换。恢复使用同一命令，输入对应备份文件。草稿输出不覆盖同名文件，应用目标拒绝符号链接。

该 JSON 是公开配置的覆盖层。省略项继续使用 `src/config/site.ts`、`profile.ts` 中原值；空 `version: 1` 配置保持旧行为。项目、贡献和 MDX 仍通过原内容模型维护，不需要修改页面组件。复杂经历/教育可通过 JSON 数组填写，示例见 `en-resume.json`。

`content.hideStarterContent: true` 仅隐藏模板项目 `ai-portfolio-kit` 与两篇模板文档，不删除源文件，也不隐藏以后新增的自有 slug；对应的旧精选引用会清理。其他未知精选引用仍报错。保留模板内容时同时保留其已有授权标记，应核验归属，不把模板项目写成自己的客户成果。

## 发布检查

```sh
npm run publish:check
npm run publish:check -- --json
npm run publish:check -- --strict
```

检查只读实际公开配置和本地资源，不构建、写入、爬取远程 URL 或发布。它检查示例/占位资料、必要公开字段、至少一个联系渠道、启用语言的翻译、品牌/模板残留、空页面、静态引用、媒体及最终 origin。默认有 error 退出 1，warning 不阻塞；`--strict` 也将 warning 作为失败。

`seo.url` 可写入 JSON，环境变量 `SITE_URL` 优先。普通发布拒绝 localhost、常见私网、示例/测试域名、凭据、非根路径及无效协议；HTTPS 为建议项。不能据此证明域名所有权、远程链接可达性或个人经历真实，发布前仍需维护者审核。

示例身份不应通过个人站点发布检查。要发布清楚标注、noindex 的模板演示，可显式使用：

```sh
npm run publish:check -- --preview --deployment static
```

此模式只把明确示例身份的占位/联系问题降为 warning，仍阻塞损坏配置和资源；不把示例身份改成真人，也不等同个人站点已可发布。

发布检查支持 `node` 和 `static`；`serverless`/`multi` 会指出当前不支持。Node 限流依赖单机可写持久磁盘；静态模式在浏览器检索、没有服务端 API 或付费 AI。

## 三套完整示例

| 文件 | 用途 | 内容量 |
| --- | --- | --- |
| `examples/setup/zh-preview.json` | 中文、工程式 | 极简简介/联系，无项目与文章 |
| `examples/setup/en-resume.json` | 英文、履历式 | 明确虚构的经历、教育和示例技能 |
| `examples/setup/bilingual-editorial.json` | 双语、编辑式 | 保留真实 Kit 项目及两篇模板文档 |

所有个人身份均显式标记 `isExample: true`、`aiIndex: false`，不虚构真实客户、采用量、指标、学历或已合并 PR。示例只是布局/配置演示；替换后要逐项核验事实并重新审阅 AI 授权。

Windows 可使用 `powershell -ExecutionPolicy Bypass -File .\run.ps1 setup ...`，附加参数会转交 npm。该助手优先选择 Node 24，不修改全局环境。
