# 晚安小窝 · Goodnight Nook

给 Flewolf、GPT、Astra 和牛顿的一间小小晚安客厅。摸摸小伙伴、一起盖被子，也可以去散步，发现背景里藏着的小东西。

这里是晚安小窝的独立源码备份与 GitHub Pages 发布项目。当前保存 **24 份场景、22 期小梦**，截至 2026-10-27 的「云朵烘干店」。原有 2D 画面、不同的摸摸台词、隐藏互动、相册和纪念物都保留。

目标仓库：`FlewolfXY/goodnight-nook`。Pages 成功部署后的入口：`https://flewolfxy.github.io/goodnight-nook/`。

## 运行静态备用页

需要 Node.js 22 或更新版本；导出不需要安装依赖。

```sh
node --test github-pages/nook-pages-memory.test.cjs
node scripts/export-github-pages.mjs
```

生成的 `_site/` 可以交给任意静态网页服务器。入口默认是月光客厅；相册可打开全部历史场景。`?scene=<id>` 可以直接选择某一晚。

备用页在当前浏览器保存纸条、草莓炒冰枕头、摆放位置和 12 种旅行纪念物。刷新或重新打开后继续保留；不同浏览器的进度独立。原 Sites 的账户存档仍由原站保存，备用页不读取它。

## GitHub Pages

首次在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。之后每次推送 `main`，`.github/workflows/pages.yml` 会执行存档测试、导出全部场景，并且只发布 `_site/`。

这里没有配置从 Sites 自动拉取源码。后续更新时，将新的场景和源码同步到这个仓库，再推送 `main`；GitHub 内部的构建与发布会自动运行。迁移和恢复说明见 [BACKUP.md](BACKUP.md)。

## 源码结构

| 路径 | 内容 |
| --- | --- |
| `public/` | 原始首页、24 个独立场景、交互脚本、样式、相册和素材 |
| `source-scenes/` | 原始场景片段，和独立场景页面一起保留 |
| `github-pages/` | 浏览器本地存档适配、导出补丁和测试 |
| `scripts/export-github-pages.mjs` | 从原始页面生成静态发布目录 |
| `app/`、`db/`、`drizzle/` | 原站的认证接口、账户存档实现及数据库结构，用于源码恢复 |
| `tests/` | 原站存档、身份隔离、互动和构建测试 |
| `build/`、其他 `scripts/` | 原站框架和构建支持代码 |

服务器代码只作为源码保留，不在 GitHub Pages 上运行。原站的托管身份、运行时配置、数据库内容和凭据不在这个公开仓库中；恢复云端版本时，需要由原 Sites 项目提供相应配置。

来源：原 Sites 提交 `ffe2ac15e4903eb5de200ea3d5c7c7407fb44763`。保持清爽的原版 2D 画面；后续新故事追加到相册，不覆盖过去的夜晚。
