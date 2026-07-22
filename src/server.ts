#!/usr/bin/env bun
import * as fs from "node:fs"
import * as path from "node:path"
import { spawn } from "node:child_process"
import {
  getOpenCodeDbPath,
  getOpenCodeStorageDir,
  canonicalizePath,
} from "./paths"
import {
  addOrUpdateSource,
  getSourceById,
  listSources,
  pickDefaultSourceId,
  removeSource,
  sourcePathExists,
  toSourceView,
} from "./sources"
import { buildDashboard, listProjectsFromDb } from "./db"
import { ensurePricingCatalog, getPricingMeta } from "./pricing"
import { buildSessionDetail } from "./session-detail"

const PACKAGE_ROOT = path.join(import.meta.dir, "..")
const PUBLIC_DIR = path.join(PACKAGE_ROOT, "public")
const VERSION = readPackageVersion()

function readPackageVersion(): string {
  try {
    const raw = fs.readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8")
    const pkg = JSON.parse(raw) as { version?: string }
    return pkg.version?.trim() || "0.0.0"
  } catch {
    return "0.0.0"
  }
}

function ensurePublicDir(): void {
  const indexHtml = path.join(PUBLIC_DIR, "index.html")
  if (!fs.existsSync(indexHtml)) {
    throw new Error(
      `package incomplete: missing UI at ${indexHtml}. Reinstall with: bunx phrouros / bun add -g phrouros`,
    )
  }
}

function parseArgs(argv: string[]) {
  const out: {
    host: string
    port: number
    project: string | null
    dbPath: string
    storageRoot: string
    openBrowser: boolean
  } = {
    host: process.env.PHROUROS_HOST || process.env.HOST || "127.0.0.1",
    port: Number(process.env.PHROUROS_PORT || process.env.PORT || 51234),
    project: process.env.PHROUROS_PROJECT || null,
    dbPath: getOpenCodeDbPath(),
    storageRoot: getOpenCodeStorageDir(),
    openBrowser: process.env.PHROUROS_NO_OPEN !== "1",
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => {
      const v = argv[++i]
      if (v === undefined) throw new Error(`Missing value for ${a}`)
      return v
    }
    if (a === "--host") out.host = next()
    else if (a === "--port") out.port = Number(next())
    else if (a === "--project") out.project = next()
    else if (a === "--db") out.dbPath = path.resolve(next())
    else if (a === "--storage") out.storageRoot = path.resolve(next())
    else if (a === "--no-open") out.openBrowser = false
    else if (a === "--open") out.openBrowser = true
    else if (a === "--version" || a === "-v") {
      console.log(`phrouros ${VERSION}`)
      process.exit(0)
    } else if (a === "--help" || a === "-h") {
      printHelp()
      process.exit(0)
    } else {
      throw new Error(`Unknown option: ${a} (use --help)`)
    }
  }

  if (!Number.isFinite(out.port) || out.port <= 0 || out.port > 65535) {
    throw new Error(`Invalid port: ${out.port}`)
  }
  return out
}

function printHelp() {
  console.log(`phrouros ${VERSION} — local agent monitoring dashboard for OpenCode

Install / run:
  bunx phrouros
  bun add -g phrouros && phrouros

Usage:
  phrouros [options]
  bun run src/server.ts [options]

Options:
  --host <addr>       Listen address (default 127.0.0.1; PHROUROS_HOST / HOST)
  --port <n>          Port (default 51234; PHROUROS_PORT / PORT)
  --project <path>    Default project directory (PHROUROS_PROJECT)
  --db <path>         Path to opencode.db (OPENCODE_DB_PATH)
  --storage <path>    Storage root for sources.json
  --open              Open browser after start (default)
  --no-open           Do not open browser (PHROUROS_NO_OPEN=1)
  -v, --version       Print version
  -h, --help          Show this help

Environment:
  PHROUROS_HOST / HOST
  PHROUROS_PORT / PORT
  PHROUROS_PROJECT
  PHROUROS_NO_OPEN=1
  OPENCODE_DB_PATH
  XDG_DATA_HOME

Requires Bun ≥ 1.1 (https://bun.sh). Not compatible with plain Node / npx.
Docs: https://github.com/disaeye/phrouros
`)
}

function openInBrowser(url: string): void {
  const platform = process.platform
  const cmd =
    platform === "darwin" ? "open" : platform === "win32" ? "cmd" : "xdg-open"
  const args = platform === "win32" ? ["/c", "start", "", url] : [url]
  const child = spawn(cmd, args, {
    detached: true,
    stdio: "ignore",
    shell: platform === "win32",
  })
  child.on("error", (err) => {
    console.warn(`phrouros: could not open browser (${cmd}):`, err.message)
  })
  child.unref()
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}

function contentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8"
    case ".js":
      return "text/javascript; charset=utf-8"
    case ".css":
      return "text/css; charset=utf-8"
    case ".svg":
      return "image/svg+xml"
    case ".png":
      return "image/png"
    case ".json":
      return "application/json; charset=utf-8"
    default:
      return "application/octet-stream"
  }
}

function serveStatic(urlPath: string): Response | null {
  const rel = urlPath === "/" ? "/index.html" : urlPath
  const clean = path.normalize(rel).replace(/^(\.\.[/\\])+/, "")
  const filePath = path.join(PUBLIC_DIR, clean)
  if (!filePath.startsWith(PUBLIC_DIR)) return null
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null
  const body = fs.readFileSync(filePath)
  return new Response(body, {
    headers: {
      "content-type": contentType(filePath),
      "cache-control": urlPath === "/" || urlPath.endsWith(".html") ? "no-store" : "public, max-age=60",
    },
  })
}

function resolveProjectRoot(opts: {
  storageRoot: string
  sourceId: string | null
  projectQuery: string | null
  defaultProject: string | null
}):
  | {
      projectRoot: string
      source: { id: string; label: string } | null
      pathExists: boolean
    }
  | { error: string; status: number } {
  if (opts.sourceId) {
    const source = getSourceById(opts.storageRoot, opts.sourceId)
    if (!source) return { error: `Unknown sourceId: ${opts.sourceId}`, status: 400 }
    return {
      projectRoot: source.projectRoot,
      source: { id: source.id, label: source.label },
      pathExists: sourcePathExists(source.projectRoot),
    }
  }
  if (opts.projectQuery) {
    const projectRoot = canonicalizePath(opts.projectQuery)
    return {
      projectRoot,
      source: null,
      pathExists: sourcePathExists(projectRoot),
    }
  }
  const sources = listSources(opts.storageRoot).map(toSourceView)
  const preferredId = pickDefaultSourceId(sources)
  const preferred = preferredId ? sources.find((s) => s.id === preferredId) : undefined
  if (preferred) {
    return {
      projectRoot: preferred.projectRoot,
      source: { id: preferred.id, label: preferred.label },
      pathExists: preferred.pathExists,
    }
  }
  if (opts.defaultProject) {
    const projectRoot = canonicalizePath(opts.defaultProject)
    return {
      projectRoot,
      source: null,
      pathExists: sourcePathExists(projectRoot),
    }
  }
  return {
    error: "No project selected. POST /api/sources first, or pass sourceId / project.",
    status: 400,
  }
}

async function readJsonBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

const args = parseArgs(process.argv.slice(2))
ensurePublicDir()

const server = Bun.serve({
  hostname: args.host,
  port: args.port,
  async fetch(req) {
    const url = new URL(req.url)
    const { pathname } = url

    try {
      // ---- API ----
      if (pathname === "/api/health") {
        const dbExists = fs.existsSync(args.dbPath)
        return json({
          ok: true,
          dbPath: args.dbPath,
          dbExists,
          storageRoot: args.storageRoot,
          host: args.host,
          port: args.port,
          pricing: getPricingMeta(),
        })
      }

      if (pathname === "/api/pricing" && req.method === "GET") {
        const force = url.searchParams.get("refresh") === "1"
        const pricing = await ensurePricingCatalog({ force })
        return json({ ok: true, pricing })
      }

      if (pathname === "/api/sources" && req.method === "GET") {
        const sources = listSources(args.storageRoot).map((s) => {
          const view = toSourceView(s)
          return {
            id: view.id,
            label: view.label,
            projectRoot: view.projectRoot,
            createdAt: view.createdAt,
            updatedAt: view.updatedAt,
            pathExists: view.pathExists,
          }
        })
        return json({
          ok: true,
          sources,
          defaultSourceId: pickDefaultSourceId(sources),
        })
      }

      if (pathname === "/api/sources" && req.method === "POST") {
        const body = await readJsonBody<{ projectRoot?: string; label?: string }>(req)
        if (!body?.projectRoot?.trim()) {
          return json({ ok: false, error: "projectRoot is required" }, 400)
        }
        try {
          const entry = addOrUpdateSource(args.storageRoot, {
            projectRoot: body.projectRoot.trim(),
            label: body.label,
          })
          return json({ ok: true, source: entry })
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          return json({ ok: false, error: message }, 400)
        }
      }

      if (pathname.startsWith("/api/sources/") && req.method === "DELETE") {
        const sourceId = decodeURIComponent(pathname.slice("/api/sources/".length))
        const removed = removeSource(args.storageRoot, sourceId)
        return json({ ok: removed, sourceId })
      }

      if (pathname === "/api/projects" && req.method === "GET") {
        const dbExists = fs.existsSync(args.dbPath)
        try {
          const projects = listProjectsFromDb(args.dbPath)
          return json({
            ok: true,
            dbPath: args.dbPath,
            dbExists,
            projects,
          })
        } catch (e) {
          return json({
            ok: false,
            dbPath: args.dbPath,
            dbExists,
            projects: [],
            error: e instanceof Error ? e.message : String(e),
          }, 500)
        }
      }

      if (pathname === "/api/dashboard" && req.method === "GET") {
        const sourceId = url.searchParams.get("sourceId")
        const projectQuery = url.searchParams.get("project")
        const resolved = resolveProjectRoot({
          storageRoot: args.storageRoot,
          sourceId,
          projectQuery,
          defaultProject: args.project,
        })
        if ("error" in resolved) {
          return json({ ok: false, error: resolved.error }, resolved.status)
        }
        try {
          const snap = await buildDashboard({
            dbPath: args.dbPath,
            projectRoot: resolved.projectRoot,
            source: resolved.source,
            pathExists: resolved.pathExists,
          })
          return json(snap)
        } catch (e) {
          return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
        }
      }

      const sessionMatch = pathname.match(/^\/api\/session\/([^/]+)(?:\/summary)?$/)
      if (sessionMatch && req.method === "GET") {
        const sessionId = decodeURIComponent(sessionMatch[1]!)
        try {
          const detail = await buildSessionDetail({ dbPath: args.dbPath, sessionId })
          if (!detail.ok) return json({ ok: false, error: detail.error }, detail.status)
          return json(detail)
        } catch (e) {
          return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
        }
      }

      // ---- static UI ----
      const staticResp = serveStatic(pathname)
      if (staticResp) return staticResp

      // SPA fallback
      const index = serveStatic("/")
      if (index && !pathname.startsWith("/api/")) return index

      return json({ ok: false, error: `not found: ${pathname}` }, 404)
    } catch (e) {
      console.error(e)
      return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
    }
  },
})

const displayHost = args.host === "0.0.0.0" ? "127.0.0.1" : args.host
const url = `http://${displayHost}:${server.port}`

console.log(`phrouros ${VERSION} listening`)
console.log(`  url:     ${url}`)
console.log(`  db:      ${args.dbPath}`)
console.log(`  storage: ${args.storageRoot}`)
if (args.project) console.log(`  project: ${args.project}`)

if (args.openBrowser) {
  openInBrowser(url)
  console.log(`  browser: opened`)
} else {
  console.log(`  browser: skipped (--no-open)`)
}

ensurePricingCatalog()
  .then((m) => {
    console.log(
      `  pricing: models.dev (${m.source}, ${m.modelCount} keys)${m.error ? ` · ${m.error}` : ""}`,
    )
  })
  .catch((e) => console.warn("  pricing: failed to load", e))
