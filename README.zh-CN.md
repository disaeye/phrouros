# Phrouros

[![Bun](https://img.shields.io/badge/runtime-Bun%20%E2%89%A5%201.1-f472b6?logo=bun)](https://bun.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![npm](https://img.shields.io/badge/npm-phrouros-cb3837?logo=npm)](https://www.npmjs.com/package/phrouros)
[![English](https://img.shields.io/badge/docs-English-blue)](./README.md)

**Phrouros**（φρουρός，哨兵）是**本地 agent 监控看板**，面向 [OpenCode](https://github.com/sst/opencode) 与 [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent)。

只读访问 OpenCode 的 SQLite，在单个 Bun 进程里展示：活跃主会话、后台 agent、Token 用量与费用估算。前端为零依赖 SPA，无打包步骤。

若项目使用 [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent)，还会从 `.omo/boulder.json` 展示计划进度与委派任务。

> **文档语言：** [English](./README.md) · 中文（本页）

---

## 目录

- [为什么需要](#为什么需要)
- [功能](#功能)
- [环境要求](#环境要求)
- [安装](#安装)
- [配置](#配置)
- [工作原理](#工作原理)
- [HTTP API](#http-api)
- [故障排查](#故障排查)
- [隐私与安全](#隐私与安全)
- [目录结构](#目录结构)
- [开发](#开发)
- [路线图](#路线图)
- [贡献](#贡献)
- [更新日志](#更新日志)
- [许可证](#许可证)
- [致谢](#致谢)

---

## 为什么需要

OpenCode 会拉起大量 session / 子 agent。Token 消耗、谁在跑，以及（在使用 oh-my-openagent 时）计划走到哪，单靠 CLI 很难一眼看清。

**Phrouros** 是一层很薄的 **本地 agent 监控驾驶舱**：

| 目标 | 做法 |
| --- | --- |
| 启动快 | 单进程：HTTP API + 静态 SPA |
| 好审计 | 运行时零 npm 依赖（`bun:sqlite` + 原生 HTTP） |
| 默认更安全 | 只读 SQLite；UI 不展示 prompt / 工具参数 / 工具输出 |
| OpenCode 优先 | sources 布局对齐常见 OpenCode dashboard 约定；oh-my-openagent 为可选增强 |

---

## 功能

- **导入项目** — 将本地绝对路径登记为 source
- **主 Agent** — 选定项目下最近更新、未归档的单个主 session
- **后台 Agent** — 主 session 下的子 session
- **执行瀑布** — 时间 × Agent 泳道；点击色块查看详情
- **Session 详情抽屉** — 回合时间线、工具统计/调用（仅元数据）、会话待办、父子跳转
- **工作明细**（存在 oh-my-openagent 时）— 三类清单含义不同：
  - **委派任务** — `.omo/boulder` 的 `task_sessions`
  - **主会话待办** — OpenCode 主 session 的 `todo` 表（todowrite）
  - **计划清单** — 计划 markdown 的 checkbox
- **Token 与费用** — 输入 / 输出 / 推理 / 缓存；按 [models.dev](https://models.dev/) 估算 USD
- **界面** — 浅色 / 深色主题，中英文 UI

---

## 环境要求

- [Bun](https://bun.sh) **≥ 1.1**
- 本机已使用过 OpenCode，并存在 `opencode.db`（通常在 `~/.local/share/opencode/`）
- 可选：项目含 `.omo/boulder.json`（或旧路径 `.sisyphus/boulder.json`）以显示计划 / 委派

---

## 安装

需要本机已安装 [Bun](https://bun.sh) **≥ 1.1**。

> **运行时说明：** 本包 **仅支持 Bun**。纯 `node` / `npx` 无法运行。Windows 请安装 [Bun for Windows](https://bun.sh)（或 WSL）；CLI 入口是一小段 shell 脚本，内部调用 `bun`。

```bash
# 推荐：一次性运行
bunx phrouros

# 或全局安装
bun add -g phrouros
phrouros
```

默认监听 `http://127.0.0.1:51234`，并自动打开浏览器。

```bash
phrouros --help
phrouros --version
phrouros --no-open          # 不自动打开浏览器
phrouros --host 0.0.0.0     # 局域网访问（仅可信网络）
```

从 git 检出目录直接跑（未发布到 npm 时）：

```bash
./bin/phrouros --help
# 等价于：
bun run src/server.ts --help
```

### 首次使用

1. 运行 `bunx phrouros`（浏览器会自动打开）。
2. 若尚未登记项目，**空状态**会列出本机 OpenCode 数据库中发现的项目 → 勾选后 **导入**。
3. 也可在手动导入中粘贴项目绝对路径。
4. 看板默认自动刷新；顶栏可切换项目。
5. 若曾导入的路径已被删除或移动，该源仍会显示（标记为 **路径不存在**）。请切换到其他项目，或 **移除** 后按新路径重新导入。

### 开发（贡献者）

```bash
git clone https://github.com/disaeye/phrouros.git
cd phrouros
bun run dev     # 热重载
bun run start
./bin/phrouros --no-open
```

---

## 配置

### 命令行与环境变量

| 参数 | 环境变量 | 默认 | 说明 |
| --- | --- | --- | --- |
| `--host <addr>` | `PHROUROS_HOST` / `HOST` | `127.0.0.1` | 监听地址 |
| `--port <n>` | `PHROUROS_PORT` / `PORT` | `51234` | 端口 |
| `--project <path>` | `PHROUROS_PROJECT` | — | 默认 project 目录 |
| `--db <path>` | `OPENCODE_DB_PATH` | 见下 | `opencode.db` 路径 |
| `--storage <path>` | — | OpenCode storage 根 | `sources.json` 所在树 |
| `--open` / `--no-open` | `PHROUROS_NO_OPEN=1` | 打开浏览器 | 启动后是否打开 UI |
| `-v`, `--version` | — | — | 打印版本 |
| `-h`, `--help` | — | — | 帮助 |

默认数据库路径：

```text
${XDG_DATA_HOME:-~/.local/share}/opencode/opencode.db
```

示例：

```bash
# 局域网绑定（仅可信网络）
phrouros --host 0.0.0.0 --port 51234

# 自定义 OpenCode 数据库
OPENCODE_DB_PATH=/path/to/opencode.db phrouros
```

---

## 工作原理

### 数据来源（只读）

| 来源 | 典型路径 | 用途 |
| --- | --- | --- |
| OpenCode SQLite | `~/.local/share/opencode/opencode.db` | session、message、part、todo、token |
| Dashboard sources | `.../opencode/storage/dashboard/sources.json` | 已导入项目列表 |
| OMO boulder（可选） | `<project>/.omo/boulder.json` | 计划名、状态、`task_sessions`、编排 agent |
| 计划 markdown | boulder 引用的路径 | checkbox 清单进度 |
| 价格目录 | [models.dev API](https://models.dev/api.json) | USD 估算（$/百万 tokens） |

价格缓存目录：`~/.cache/phrouros/`（默认约 6 小时）。失败时可能回退 OpenCode 的 `~/.cache/opencode/models.json`。估算是**目录价**，不是账单（代理 / 订阅套餐可能不同）。

### 状态启发式

- 最近 **2 分钟**有更新 → **运行中**
- 更久 → **空闲**
- 已归档单独标记

### 架构

```text
┌─────────────────────────────────────────┐
│  浏览器 SPA（public/）                    │
│  app.js · detail.js · styles.css        │
└─────────────────┬───────────────────────┘
                  │ HTTP JSON
┌─────────────────▼───────────────────────┐
│  Bun 服务（src/server.ts）· phrouros     │
│  /api/* + 静态资源                        │
├─────────────────────────────────────────┤
│  db.ts · session-detail.ts · omo.ts     │
│  pricing.ts · sources.ts · paths.ts     │
└─────────────────┬───────────────────────┘
                  │ 只读
        opencode.db · boulder.json · models.dev
```

---

## HTTP API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 健康检查 + 数据库路径 |
| `GET` | `/api/sources` | 已导入项目（每项含 `pathExists`；`defaultSourceId` 优先选目录仍存在的源） |
| `POST` | `/api/sources` | 导入 `{ "projectRoot": "...", "label?": "..." }`（目录必须存在） |
| `DELETE` | `/api/sources/:id` | 移除登记（不删除 OpenCode 数据） |
| `GET` | `/api/dashboard?sourceId=` | 看板完整快照（含 `pathExists`、Token、agent、OMO、费用估算） |
| `GET` | `/api/session/:id` | Agent 执行详情 |
| `GET` | `/api/pricing?refresh=1` | 价格目录状态；`refresh=1` 强制刷新 |
| `GET` | `/api/projects` | 数据库中的 project 列表（已知 worktree 时含 `pathExists`） |

### 源与缺失目录

- 导入时 **要求** 目录存在；路径变更后的重新导入会成为新条目（绝对路径不同则 id 不同）。
- 登记后的 `projectRoot` 若被删除/移动，`GET /api/sources` 仍会列出，并带 `pathExists: false`。
- `GET /api/dashboard` 返回 **HTTP 200** 空看板与明确 `note`（不是 404/500）。请切换项目或 `DELETE /api/sources/:id`。

### Session 详情（摘要）

仅元数据：回合标签、工具名/状态/耗时、todos、父子 session、可选 OMO 任务链接。**不包含** prompt、工具参数、工具输出。

---

## 故障排查

| 现象 | 排查 |
| --- | --- |
| `phrouros requires Bun ≥ 1.1` | 从 [bun.sh](https://bun.sh) 安装 Bun，再执行 `bunx phrouros` |
| `npx phrouros` / 纯 Node 失败 | 预期行为 — 请用 `bunx` / `bun add -g`，不要用 `npx` |
| 空看板 /「未找到主 session」 | 请先在该项目目录运行过 OpenCode；确认 `--db` / `OPENCODE_DB_PATH` |
| 源显示 **路径不存在** | 目录已移动/删除；切换项目，或移除后按新路径重新导入 |
| 数据库不对 | `OPENCODE_DB_PATH=/path/to/opencode.db phrouros` 或 `--db` |
| 端口占用 | `phrouros --port 51235` |
| 浏览器未打开 | 手动打开 `http://127.0.0.1:51234`；无头环境加 `--no-open` |
| macOS / Windows 数据库路径 | 默认按 XDG 风格 `~/.local/share/opencode/`；若 OpenCode 路径不同请用 `--db` |

---

## 隐私与安全

- 对 OpenCode SQLite **只读**，从不写入该库。
- UI **故意不展示** prompt、工具参数、工具结果。
- 默认监听 `127.0.0.1`。若需局域网访问，请仅在可信网络使用：

  ```bash
  phrouros --host 0.0.0.0
  ```

- 导入项目会在 OpenCode storage 树下的 `sources.json` 中记录绝对路径。

---

## 目录结构

```text
phrouros/
├── bin/
│   └── phrouros            # npm/bun bin → bun src/server.ts
├── public/                 # 零构建 SPA
│   ├── index.html
│   ├── styles.css
│   ├── app.js              # 看板、瀑布、工作明细
│   ├── detail.js           # 右侧抽屉
│   ├── icons.js
│   └── vendor/
├── src/
│   ├── server.ts           # HTTP + CLI 参数
│   ├── db.ts               # 看板查询 / 主 session 解析
│   ├── session-detail.ts   # /api/session/:id
│   ├── omo.ts              # boulder / 计划
│   ├── pricing.ts          # models.dev 定价
│   ├── sources.ts          # sources.json
│   └── paths.ts            # XDG / 路径
├── package.json
├── tsconfig.json
├── CHANGELOG.md
├── README.md
├── README.zh-CN.md
└── LICENSE
```

---

## 开发

```bash
# 应用本身无 npm 依赖，仅需 Bun
bun run dev          # 热重载
bun run start        # 常规启动
./bin/phrouros --help
```

无打包步骤。改 `public/*` 后刷新浏览器；改 `src/*` 后重启服务（或使用 `bun run dev`）。

推荐分支流程：

```bash
git checkout -b feat/your-change
# ... 提交 ...
git push -u origin feat/your-change
# 向 main 开 Pull Request
```

发布检查（维护者）：

```bash
# 1. 版本号 + CHANGELOG
# 2. 用 tarball 冒烟
npm pack --dry-run          # 必须包含 bin/、src/、public/
npm pack
bun add -g ./phrouros-*.tgz
phrouros --version
phrouros --no-open
# 3. 发布（需 npm login；公开包）
npm publish --access public
# 4. 验证
bunx phrouros --version
npm view phrouros version
```

---

## 路线图

备选方向（非承诺）：

- [ ] 工具级瀑布条
- [ ] 更稳的实时状态（少轮询）
- [ ] 面向非 Bun 用户的安装/打包（若有需求）
- [ ] README 截图 / 演示 GIF

---

## 贡献

欢迎贡献。

1. Fork 本仓库
2. 创建功能分支（`feat/...`、`fix/...`）
3. 尽量小步、聚焦提交
4. 向 `main` 开 PR，并写清改动说明

请勿提交密钥、本机 OpenCode 数据库或 agent 工作区产物（`.omo/`、`.codegraph/` 已在 `.gitignore`）。

Bug 与功能建议请使用 [GitHub Issues](https://github.com/disaeye/phrouros/issues)。

---

## 更新日志

见 [CHANGELOG.md](./CHANGELOG.md)。

---

## 许可证

本项目采用 [MIT License](./LICENSE)。

---

## 致谢

- [OpenCode](https://github.com/sst/opencode) — agent 运行时与本地 SQLite 结构（Phrouros 主要监控对象）
- [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) — 编排与 boulder 计划模型（可选增强）
- [models.dev](https://models.dev/) — 公开模型价格目录
- [Bun](https://bun.sh) — 运行时（`bun:sqlite`、HTTP、TypeScript）

---

[English](./README.md) · **中文**
