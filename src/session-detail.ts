import { Database } from "bun:sqlite"
import {
  openReadonlyDb,
  parseModel,
  inferStatus,
  type SessionRow,
  type TokenBucket,
  type ParsedModel,
} from "./db"
import { estimateCostUsd, ensurePricingCatalog, type EstimatedCost } from "./pricing"
import { readOmoBoulder, type OmoTaskSession, type OmoTodoItem } from "./omo"
import { canonicalizePath } from "./paths"

const SESSION_ID_RE = /^[A-Za-z0-9_-]{1,128}$/
const MAX_TURNS = 40
const MAX_TOOL_EVENTS = 100
const MAX_CHILDREN = 24
const MAX_PART_SCAN = 2500

export type TurnSummary = {
  messageId: string
  agent: string | null
  model: string | null
  finish: string | null
  startedAt: number | null
  endedAt: number | null
  durationMs: number | null
  tokens: { input: number; output: number; reasoning: number; cacheRead: number; cacheWrite: number }
  toolCount: number
  error: boolean
  label: string
  toolSummary: string | null
  toolSample: string | null
}

export type ToolAgg = {
  name: string
  count: number
  running: number
  completed: number
  error: number
  pending: number
  totalDurationMs: number
  avgDurationMs: number | null
  lastAt: number | null
}

export type ToolEvent = {
  id: string
  messageId: string | null
  name: string
  status: string
  startedAt: number | null
  endedAt: number | null
  durationMs: number | null
  title: string | null
}

export type SessionLink = {
  id: string
  title: string
  agent: string | null
  status: string
  timeUpdated: number
}

export type SessionDetail = {
  ok: true
  session: {
    id: string
    title: string
    agent: string
    model: ParsedModel | null
    status: string
    isMain: boolean
    parentId: string | null
    directory: string
    projectId: string
    timeCreated: number
    timeUpdated: number
    ageMs: number
    tokens: TokenBucket
    estimate: EstimatedCost
  }
  parent: SessionLink | null
  children: SessionLink[]
  turns: TurnSummary[]
  tools: ToolAgg[]
  toolEvents: ToolEvent[]
  toolTruncated: boolean
  todos: OmoTodoItem[]
  omoTask: OmoTaskSession | null
  caps: { maxTurns: number; maxToolEvents: number }
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

function tokensFromRow(row: SessionRow, estimatedCost = 0): TokenBucket {
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
    estimatedCost,
  }
}

function getSession(db: Database, id: string): SessionRow | null {
  return (
    db
      .query<SessionRow, [string]>(
        `
    SELECT
      id, project_id, parent_id, directory, title, agent, model,
      cost, tokens_input, tokens_output, tokens_reasoning,
      tokens_cache_read, tokens_cache_write,
      time_created, time_updated, time_archived
    FROM session WHERE id = ? LIMIT 1
  `,
      )
      .get(id) ?? null
  )
}

function linkFromRow(row: SessionRow, now: number): SessionLink {
  return {
    id: row.id,
    title: row.title || "(untitled)",
    agent: row.agent,
    status: inferStatus(row, now),
    timeUpdated: row.time_updated,
  }
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0
}

function parseMessageData(raw: string): Record<string, unknown> | null {
  try {
    const d = JSON.parse(raw) as Record<string, unknown>
    return d && typeof d === "object" ? d : null
  } catch {
    return null
  }
}

function extractTokens(data: Record<string, unknown>) {
  const t = data.tokens
  if (!t || typeof t !== "object") {
    return { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 }
  }
  const tok = t as Record<string, unknown>
  const cache = (tok.cache && typeof tok.cache === "object" ? tok.cache : {}) as Record<string, unknown>
  return {
    input: num(tok.input),
    output: num(tok.output),
    reasoning: num(tok.reasoning),
    cacheRead: num(cache.read),
    cacheWrite: num(cache.write),
  }
}

function extractTimeRange(data: Record<string, unknown>): { start: number | null; end: number | null } {
  const time = data.time
  if (!time || typeof time !== "object") return { start: null, end: null }
  const t = time as Record<string, unknown>
  const start = typeof t.created === "number" ? t.created : typeof t.start === "number" ? t.start : null
  const end =
    typeof t.completed === "number"
      ? t.completed
      : typeof t.end === "number"
        ? t.end
        : typeof t.updated === "number"
          ? t.updated
          : null
  return { start, end }
}

type ToolMsgMeta = {
  count: number
  summary: string | null
  sample: string | null
  names: string[]
}

function sanitizeToolTitle(title: string | null): string | null {
  if (!title) return null
  let s = title.replace(/\s+/g, " ").trim()
  if (!s) return null
  s = s.replace(/\/(?:vol\d+|home|Users|tmp)\/[^\s:]{20,}/g, (m) => {
    const parts = m.split("/").filter(Boolean)
    return parts.slice(-2).join("/")
  })
  if (s.length > 72) s = s.slice(0, 70) + "…"
  return s
}

function buildTurnLabel(opts: {
  finish: string | null
  toolSummary: string | null
  toolSample: string | null
  toolCount: number
  error: boolean
}): string {
  if (opts.error) return opts.toolSample ? `error · ${opts.toolSample}` : "error"
  if (opts.toolCount <= 0) {
    const finish = (opts.finish || "").toLowerCase()
    if (finish === "stop" || finish === "end_turn" || finish === "end-turn") return "reply"
    if (finish) return finish
    return "thinking"
  }
  if (opts.toolCount === 1 && opts.toolSample) return opts.toolSample
  if (opts.toolSummary && opts.toolSample) return `${opts.toolSummary} · ${opts.toolSample}`
  if (opts.toolSample) return opts.toolSample
  if (opts.toolSummary) return opts.toolSummary
  return `tools×${opts.toolCount}`
}

function loadTurns(
  db: Database,
  sessionId: string,
  toolMetaByMessage: Map<string, ToolMsgMeta>,
): TurnSummary[] {
  type Row = { id: string; time_created: number; time_updated: number; data: string }
  const rows = db
    .query<Row, [string]>(
      `
    SELECT id, time_created, time_updated, data
    FROM message
    WHERE session_id = ?
    ORDER BY time_created ASC
    LIMIT 500
  `,
    )
    .all(sessionId)

  const turns: TurnSummary[] = []
  for (const row of rows) {
    const data = parseMessageData(row.data)
    if (!data || data.role !== "assistant") continue
    const { start, end } = extractTimeRange(data)
    const startedAt = start ?? row.time_created ?? null
    const endedAt = end ?? (typeof data.finish === "string" ? row.time_updated : null)
    const durationMs =
      startedAt != null && endedAt != null && endedAt >= startedAt ? endedAt - startedAt : null
    const modelId = typeof data.modelID === "string" ? data.modelID : null
    const provider = typeof data.providerID === "string" ? data.providerID : null
    const model = modelId ? (provider ? `${provider}/${modelId}` : modelId) : null
    const meta = toolMetaByMessage.get(row.id)
    const toolCount = meta?.count || 0
    const toolSummary = meta?.summary ?? null
    const toolSample = meta?.sample ?? null
    const finish = typeof data.finish === "string" ? data.finish : null
    const error = Boolean(data.error)
    turns.push({
      messageId: row.id,
      agent: typeof data.agent === "string" ? data.agent : null,
      model,
      finish,
      startedAt,
      endedAt,
      durationMs,
      tokens: extractTokens(data),
      toolCount,
      error,
      label: buildTurnLabel({ finish, toolSummary, toolSample, toolCount, error }),
      toolSummary,
      toolSample,
    })
  }
  if (turns.length > MAX_TURNS) return turns.slice(-MAX_TURNS)
  return turns
}

function loadTools(db: Database, sessionId: string): {
  events: ToolEvent[]
  byMessage: Map<string, ToolMsgMeta>
  truncated: boolean
} {
  type Row = { id: string; message_id: string; time_created: number; time_updated: number; data: string }
  const rows = db
    .query<Row, [string]>(
      `
    SELECT id, message_id, time_created, time_updated, data
    FROM part
    WHERE session_id = ?
      AND data LIKE '%"type":"tool"%'
    ORDER BY time_created DESC
    LIMIT ${MAX_PART_SCAN}
  `,
    )
    .all(sessionId)

  const events: ToolEvent[] = []
  const counts = new Map<string, Map<string, number>>()
  const samples = new Map<string, { text: string; ranked: boolean }>()

  for (const row of rows) {
    let data: Record<string, unknown>
    try {
      data = JSON.parse(row.data) as Record<string, unknown>
    } catch {
      continue
    }
    if (data.type !== "tool") continue
    const name = typeof data.tool === "string" ? data.tool : "unknown"
    const state = data.state && typeof data.state === "object" ? (data.state as Record<string, unknown>) : {}
    const status = typeof state.status === "string" ? state.status : "unknown"
    const time = state.time && typeof state.time === "object" ? (state.time as Record<string, unknown>) : {}
    const startedAt = typeof time.start === "number" ? time.start : row.time_created
    const endedAt =
      typeof time.end === "number"
        ? time.end
        : status === "completed" || status === "error"
          ? row.time_updated
          : null
    const durationMs =
      startedAt != null && endedAt != null && endedAt >= startedAt ? endedAt - startedAt : null
    const rawTitle = typeof state.title === "string" ? state.title : null
    const title = sanitizeToolTitle(rawTitle)

    events.push({
      id: row.id,
      messageId: row.message_id || null,
      name,
      status,
      startedAt,
      endedAt,
      durationMs,
      title,
    })
    if (row.message_id) {
      const m = counts.get(row.message_id) ?? new Map<string, number>()
      m.set(name, (m.get(name) || 0) + 1)
      counts.set(row.message_id, m)
      const next = title ? { text: `${name}: ${title}`, ranked: true } : { text: name, ranked: false }
      const prev = samples.get(row.message_id)
      if (!prev || (!prev.ranked && next.ranked)) samples.set(row.message_id, next)
    }
  }

  events.reverse()
  const truncated = events.length > MAX_TOOL_EVENTS
  const sliced = truncated ? events.slice(-MAX_TOOL_EVENTS) : events

  const byMessage = new Map<string, ToolMsgMeta>()
  for (const [mid, nameMap] of counts) {
    const names = [...nameMap.entries()].sort((a, b) => b[1] - a[1])
    const summary = names
      .slice(0, 4)
      .map(([n, c]) => (c > 1 ? `${n}×${c}` : n))
      .join(" · ")
    const total = names.reduce((a, [, c]) => a + c, 0)
    byMessage.set(mid, {
      count: total,
      summary: summary || null,
      sample: samples.get(mid)?.text ?? null,
      names: names.map(([n]) => n),
    })
  }

  return { events: sliced, byMessage, truncated }
}

function aggregateTools(events: ToolEvent[]): ToolAgg[] {
  const map = new Map<string, ToolAgg>()
  for (const e of events) {
    const cur =
      map.get(e.name) ??
      ({
        name: e.name,
        count: 0,
        running: 0,
        completed: 0,
        error: 0,
        pending: 0,
        totalDurationMs: 0,
        avgDurationMs: null,
        lastAt: null,
      } satisfies ToolAgg)
    cur.count += 1
    const s = e.status.toLowerCase()
    if (s === "running") cur.running += 1
    else if (s === "completed" || s === "done") cur.completed += 1
    else if (s === "error" || s === "failed") cur.error += 1
    else if (s === "pending" || s === "queued") cur.pending += 1
    if (e.durationMs != null) cur.totalDurationMs += e.durationMs
    const t = e.endedAt ?? e.startedAt
    if (t != null && (cur.lastAt == null || t > cur.lastAt)) cur.lastAt = t
    map.set(e.name, cur)
  }
  const list = [...map.values()].map((a) => {
    const timed = a.completed + a.error
    return {
      ...a,
      avgDurationMs: timed > 0 && a.totalDurationMs > 0 ? Math.round(a.totalDurationMs / timed) : null,
    }
  })
  list.sort((a, b) => b.count - a.count || b.totalDurationMs - a.totalDurationMs)
  return list
}

function loadTodos(db: Database, sessionId: string): OmoTodoItem[] {
  type Row = { content: string; status: string; priority: string; position: number }
  try {
    return db
      .query<Row, [string]>(
        `
      SELECT content, status, priority, position
      FROM todo WHERE session_id = ?
      ORDER BY position ASC LIMIT 80
    `,
      )
      .all(sessionId)
  } catch {
    return []
  }
}

function loadChildren(db: Database, parentId: string, now: number): SessionLink[] {
  const rows = db
    .query<SessionRow, [string]>(
      `
    SELECT
      id, project_id, parent_id, directory, title, agent, model,
      cost, tokens_input, tokens_output, tokens_reasoning,
      tokens_cache_read, tokens_cache_write,
      time_created, time_updated, time_archived
    FROM session
    WHERE parent_id = ?
    ORDER BY time_updated DESC
    LIMIT ${MAX_CHILDREN}
  `,
    )
    .all(parentId)
  return rows.map((r) => linkFromRow(r, now))
}

function findOmoTask(directory: string, sessionId: string): OmoTaskSession | null {
  try {
    const boulder = readOmoBoulder(canonicalizePath(directory))
    if (!boulder.present) return null
    return boulder.taskSessions.find((t) => t.sessionId === sessionId) ?? null
  } catch {
    return null
  }
}

export async function buildSessionDetail(opts: {
  dbPath: string
  sessionId: string
}): Promise<SessionDetail | { ok: false; error: string; status: number }> {
  if (!SESSION_ID_RE.test(opts.sessionId)) {
    return { ok: false, error: "invalid session id", status: 400 }
  }

  await ensurePricingCatalog()
  const now = Date.now()
  const db = openReadonlyDb(opts.dbPath)
  try {
    const row = getSession(db, opts.sessionId)
    if (!row) return { ok: false, error: "session not found", status: 404 }

    const model = parseModel(row.model)
    const baseTokens = tokensFromRow(row, 0)
    const estimate = estimateCostUsd(baseTokens, model)
    const tokens = tokensFromRow(row, estimate.usd)

    const { events, byMessage: toolMetaByMessage, truncated } = loadTools(db, row.id)
    const turns = loadTurns(db, row.id, toolMetaByMessage)
    const tools = aggregateTools(events)
    const todos = loadTodos(db, row.id)
    const children = loadChildren(db, row.id, now)

    let parent: SessionLink | null = null
    if (row.parent_id) {
      const p = getSession(db, row.parent_id)
      if (p) parent = linkFromRow(p, now)
    }

    const omoTask = findOmoTask(row.directory, row.id)

    return {
      ok: true,
      session: {
        id: row.id,
        title: row.title || "(untitled)",
        agent: row.agent || "(unknown)",
        model,
        status: inferStatus(row, now),
        isMain: !row.parent_id,
        parentId: row.parent_id,
        directory: row.directory,
        projectId: row.project_id,
        timeCreated: row.time_created,
        timeUpdated: row.time_updated,
        ageMs: Math.max(0, now - (row.time_updated || 0)),
        tokens,
        estimate,
      },
      parent,
      children,
      turns,
      tools,
      toolEvents: events,
      toolTruncated: truncated,
      todos,
      omoTask,
      caps: { maxTurns: MAX_TURNS, maxToolEvents: MAX_TOOL_EVENTS },
    }
  } finally {
    db.close()
  }
}
