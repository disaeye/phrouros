# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-07-22

First public release.

### Added

- Local Bun HTTP server + zero-build SPA dashboard for OpenCode sessions
- CLI entry `phrouros` (`bunx phrouros` / `bun add -g phrouros`)
- Project import registry (`sources.json` under OpenCode storage)
- Empty-state discovery of projects from `opencode.db`
- Main session + background agents, execution waterfall, session detail drawer
- Optional oh-my-openagent enrichment (boulder / plan checklist / delegates)
- Token usage and USD estimates via [models.dev](https://models.dev/)
- Chinese / English UI strings; light / dark theme
- Read-only SQLite access; UI omits prompts and tool I/O

### Fixed

- Registered sources whose project directory no longer exists: graceful empty board + `pathExists` flag; default source prefers a path that still exists

### Notes

- Requires Bun ≥ 1.1 (not compatible with plain Node / `npx`)
- Default listen address is `127.0.0.1:51234`

[0.1.0]: https://github.com/disaeye/phrouros
