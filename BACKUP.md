# 备份、更新与恢复

## 当前源码快照

- 快照日期：2026-10-22（Asia/Taipei）。
- 原 Sites 源码提交：`ffe2ac15e4903eb5de200ea3d5c7c7407fb44763`。
- 内容：23 个场景页面、21 期故事，最新为 `moon-mushroom-post-office`（月背蘑菇邮局）。
- 独立仓库目标：`FlewolfXY/goodnight-nook`；主要分支：`main`。
- 备用站目标：`https://flewolfxy.github.io/goodnight-nook/`，首次部署成功后可访问。

`public/`、`source-scenes/`、服务器实现、数据库迁移和原有测试来自上述源码快照。静态导出只在生成的 `_site/` 应用本地存档适配，原 `public/nook-memory.js` 的账户存档实现保留。

## 后续更新

1. 从原 Sites 同步更新过的场景、目录、素材和实现文件，保留本仓库 `github-pages/`、导出脚本和 Pages 工作流。
2. 执行 `node --test github-pages/nook-pages-memory.test.cjs` 和 `node scripts/export-github-pages.mjs`。
3. 将源码提交到 `main`。工作流会测试、导出并发布 `_site/`；不要把生成目录手工改成第二套源码。
4. 检查对应 Actions 运行成功，再打开备用站验证本轮改动。

从 Sites 到 GitHub 的同步仍需主动执行。推送后的 Pages 构建发布自动完成。

## 静态恢复

安装 Node.js 22 或更新版本，运行上面的测试和导出命令即可得到全部静态页面；不需要原站账号、数据库或服务器。将 `_site/` 内容交给静态托管服务即可，资源路径兼容项目子目录。

静态页的数据保存于当前浏览器。它不会同步原站账户存档，也不包含真实的纸条、枕头或纪念物记录。清除该站点的浏览器数据会清除本地进度。

## 云端版本恢复

服务器实现、认证边界、D1 schema 和追加式迁移都保留，便于在原 Sites 项目恢复代码。公开快照省略 `.openai/hosting.json` 等托管身份和运行时文件；应从原受管项目取得现有配置，保持原项目身份、私有访问和数据库绑定，然后按 Sites 的构建发布流程操作。不要把静态浏览器存档当成云端数据库备份。

## 公开范围

不收录 `.openai/`、本地执行环境、依赖目录、生成构建目录、环境变量文件、数据库实例、登录凭据或用户存档。公开仓库中的数据库文件只是结构与迁移，测试使用独立样例。

原 Sites 的访问设置和云端存档不因 GitHub Pages 发布而改变。
