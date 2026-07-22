import { Database } from "bun:sqlite"
import * as fs from "node:fs"
import * as path from "node:path"
import { canonicalizePath } from "./paths"
import {
  ensurePricingCatalog,
  estimateCostUsd,
  getPricingMeta,
  type EstimatedCost,
  type PricingCatalogMeta,
} from "./pricing"
import {
  boulderMainSessionIds,
  readOmoBoulder,
  readOmoConfig,
  type OmoBoulderView,
  type OmoConfigView,
  type OmoTodoItem,
} from "./omo"

export type SessionRow = {
  id: string
  project_id: string
  parent_id: string | null
  directory: string
  title: string
  agent: string | null
  model: string | null
  cost: number
  tokens_input: number
  tokens_output: number
  tokens_reasoning: number
  tokens_cache_read: number
  tokens_cache_write: number
  time_created: number
  time_updated: number
  time_archived: number | null
}

export type TokenBucket = {
  input: number
  output: number
  reasoning: number
  cacheRead: number
  cacheWrite: number
  total: number
  cost: number
  estimatedCost: number
}

export type ParsedModel = {
  id: string
  providerID: string | null
  variant: string | null
  label: string
}

export type AgentStatus = "running" | "idle" | "archived" | "unknown"

export type AgentView = {
  id: string
  title: string
  agent: string
  model: ParsedModel | null
  status: AgentStatus
  isMain: boolean
  parentId: string | null
  directory: string
  tokens: TokenBucket
  estimate: EstimatedCost
  timeCreated: number
  timeUpdated: number
  ageMs: number
}

export type ModelBreakdownRow = {
  model: string
  modelId: string | null
  sessions: number
  tokens: TokenBucket
  estimate: EstimatedCost
  rateLabel: string | null
}

export type DashboardSnapshot = {
  ok: true
  generatedAt: number
  dbPath: string
  projectRoot: string
  pathExists: boolean
  source: { id: string; label: string } | null
  main: AgentView | null
  background: AgentView[]
  totals: {
    main: TokenBucket
    background: TokenBucket
    all: TokenBucket
    backgroundCount: number
    runningBackgroundCount: number
    estimatedCost: number
    unmatchedSessions: number
  }
  modelBreakdown: ModelBreakdownRow[]
  pricing: PricingCatalogMeta
  omo: {
    boulder: OmoBoulderView
    config: OmoConfigView
    todos: OmoTodoItem[]
  }
  note: string | null
  noteCode?: "path_missing" | "no_main_session" | null
}

export type DashboardEmpty = {
  ok: true
  generatedAt: number
  dbPath: string
  projectRoot: string | null
  source: { id: string; label: string } | null
  main: null
  background: []
  totals: null
  modelBreakdown: []
  note: string
}

const RUNNING_MS = 2 * 60 * 1000
const IDLE_MS = 30 * 60 * 1000

export function openReadonlyDb(dbPath: string): Database {
  if (!fs.existsSync(dbPath)) {
    throw new Error(`OpenCode database not found: ${dbPath}`)
  }
  // mode=ro + immutable query_only: never write; tolerate concurrent OpenCode WAL writers
  const db = new Database(dbPath, { readonly: true, create: false })
  try {
    db.exec("PRAGMA query_only = ON")
    db.exec("PRAGMA busy_timeout = 3000")
  } catch {
    // ignore pragma failures on older sqlite
  }
  return db
}

export function parseModel(raw: string | null | undefined): ParsedModel | null {
  if (!raw) return null
  try {
    const obj = JSON.parse(raw) as { id?: string; providerID?: string; variant?: string }
    if (!obj?.id) return null
    const providerID = obj.providerID ?? null
    const variant = obj.variant ?? null
    const label = [providerID, obj.id, variant].filter(Boolean).join(" / ")
    return { id: obj.id, providerID, variant, label }
  } catch {
    // plain string model id
    return { id: raw, providerID: null, variant: null, label: raw }
  }
}

function emptyTokens(): TokenBucket {
  return {
    input: 0,
    output: 0,
    reasoning: 0,
    cacheRead: 0,
    cacheWrite: 0,
    total: 0,
    cost: 0,
    estimatedCost: 0,
  }
}

function tokensFromRow(row: SessionRow, estimateUsd = 0): TokenBucket {
  const input = row.tokens_input || 0
  const output = row.tokens_output || 0
  const reasoning = row.tokens_reasoning || 0
  const cacheRead = row.tokens_cache_read || 0
  const cacheWrite = row.tokens_cache_write || 0
  return {
    input,
    output,
    reasoning,
    cacheRead,
    cacheWrite,
    total: input + output + reasoning,
    cost: row.cost || 0,
    estimatedCost: estimateUsd,
  }
}

function addTokens(a: TokenBucket, b: TokenBucket): TokenBucket {
  const estimatedCost =
    Math.round((a.estimatedCost + b.estimatedCost) * 1e6) / 1e6
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    reasoning: a.reasoning + b.reasoning,
    cacheRead: a.cacheRead + b.cacheRead,
    cacheWrite: a.cacheWrite + b.cacheWrite,
    total: a.total + b.total,
    cost: a.cost + b.cost,
    estimatedCost,
  }
}

export function inferStatus(row: SessionRow, now = Date.now()): AgentStatus {
  if (row.time_archived) return "archived"
  const age = now - (row.time_updated || 0)
  if (age < 0) return "unknown"
  if (age <= RUNNING_MS) return "running"
  if (age <= IDLE_MS) return "idle"
  return "idle"
}

function toAgentView(row: SessionRow, now: number): AgentView {
  const model = parseModel(row.model)
  const baseTokens = tokensFromRow(row, 0)
  const estimate = estimateCostUsd(baseTokens, model)
  const tokens = tokensFromRow(row, estimate.usd)
  return {
    id: row.id,
    title: row.title?.trim() || "untitled",
    agent: row.agent?.trim() || "unknown",
    model,
    status: inferStatus(row, now),
    isMain: !row.parent_id,
    parentId: row.parent_id,
    directory: row.directory,
    tokens,
    estimate,
    timeCreated: row.time_created,
    timeUpdated: row.time_updated,
    ageMs: Math.max(0, now - (row.time_updated || 0)),
  }
}

/** Find the single active (most recently updated, non-archived) main session for a project directory. */
export function findActiveMainSession(
  db: Database,
  projectRoot: string,
): SessionRow | null {
  const canonical = canonicalizePath(projectRoot)
  // Exact directory match first (OpenCode stores the launch cwd).
  // Also accept sessions whose directory is under the project root (worktrees).
  const likePrefix = `${canonical}/%`
  const many = db.query<SessionRow, [string, string]>(`
    SELECT
      id, project_id, parent_id, directory, title, agent, model,
      cost, tokens_input, tokens_output, tokens_reasoning,
      tokens_cache_read, tokens_cache_write,
      time_created, time_updated, time_archived
    FROM session
    WHERE parent_id IS NULL
      AND time_archived IS NULL
      AND (
        directory = ?
        OR directory LIKE ?
      )
    ORDER BY time_updated DESC
    LIMIT 40
  `).all(canonical, likePrefix)

  if (many.length === 0) {
    try {
      const viaProject = db.query<SessionRow, [string]>(`
        SELECT
          s.id, s.project_id, s.parent_id, s.directory, s.title, s.agent, s.model,
          s.cost, s.tokens_input, s.tokens_output, s.tokens_reasoning,
          s.tokens_cache_read, s.tokens_cache_write,
          s.time_created, s.time_updated, s.time_archived
        FROM session s
        JOIN project p ON p.id = s.project_id
        WHERE s.parent_id IS NULL
          AND s.time_archived IS NULL
          AND p.worktree = ?
        ORDER BY s.time_updated DESC
        LIMIT 1
      `).get(canonical)
      return viaProject ?? null
    } catch {
      return null
    }
  }

  // Prefer exact directory equality, then already ordered by time_updated DESC
  const exact = many.filter((r) => canonicalizePath(r.directory) === canonical)
  if (exact.length) return exact[0] ?? null
  return many[0] ?? null
}

export function pickNewestMainSessionByIds(db: Database, ids: string[]): SessionRow | null {
  if (!ids.length) return null
  let best: SessionRow | null = null
  for (const id of ids) {
    const row = getSessionById(db, id)
    if (!row || row.parent_id || row.time_archived) continue
    if (!best || (row.time_updated || 0) > (best.time_updated || 0)) best = row
  }
  return best
}

export function resolveMainSession(
  db: Database,
  projectRoot: string,
  boulder: OmoBoulderView,
): SessionRow | null {
  const fromBoulder = pickNewestMainSessionByIds(db, boulderMainSessionIds(boulder))
  const fromDir = findActiveMainSession(db, projectRoot)
  if (fromBoulder && fromDir) {
    return (fromBoulder.time_updated || 0) >= (fromDir.time_updated || 0) ? fromBoulder : fromDir
  }
  return fromBoulder ?? fromDir
}

export function listChildSessions(db: Database, parentId: string): SessionRow[] {
  return db.query<SessionRow, [string]>(`
    SELECT
      id, project_id, parent_id, directory, title, agent, model,
      cost, tokens_input, tokens_output, tokens_reasoning,
      tokens_cache_read, tokens_cache_write,
      time_created, time_updated, time_archived
    FROM session
    WHERE parent_id = ?
    ORDER BY time_updated DESC
  `).all(parentId)
}

function getSessionById(db: Database, id: string): SessionRow | null {
  return db.query<SessionRow, [string]>(`
    SELECT
      id, project_id, parent_id, directory, title, agent, model,
      cost, tokens_input, tokens_output, tokens_reasoning,
      tokens_cache_read, tokens_cache_write,
      time_created, time_updated, time_archived
    FROM session
    WHERE id = ?
    LIMIT 1
  `).get(id) ?? null
}

function listTodos(db: Database, sessionId: string): OmoTodoItem[] {
  type Row = { content: string; status: string; priority: string; position: number }
  try {
    return db.query<Row, [string]>(`
      SELECT content, status, priority, position
      FROM todo
      WHERE session_id = ?
      ORDER BY position ASC
      LIMIT 80
    `).all(sessionId)
  } catch {
    return []
  }
}

function emptyOmoPayload(projectRoot: string) {
  return {
    boulder: projectRoot ? readOmoBoulder(projectRoot) : {
      present: false as const,
      schemaVersion: null,
      status: null,
      agent: null,
      planName: null,
      activePlan: null,
      activeWorkId: null,
      startedAt: null,
      updatedAt: null,
      sessionIds: [] as string[],
      plan: {
        missing: true,
        total: 0,
        completed: 0,
        isComplete: false,
        percent: 0,
        steps: [],
        stepsTruncated: false,
      },
      taskSessions: [],
      taskStatusCounts: {},
    },
    config: readOmoConfig(),
    todos: [] as OmoTodoItem[],
  }
}

export async function buildDashboard(opts: {
  dbPath: string
  projectRoot: string
  source?: { id: string; label: string } | null
  pathExists?: boolean
}): Promise<DashboardSnapshot> {
  await ensurePricingCatalog()
  const pricing = getPricingMeta()
  const now = Date.now()
  const pathExists =
    typeof opts.pathExists === "boolean"
      ? opts.pathExists
      : (() => {
          try {
            return fs.existsSync(opts.projectRoot) && fs.statSync(opts.projectRoot).isDirectory()
          } catch {
            return false
          }
        })()
  const projectRoot = pathExists ? canonicalizePath(opts.projectRoot) : path.resolve(opts.projectRoot)
  const emptyBoard = (
    noteCode: "path_missing" | "no_main_session",
    note: string,
    omoRoot: string,
  ): DashboardSnapshot => ({
    ok: true,
    generatedAt: now,
    dbPath: opts.dbPath,
    projectRoot,
    pathExists,
    source: opts.source ?? null,
    main: null,
    background: [],
    totals: {
      main: emptyTokens(),
      background: emptyTokens(),
      all: emptyTokens(),
      backgroundCount: 0,
      runningBackgroundCount: 0,
      estimatedCost: 0,
      unmatchedSessions: 0,
    },
    modelBreakdown: [],
    pricing,
    omo: emptyOmoPayload(omoRoot),
    note,
    noteCode,
  })

  if (!pathExists) {
    return emptyBoard(
      "path_missing",
      `Project directory missing: ${projectRoot}. Switch project or remove this source and re-import.`,
      "",
    )
  }

  const omoBase = emptyOmoPayload(projectRoot)
  const db = openReadonlyDb(opts.dbPath)
  try {
    const mainRow = resolveMainSession(db, projectRoot, omoBase.boulder)

    if (!mainRow) {
      return emptyBoard(
        "no_main_session",
        "No unarchived main session found under this directory. Confirm OpenCode was started there.",
        projectRoot,
      )
    }

    const children = listChildSessions(db, mainRow.id)
    const main = toAgentView(mainRow, now)
    const background = children.map((c) => toAgentView(c, now))
    const todos = listTodos(db, mainRow.id)

    let bgTokens = emptyTokens()
    type Agg = {
      modelId: string | null
      modelLabel: string
      sessions: number
      tokens: TokenBucket
      sampleModel: ParsedModel | null
    }
    const modelMap = new Map<string, Agg>()

    const modelGroupKey = (model: ParsedModel | null | undefined): string => {
      const id = model?.id?.trim()
      if (!id) return "unknown"
      return id.toLowerCase()
    }

    const modelGroupLabel = (model: ParsedModel | null | undefined, key: string): string => {
      return model?.id?.trim() || key
    }

    const accumulate = (view: AgentView) => {
      const key = modelGroupKey(view.model)
      const prev = modelMap.get(key)
      if (!prev) {
        modelMap.set(key, {
          modelId: view.model?.id ?? null,
          modelLabel: modelGroupLabel(view.model, key),
          sessions: 1,
          tokens: { ...view.tokens },
          sampleModel: view.model,
        })
        return
      }
      modelMap.set(key, {
        modelId: prev.modelId ?? view.model?.id ?? null,
        modelLabel: prev.modelLabel,
        sessions: prev.sessions + 1,
        tokens: addTokens(prev.tokens, view.tokens),
        sampleModel: prev.sampleModel ?? view.model,
      })
    }

    accumulate(main)
    for (const b of background) {
      bgTokens = addTokens(bgTokens, b.tokens)
      accumulate(b)
    }

    const all = addTokens(main.tokens, bgTokens)
    const allViews = [main, ...background]
    const unmatchedSessions = allViews.filter((v) => !v.estimate.matched).length

    const modelBreakdown: ModelBreakdownRow[] = [...modelMap.values()]
      .map((v) => {
        const estimate = estimateCostUsd(v.tokens, v.sampleModel)
        const rateLabel = estimate.match
          ? `${estimate.match.providerId} · in $${estimate.match.rate.input}/M · out $${estimate.match.rate.output}/M`
          : null
        return {
          model: v.modelLabel,
          modelId: v.modelId,
          sessions: v.sessions,
          tokens: { ...v.tokens, estimatedCost: estimate.usd },
          estimate,
          rateLabel,
        }
      })
      .sort((a, b) => b.tokens.estimatedCost - a.tokens.estimatedCost || b.tokens.total - a.tokens.total)

    return {
      ok: true,
      generatedAt: now,
      dbPath: opts.dbPath,
      projectRoot,
      pathExists,
      source: opts.source ?? null,
      main,
      background,
      totals: {
        main: main.tokens,
        background: bgTokens,
        all,
        backgroundCount: background.length,
        runningBackgroundCount: background.filter((b) => b.status === "running").length,
        estimatedCost: all.estimatedCost,
        unmatchedSessions,
      },
      modelBreakdown,
      pricing,
      omo: {
        ...omoBase,
        todos,
      },
      note: null,
      noteCode: null,
    }
  } finally {
    db.close()
  }
}

export type DiscoveredProject = {
  id: string
  worktree: string
  name: string | null
  sessionCount: number
  lastActive: number | null
  pathExists: boolean
  label: string
}

function projectLabel(name: string | null, worktree: string): string {
  const fromName = name?.trim()
  if (fromName) return fromName
  const base = worktree.replace(/\/+$/, "").split("/").pop()
  return base || worktree
}

export function listProjectsFromDb(dbPath: string): DiscoveredProject[] {
  if (!fs.existsSync(dbPath)) return []
  const db = openReadonlyDb(dbPath)
  try {
    type Row = {
      id: string
      worktree: string
      name: string | null
      session_count: number
      last_active: number | null
    }
    const rows = db.query<Row, []>(`
      SELECT
        p.id,
        p.worktree,
        p.name,
        COUNT(s.id) AS session_count,
        MAX(s.time_updated) AS last_active
      FROM project p
      LEFT JOIN session s ON s.project_id = p.id AND s.parent_id IS NULL
      GROUP BY p.id
      ORDER BY last_active IS NULL, last_active DESC
      LIMIT 100
    `).all()
    return rows.map((r) => {
      const worktree = r.worktree || ""
      let pathExists = false
      try {
        pathExists = Boolean(worktree && fs.existsSync(worktree) && fs.statSync(worktree).isDirectory())
      } catch {
        pathExists = false
      }
      return {
        id: r.id,
        worktree,
        name: r.name,
        sessionCount: r.session_count,
        lastActive: r.last_active,
        pathExists,
        label: projectLabel(r.name, worktree),
      }
    })
  } finally {
    db.close()
  }
}
