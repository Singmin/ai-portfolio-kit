# 支持的发布方式、升级与排错

## 支持矩阵

| 部署 | 页面/搜索 | 资料助手 | 持久化要求 |
| --- | --- | --- | --- |
| 单机 Node.js 24+，`npm run build` + `npm run start` | 完整 | 服务端检索；可选模型只筛选 ID | 问答开启时需要可写持久磁盘，单机原子文件限流 |
| 静态托管 / Sites，`npm run build:static` | 完整静态页面、文章搜索、打印、主题/语言切换 | 浏览器内检索明确授权的原文，无 API/付费 AI | 无服务端存储 |
| 多机 / serverless 付费 AI | 尚不支持 | 需先实现并验证共享原子限流 | 不能用当前文件限流替代 |

### 静态版

```sh
npm run build:static -- --origin https://your-public-origin
# 清楚标注的模板演示可加 --preview
npm run build:static -- --preview --origin https://your-preview-origin
```

生成 `.cache/static/<build>/dist` 和就绪报告，源站文件保持不变。在独立副本中移除服务器 API、固定动态参数与 metadata 路由，导出 HTML/CSS/JS；根入口打开默认语言。部署时上传 **dist 目录内容**。浏览器内检索与 Node 检索共用评分函数及同一份已授权内容，问题不发送到服务器/模型。静态版不提供 POST API，不使用文件限流，不支持服务端未生成路径的重定向；缺失翻译的列表/切换仍只链接可用原文。

导出不会自动继承 Node 响应头、反向代理或 TLS 配置；由静态托管商提供。修改资料、语言或授权后必须重新构建并替换完整产物，不能只上传一份配置 JSON。

### Sites 私有预览

Sites 发布目录与原 GitHub 源码仓库分开，上传构建后的 dist、托管 manifest 和说明，不复制环境文件、缓存或原 Git 历史。新 Site 默认仅所有者访问，除非用户明确要求，不改变受众。创建后持久化服务返回的 project_id；本机恢复记录放在已忽略的 `deploy/sites-preview.json`，令牌只放当前工具会话内。

后续更新复用同一个 project_id 与本地源目录 `.cache/sites/ai-portfolio-kit-preview`，不要重复创建。先重建静态产物、验证，再通过 Sites 源助手推送精确来源并保存/部署；以工具返回成功及对应版本/URL 为准。若清理缓存，用本机恢复记录重建同一身份的 `.openai/hosting.json`。不要把推送成功当成部署成功。

## 单机 Node 发布

1. 在目标主机准备 Node 24、npm、受控应用目录和服务用户；clone 自己的仓库，运行 `npm ci`。
2. 应用审核过的公开配置，设置正式 `SITE_URL`；可选 Key/模型只写服务端环境文件，不提交 Git。
3. 若启用问答，给服务用户准备持久化目录并设置 `AI_RATE_LIMIT_DIR`；不要让多机共享此文件锁当作分布式限流。
4. 顺序运行 `npm run publish:check`、`npm run check`、浏览器检查；再构建、用 `npm run start -- --port 3000` 启动，现有脚本绑定 loopback，交给自己的 HTTPS 反向代理。
5. 验证首页、双语详情、sitemap/robots、无 Key/超时降级、引用链接与可写存储。配置已修改但未重建时，不应认为线上授权已撤销。

仓库不包含目标服务器地址、SSH Key、反向代理配置或自动远程覆盖脚本；部署者需根据自己的服务器设置服务管理、TLS、备份与日志。当前 Sites 预览使用上面的静态模式。

## 升级与版本

- GitHub **Use this template** 创建独立历史，fork 保留上游关联；首次使用先换公开配置并核验内容，密钥留在环境变量。
- 升级前提交/备份自己的公开配置与内容，添加上游 remote，审阅版本差异后合并；不要用整目录覆盖抹掉自己的资料。
- `customization.json` 使用显式 `version: 1`，未知字段/版本会报错。P0/P1 原字段仍可使用；迁移说明见 `configuration-p0.md`、`content-p1.md`、`evidence-p1.md`。
- 当前更改记录在 `CHANGELOG.md` 的 Unreleased。正式发行时维护者明确选择语义版本，更新 package/lock、运行全部检查、建立对应 tag 与 release notes；本次线上预览不自动宣称已发行新的稳定 tag。

## 排错

| 现象 | 检查 |
| --- | --- |
| Node 版本过旧 | `node --version` 应为 24+，Windows 可用 run.ps1 |
| npm ci 不成功 | 核验 lock 和网络/registry；不把已有 node_modules 的构建当作干净安装证据 |
| 配置不生效 | 确认应用到 `src/config/customization.json`，环境 SITE_URL 优先；生产需重建/重启 |
| 单语言仍有另一个入口 | 确认 enabledLocales/defaultLocale，清旧构建，重新生成静态站点 |
| 新文章未登记/段落无效 | 对照 slug/语言文件名，检查 PublicExcerpt 限制；修复后自动或手动 content:sync |
| Typecheck 缺失 .next/types | 不要与同目录 build 并行，构建完成后再检查 |
| 预览端口占用 | setup:preview 指定另一个 --port，不停掉未知进程 |
| 隔离副本 Turbopack 找不到依赖 | 隔离副本复用外部依赖联接，使用工具内置 webpack 模式 |
| Node 问答 503 | 检查服务用户对限流目录的权限和状态文件；进程停止后再检查遗留锁 |
| 静态站点 /api/ask 返回 404 | 这是浏览器检索模式，检查页面是否误用了 Node 构建或上传了旧资源 |
| Sites 网址能打开但未更新 | 对照已部署版本/源提交，确认不是仅保存或仅推送 |

发布检查不验证外部链接 HTTP 状态、域名归属、实际履历或服务器权限在另一个账户下是否正确。远程 CI、托管发布和浏览器验证应分别记录。
