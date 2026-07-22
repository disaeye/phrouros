#!/usr/bin/env bun
import * as fs from "node:fs"
import * as path from "node:path"
import {
  getOpenCodeDbPath,
  getOpenCodeStorageDir,
  canonicalizePath,
} from "./paths"
import {
  addOrUpdateSource,
  getSourceById,
  listSources,
  removeSource,
} from "./sources"
import { buildDashboard, listProjectsFromDb } from "./db"
import { ensurePricingCatalog, getPricingMeta } from "./pricing"
import { buildSessionDetail } from "./session-detail"

const PUBLIC_DIR = path.join(import.meta.dir, "..", "public")

function parseArgs(argv: string[]) {
  const out: {
    host: string
    port: number
    project: string | null
    dbPath: string
    storageRoot: string
  } = {
    host: process.env.PHROUROS_HOST || process.env.HOST || "0.0.0.0",
    port: Number(process.env.PHROUROS_PORT || process.env.PORT || 51234),
    project: process.env.PHROUROS_PROJECT || null,
    dbPath: getOpenCodeDbPath(),
    storageRoot: getOpenCodeStorageDir(),
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => {
      const v = argv[++i]
      if (v === undefined) throw new Error(`缺少参数值: ${a}`)
      return v
    }
    if (a === "--host") out.host = next()
    else if (a === "--port") out.port = Number(next())
    else if (a === "--project") out.project = next()
    else if (a === "--db") out.dbPath = path.resolve(next())
    else if (a === "--storage") out.storageRoot = path.resolve(next())
    else if (a === "--help" || a === "-h") {
      printHelp()
      process.exit(0)
    }
  }

  if (!Number.isFinite(out.port) || out.port <= 0 || out.port > 65535) {
    throw new Error(`无效端口: ${out.port}`)
  }
  return out
}

function printHelp() {
  console.log(`phrouros — local agent monitoring dashboard

用法:
  bun run src/server.ts [选项]
  phrouros [选项]

选项:
  --host <addr>       监听地址 (默认 0.0.0.0，可用 PHROUROS_HOST)
  --port <n>          端口 (默认 51234)
  --project <path>    默认 project 目录
  --db <path>         opencode.db 路径
  --storage <path>    storage 根目录 (sources.json 所在树)

环境变量:
  PHROUROS_HOST / HOST
  PHROUROS_PORT / PORT
  PHROUROS_PROJECT
  OPENCODE_DB_PATH
  XDG_DATA_HOME
`)
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
}): { projectRoot: string; source: { id: string; label: string } | null } | { error: string; status: number } {
  if (opts.sourceId) {
    const source = getSourceById(opts.storageRoot, opts.sourceId)
    if (!source) return { error: `未知 sourceId: ${opts.sourceId}`, status: 400 }
    return { projectRoot: source.projectRoot, source: { id: source.id, label: source.label } }
  }
  if (opts.projectQuery) {
    return { projectRoot: canonicalizePath(opts.projectQuery), source: null }
  }
  // Prefer default registered source
  const sources = listSources(opts.storageRoot)
  if (sources[0]) {
    return {
      projectRoot: sources[0].projectRoot,
      source: { id: sources[0].id, label: sources[0].label },
    }
  }
  if (opts.defaultProject) {
    return { projectRoot: canonicalizePath(opts.defaultProject), source: null }
  }
  return { error: "未选择 project。请先 POST /api/sources 导入目录，或传 sourceId / project。", status: 400 }
}

async function readJsonBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

const args = parseArgs(process.argv.slice(2))

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
        const sources = listSources(args.storageRoot).map((s) => ({
          id: s.id,
          label: s.label,
          projectRoot: s.projectRoot,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }))
        return json({ ok: true, sources, defaultSourceId: sources[0]?.id ?? null })
      }

      if (pathname === "/api/sources" && req.method === "POST") {
        const body = await readJsonBody<{ projectRoot?: string; label?: string }>(req)
        if (!body?.projectRoot?.trim()) {
          return json({ ok: false, error: "需要 projectRoot" }, 400)
        }
        const entry = addOrUpdateSource(args.storageRoot, {
          projectRoot: body.projectRoot.trim(),
          label: body.label,
        })
        return json({ ok: true, source: entry })
      }

      if (pathname.startsWith("/api/sources/") && req.method === "DELETE") {
        const sourceId = decodeURIComponent(pathname.slice("/api/sources/".length))
        const removed = removeSource(args.storageRoot, sourceId)
        return json({ ok: removed, sourceId })
      }

      if (pathname === "/api/projects" && req.method === "GET") {
        try {
          const projects = listProjectsFromDb(args.dbPath)
          return json({ ok: true, projects })
        } catch (e) {
          return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
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

      return json({ ok: false, error: "not found" }, 404)
    } catch (e) {
      console.error(e)
      return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
    }
  },
})

console.log(`phrouros 已启动`)
console.log(`  地址:   http://${args.host === "0.0.0.0" ? "127.0.0.1" : args.host}:${server.port}`)
console.log(`  数据库: ${args.dbPath}`)
console.log(`  存储:   ${args.storageRoot}`)
if (args.project) console.log(`  默认项目: ${args.project}`)

// Warm models.dev price catalog in background
ensurePricingCatalog()
  .then((m) => {
    console.log(
      `  价格源: models.dev (${m.source}, ${m.modelCount} keys)${m.error ? ` · fallback note: ${m.error}` : ""}`,
    )
  })
  .catch((e) => console.warn("  价格目录加载失败:", e))
