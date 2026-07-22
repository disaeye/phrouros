# Phrouros

[![Bun](https://img.shields.io/badge/runtime-Bun%20%E2%89%A5%201.1-f472b6?logo=bun)](https://bun.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![中文文档](https://img.shields.io/badge/docs-中文-red)](./README.zh-CN.md)

**Phrouros** (φρουρός — sentinel) is a lightweight **local agent monitoring dashboard**.

It reads your OpenCode SQLite database **read-only** and shows the active main session, background agents, token usage, and estimated cost — in a single Bun process with a zero-dependency SPA.

When a project uses [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent), Phrouros also surfaces plan progress and delegated tasks from `.omo/boulder.json`.

> **Language:** English (this file) · [中文文档](./README.zh-CN.md)

---

## Table of contents

- [Why this exists](#why-this-exists)
- [Features](#features)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [How it works](#how-it-works)
- [HTTP API](#http-api)
- [Privacy & security](#privacy--security)
- [Project layout](#project-layout)
- [Development](#development)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Why this exists

OpenCode can spawn many sessions and sub-agents. Token burn, which agent is running, and (with oh-my-openagent) plan progress are hard to see from the CLI alone.

**Phrouros** is a thin, local **agent monitoring cockpit**:

| Goal | Approach |
| --- | --- |
| Fast to run | One Bun process: HTTP API + static SPA |
| Easy to audit | Zero npm runtime dependencies (`bun:sqlite` + native HTTP) |
| Safe by default | Read-only SQLite; UI never shows prompts / tool args / tool outputs |
| OpenCode-first | Sources layout aligns with common OpenCode dashboard conventions; oh-my-openagent is optional enrichment |

---

## Features

- **Project import** — register local project absolute paths as sources
- **Main agent** — single freshest non-archived main session for the selected project
- **Background agents** — child sessions under the main session
- **Execution waterfall** — time × agent lanes; click a bar for detail
- **Session detail drawer** — turns, tool stats/events (metadata only), session todos, parent/children links
- **Work breakdown** (when oh-my-openagent is present) — three clearly labeled lists:
  - **Delegates** — `.omo/boulder` `task_sessions`
  - **Main session todos** — OpenCode `todo` table (`todowrite`) on the main session
  - **Plan checklist** — checkboxes from the plan markdown
- **Token & cost** — input / output / reasoning / cache; USD estimate via [models.dev](https://models.dev/)
- **UI** — light/dark theme, Chinese / English UI strings

---

## Requirements

- [Bun](https://bun.sh) **≥ 1.1**
- A local OpenCode install that has created `opencode.db` (typically under `~/.local/share/opencode/`)
- Optional: project with `.omo/boulder.json` (or legacy `.sisyphus/boulder.json`) for plan / delegate views

---

## Quick start

```bash
git clone https://github.com/disaeye/phrouros.git
cd phrouros
bun run start
```

Open:

```text
http://127.0.0.1:51234
```

Hot reload during development:

```bash
bun run dev
```

### First-time use

1. Start the server.
2. Open the UI → **Import / manage project**.
3. Enter an absolute project path (and optional label) → **Import**.
4. Select the project in the top bar; the board refreshes automatically (auto-refresh is on by default).

---

## Configuration

### CLI flags & environment variables

| Flag | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `--host <addr>` | `PHROUROS_HOST` / `HOST` | `0.0.0.0` | Listen address |
| `--port <n>` | `PHROUROS_PORT` / `PORT` | `51234` | Listen port |
| `--project <path>` | `PHROUROS_PROJECT` | — | Default project directory |
| `--db <path>` | `OPENCODE_DB_PATH` | see below | Path to `opencode.db` |
| `--storage <path>` | — | OpenCode storage root | Root for `sources.json` |
| `-h`, `--help` | — | — | Print help |

Default database path:

```text
${XDG_DATA_HOME:-~/.local/share}/opencode/opencode.db
```

Examples:

```bash
# localhost only
bun run src/server.ts --host 127.0.0.1 --port 51234

# custom OpenCode DB
OPENCODE_DB_PATH=/path/to/opencode.db bun run start
```

---

## How it works

### Data sources (read-only)

| Source | Path (typical) | Used for |
| --- | --- | --- |
| OpenCode SQLite | `~/.local/share/opencode/opencode.db` | sessions, messages, parts, todos, tokens |
| Dashboard sources | `.../opencode/storage/dashboard/sources.json` | imported projects list |
| OMO boulder (optional) | `<project>/.omo/boulder.json` | plan name, status, `task_sessions`, orchestrator |
| Plan markdown | path referenced by boulder | checkbox checklist progress |
| Pricing catalog | [models.dev API](https://models.dev/api.json) | USD estimate ($ / million tokens) |

Pricing is cached under `~/.cache/phrouros/` (default TTL ~6h). On failure the app may fall back to OpenCode’s `~/.cache/opencode/models.json`. Estimates are **directory prices**, not your invoice (proxies / subscriptions may differ).

### Status heuristics

- Updated within the last **2 minutes** → **running**
- Older → **idle**
- Archived sessions are marked separately

### Architecture

```text
┌─────────────────────────────────────────┐
│  Browser SPA (public/)                  │
│  app.js · detail.js · styles.css        │
└─────────────────┬───────────────────────┘
                  │ HTTP JSON
┌─────────────────▼───────────────────────┐
│  Bun server (src/server.ts) · phrouros  │
│  /api/* + static files                  │
├─────────────────────────────────────────┤
│  db.ts · session-detail.ts · omo.ts     │
│  pricing.ts · sources.ts · paths.ts     │
└─────────────────┬───────────────────────┘
                  │ read-only
        opencode.db · boulder.json · models.dev
```

---

## HTTP API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check + DB path |
| `GET` | `/api/sources` | List imported projects |
| `POST` | `/api/sources` | Import `{ "projectRoot": "...", "label?": "..." }` |
| `DELETE` | `/api/sources/:id` | Unregister source (does not delete OpenCode data) |
| `GET` | `/api/dashboard?sourceId=` | Full board snapshot (tokens, agents, OMO, estimates) |
| `GET` | `/api/session/:id` | Session execution detail |
| `GET` | `/api/pricing?refresh=1` | Pricing catalog meta; `refresh=1` forces re-fetch |
| `GET` | `/api/projects` | Projects discovered in the DB |

### Session detail payload (summary)

Returns metadata only: turn labels, tool names/status/duration, todos, parent/child session links, optional OMO task link. **No** prompts, tool arguments, or tool outputs.

---

## Privacy & security

- **Read-only** access to OpenCode SQLite — never writes the OpenCode database.
- UI intentionally **omits** prompt text, tool parameters, and tool results.
- Default bind is `0.0.0.0`. Use only on trusted networks, or bind localhost:

  ```bash
  bun run src/server.ts --host 127.0.0.1
  ```

- Source import stores absolute paths in `sources.json` under your OpenCode storage tree.

---

## Project layout

```text
phrouros/
├── public/                 # Zero-build SPA
│   ├── index.html
│   ├── styles.css
│   ├── app.js              # Board, waterfall, work tabs
│   ├── detail.js           # Right drawer
│   ├── icons.js
│   └── vendor/
├── src/
│   ├── server.ts           # HTTP entry (CLI: phrouros)
│   ├── db.ts               # Dashboard queries / main session resolve
│   ├── session-detail.ts   # /api/session/:id
│   ├── omo.ts              # boulder / plan helpers
│   ├── pricing.ts          # models.dev pricing
│   ├── sources.ts          # sources.json registry
│   └── paths.ts            # XDG / path helpers
├── package.json
├── tsconfig.json
├── README.md
├── README.zh-CN.md
└── LICENSE
```

---

## Development

```bash
# install nothing (Bun only)
bun run dev          # hot reload
bun run start        # production-style run
bun run src/server.ts --help
```

There is no bundler step. Edit `public/*` and refresh the browser; restart the server when changing `src/*` (or use `bun run dev`).

Suggested branch workflow:

```bash
git checkout -b feat/your-change
# ... commit ...
git push -u origin feat/your-change
# open a pull request into main
```

---

## Roadmap

Ideas under consideration (not commitments):

- [ ] Optional tool-level waterfall bars
- [ ] Stronger live status without aggressive polling
- [ ] Packaging / install scripts for non-Bun users (if demand appears)
- [ ] Screenshot / demo GIF in this README

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`feat/...`, `fix/...`)
3. Prefer small, focused commits
4. Open a pull request against `main` with a clear description

Please do not commit secrets, local OpenCode databases, or agent workspace artifacts (`.omo/`, `.codegraph/` are gitignored).

Bug reports and feature requests: use [GitHub Issues](https://github.com/disaeye/phrouros/issues).

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

## Acknowledgments

- [OpenCode](https://github.com/sst/opencode) — agent runtime and local SQLite schema (primary surface Phrouros monitors)
- [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) — orchestration / boulder plan model (optional enrichment)
- [models.dev](https://models.dev/) — public model pricing catalog
- [Bun](https://bun.sh) — runtime (`bun:sqlite`, HTTP, TypeScript)

---

**English** · [中文](./README.zh-CN.md)
