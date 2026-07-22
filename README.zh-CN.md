# Phrouros

[![Bun](https://img.shields.io/badge/runtime-Bun%20%E2%89%A5%201.1-f472b6?logo=bun)](https://bun.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
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
- [快速开始](#快速开始)
- [配置](#配置)
- [工作原理](#工作原理)
- [HTTP API](#http-api)
- [隐私与安全](#隐私与安全)
- [目录结构](#目录结构)
- [开发](#开发)
- [路线图](#路线图)
- [贡献](#贡献)
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

## 快速开始

```bash
git clone https://github.com/disaeye/phrouros.git
cd phrouros
bun run start
```

浏览器打开：

```text
http://127.0.0.1:51234
```

开发热重载：

```bash
bun run dev
```

### 首次使用

1. 启动服务。
2. 打开 UI → **导入 / 管理项目**。
3. 填写项目绝对路径（可选显示名）→ **导入**。
4. 在顶栏选择项目；看板默认开启自动刷新。

---

## 配置

### 命令行与环境变量

| 参数 | 环境变量 | 默认 | 说明 |
| --- | --- | --- | --- |
| `--host <addr>` | `PHROUROS_HOST` / `HOST` | `0.0.0.0` | 监听地址 |
| `--port <n>` | `PHROUROS_PORT` / `PORT` | `51234` | 端口 |
| `--project <path>` | `PHROUROS_PROJECT` | — | 默认 project 目录 |
| `--db <path>` | `OPENCODE_DB_PATH` | 见下 | `opencode.db` 路径 |
| `--storage <path>` | — | OpenCode storage 根 | `sources.json` 所在树 |
| `-h`, `--help` | — | — | 帮助 |

默认数据库路径：

```text
${XDG_DATA_HOME:-~/.local/share}/opencode/opencode.db
```

示例：

```bash
# 仅本机访问
bun run src/server.ts --host 127.0.0.1 --port 51234

# 自定义 OpenCode 数据库
OPENCODE_DB_PATH=/path/to/opencode.db bun run start
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
| `GET` | `/api/sources` | 已导入项目 |
| `POST` | `/api/sources` | 导入 `{ "projectRoot": "...", "label?": "..." }` |
| `DELETE` | `/api/sources/:id` | 移除登记（不删除 OpenCode 数据） |
| `GET` | `/api/dashboard?sourceId=` | 看板完整快照 |
| `GET` | `/api/session/:id` | Agent 执行详情 |
| `GET` | `/api/pricing?refresh=1` | 价格目录状态；`refresh=1` 强制刷新 |
| `GET` | `/api/projects` | 数据库中的 project 列表 |

### Session 详情（摘要）

仅元数据：回合标签、工具名/状态/耗时、todos、父子 session、可选 OMO 任务链接。**不包含** prompt、工具参数、工具输出。

---

## 隐私与安全

- 对 OpenCode SQLite **只读**，从不写入该库。
- UI **故意不展示** prompt、工具参数、工具结果。
- 默认监听 `0.0.0.0`：请只在可信网络使用，或绑定本机：

  ```bash
  bun run src/server.ts --host 127.0.0.1
  ```

- 导入项目会在 OpenCode storage 树下的 `sources.json` 中记录绝对路径。

---

## 目录结构

```text
phrouros/
├── public/                 # 零构建 SPA
│   ├── index.html
│   ├── styles.css
│   ├── app.js              # 看板、瀑布、工作明细
│   ├── detail.js           # 右侧抽屉
│   ├── icons.js
│   └── vendor/
├── src/
│   ├── server.ts           # HTTP 入口（CLI: phrouros）
│   ├── db.ts               # 看板查询 / 主 session 解析
│   ├── session-detail.ts   # /api/session/:id
│   ├── omo.ts              # boulder / 计划
│   ├── pricing.ts          # models.dev 定价
│   ├── sources.ts          # sources.json
│   └── paths.ts            # XDG / 路径
├── package.json
├── tsconfig.json
├── README.md
├── README.zh-CN.md
└── LICENSE
```

---

## 开发

```bash
# 无需 npm install（仅 Bun）
bun run dev          # 热重载
bun run start        # 常规启动
bun run src/server.ts --help
```

无打包步骤。改 `public/*` 后刷新浏览器；改 `src/*` 后重启服务（或使用 `bun run dev`）。

推荐分支流程：

```bash
git checkout -b feat/your-change
# ... 提交 ...
git push -u origin feat/your-change
# 向 main 开 Pull Request
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
