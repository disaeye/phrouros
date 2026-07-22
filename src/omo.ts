import * as fs from "node:fs"
import * as path from "node:path"
import { canonicalizePath } from "./paths"

export type OmoTaskSession = {
  taskKey: string
  taskLabel: string | null
  taskTitle: string
  sessionId: string | null
  agent: string | null
  category: string | null
  status: string
  startedAt: string | null
  endedAt: string | null
  updatedAt: string | null
  elapsedMs: number | null
}

export type OmoPlanStep = {
  checked: boolean
  text: string
}

export type OmoBoulderView = {
  present: boolean
  schemaVersion: number | null
  status: string | null
  agent: string | null
  planName: string | null
  activePlan: string | null
  activeWorkId: string | null
  startedAt: string | null
  updatedAt: string | null
  sessionIds: string[]
  plan: {
    missing: boolean
    total: number
    completed: number
    isComplete: boolean
    percent: number
    steps: OmoPlanStep[]
    stepsTruncated: boolean
  }
  taskSessions: OmoTaskSession[]
  taskStatusCounts: Record<string, number>
}

export type OmoConfigView = {
  present: boolean
  path: string | null
  teamMode: boolean | null
  agents: string[]
  categories: string[]
}

export type OmoTodoItem = {
  content: string
  status: string
  priority: string
  position: number
}

const MAX_PLAN_STEPS = 80
const MAX_TASK_SESSIONS = 100

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T
  } catch {
    return null
  }
}

function stripOpenCodePrefix(sessionId: string | null | undefined): string | null {
  if (!sessionId || typeof sessionId !== "string") return null
  const s = sessionId.trim()
  if (!s) return null
  return s.startsWith("opencode:") ? s.slice("opencode:".length) : s
}

function findBoulderPath(projectRoot: string): string | null {
  const candidates = [
    path.join(projectRoot, ".omo", "boulder.json"),
    path.join(projectRoot, ".sisyphus", "boulder.json"),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

type RawTask = {
  task_key?: string
  task_label?: string
  task_title?: string
  session_id?: string
  agent?: string
  category?: string
  status?: string
  started_at?: string
  ended_at?: string
  updated_at?: string
  elapsed_ms?: number
}

type RawBoulder = {
  schema_version?: number
  active_plan?: string
  plan_name?: string
  agent?: string
  status?: string
  started_at?: string
  updated_at?: string
  ended_at?: string
  active_work_id?: string
  session_ids?: string[]
  task_sessions?: Record<string, RawTask>
  works?: Record<
    string,
    {
      active_plan?: string
      plan_name?: string
      agent?: string
      status?: string
      started_at?: string
      updated_at?: string
      session_ids?: string[]
      task_sessions?: Record<string, RawTask>
    }
  >
}

function parsePlanProgress(content: string): {
  total: number
  completed: number
  isComplete: boolean
  steps: OmoPlanStep[]
} {
  const steps: OmoPlanStep[] = []
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim()
    const m = line.match(/^[-*]\s*\[(\s|x|X)\]\s*(.*)$/)
    if (!m) continue
    steps.push({
      checked: m[1] === "x" || m[1] === "X",
      text: (m[2] ?? "").trim(),
    })
  }
  const total = steps.length
  const completed = steps.filter((s) => s.checked).length
  return {
    total,
    completed,
    isComplete: total === 0 || completed === total,
    steps,
  }
}

function nonEmptyTaskSessions(
  raw: Record<string, RawTask> | undefined,
): Record<string, RawTask> | undefined {
  if (!raw || typeof raw !== "object") return undefined
  return Object.keys(raw).length > 0 ? raw : undefined
}

function normalizeTaskSessions(raw: Record<string, RawTask> | undefined): OmoTaskSession[] {
  if (!raw || typeof raw !== "object") return []
  const list: OmoTaskSession[] = []
  for (const [key, t] of Object.entries(raw)) {
    if (!t || typeof t !== "object") continue
    list.push({
      taskKey: t.task_key || key,
      taskLabel: t.task_label ?? null,
      taskTitle: t.task_title || key,
      sessionId: stripOpenCodePrefix(t.session_id),
      agent: t.agent ?? null,
      category: t.category ?? null,
      status: t.status || "unknown",
      startedAt: t.started_at ?? null,
      endedAt: t.ended_at ?? null,
      updatedAt: t.updated_at ?? null,
      elapsedMs: typeof t.elapsed_ms === "number" ? t.elapsed_ms : null,
    })
  }
  // active first, then recent
  const rank = (s: string) => {
    const x = s.toLowerCase()
    if (x === "running" || x === "in_progress" || x === "active") return 0
    if (x === "pending" || x === "queued") return 1
    if (x === "completed" || x === "done") return 3
    if (x === "error" || x === "failed") return 2
    return 4
  }
  list.sort((a, b) => {
    const rd = rank(a.status) - rank(b.status)
    if (rd !== 0) return rd
    return String(b.updatedAt || b.startedAt || "").localeCompare(String(a.updatedAt || a.startedAt || ""))
  })
  return list.slice(0, MAX_TASK_SESSIONS)
}

function emptyBoulder(): OmoBoulderView {
  return {
    present: false,
    schemaVersion: null,
    status: null,
    agent: null,
    planName: null,
    activePlan: null,
    activeWorkId: null,
    startedAt: null,
    updatedAt: null,
    sessionIds: [],
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
  }
}

/** Read oh-my-openagent boulder + plan for a project directory. */
export function readOmoBoulder(projectRoot: string): OmoBoulderView {
  const root = canonicalizePath(projectRoot)
  const boulderPath = findBoulderPath(root)
  if (!boulderPath) return emptyBoulder()

  const raw = readJsonFile<RawBoulder>(boulderPath)
  if (!raw) return emptyBoulder()

  // Prefer top-level active fields; fall back to active work entry
  let activePlan = raw.active_plan ?? null
  let planName = raw.plan_name ?? null
  let agent = raw.agent ?? null
  let status = raw.status ?? null
  let startedAt = raw.started_at ?? null
  let updatedAt = raw.updated_at ?? null
  let sessionIds = (raw.session_ids || []).map((s) => stripOpenCodePrefix(s)).filter(Boolean) as string[]
  let taskSessionsRaw = nonEmptyTaskSessions(raw.task_sessions)
  const activeWorkId = raw.active_work_id ?? null

  if (activeWorkId && raw.works?.[activeWorkId]) {
    const w = raw.works[activeWorkId]
    activePlan = activePlan || w.active_plan || null
    planName = planName || w.plan_name || null
    agent = agent || w.agent || null
    status = status || w.status || null
    startedAt = startedAt || w.started_at || null
    updatedAt = updatedAt || w.updated_at || null
    if (!sessionIds.length && w.session_ids?.length) {
      sessionIds = w.session_ids.map((s) => stripOpenCodePrefix(s)).filter(Boolean) as string[]
    }
    if (!taskSessionsRaw) {
      taskSessionsRaw = nonEmptyTaskSessions(w.task_sessions)
    }
  }

  let plan = {
    missing: true as boolean,
    total: 0,
    completed: 0,
    isComplete: false,
    percent: 0,
    steps: [] as OmoPlanStep[],
    stepsTruncated: false,
  }

  if (activePlan) {
    const planPath = path.isAbsolute(activePlan) ? activePlan : path.join(root, activePlan)
    // only read if inside project or under .omo/.sisyphus of project
    const real = (() => {
      try {
        return fs.realpathSync(planPath)
      } catch {
        return planPath
      }
    })()
    const rootReal = canonicalizePath(root)
    if (real.startsWith(rootReal) && fs.existsSync(real)) {
      try {
        const content = fs.readFileSync(real, "utf8")
        const parsed = parsePlanProgress(content)
        const stepsTruncated = parsed.steps.length > MAX_PLAN_STEPS
        plan = {
          missing: false,
          total: parsed.total,
          completed: parsed.completed,
          isComplete: parsed.isComplete,
          percent: parsed.total ? Math.round((parsed.completed / parsed.total) * 100) : 0,
          steps: parsed.steps.slice(0, MAX_PLAN_STEPS),
          stepsTruncated,
        }
      } catch {
        plan.missing = true
      }
    }
  }

  const taskSessions = normalizeTaskSessions(taskSessionsRaw)
  const taskStatusCounts: Record<string, number> = {}
  for (const t of taskSessions) {
    const k = t.status || "unknown"
    taskStatusCounts[k] = (taskStatusCounts[k] || 0) + 1
  }

  return {
    present: true,
    schemaVersion: raw.schema_version ?? null,
    status,
    agent,
    planName,
    activePlan,
    activeWorkId,
    startedAt,
    updatedAt,
    sessionIds,
    plan,
    taskSessions,
    taskStatusCounts,
  }
}

export function readOmoConfig(): OmoConfigView {
  const candidates = [
    path.join(process.env.XDG_CONFIG_HOME || path.join(process.env.HOME || "", ".config"), "opencode", "oh-my-openagent.json"),
    path.join(process.env.HOME || "", ".config", "opencode", "oh-my-openagent.json"),
  ]
  for (const p of candidates) {
    const raw = readJsonFile<{
      team_mode?: { enabled?: boolean }
      agents?: Record<string, unknown>
      categories?: Record<string, unknown>
    }>(p)
    if (!raw) continue
    return {
      present: true,
      path: p,
      teamMode: raw.team_mode?.enabled ?? null,
      agents: Object.keys(raw.agents || {}),
      categories: Object.keys(raw.categories || {}),
    }
  }
  return { present: false, path: null, teamMode: null, agents: [], categories: [] }
}

export function boulderMainSessionIds(boulder: OmoBoulderView): string[] {
  if (!boulder.present || !boulder.sessionIds.length) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const id of boulder.sessionIds) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

export function preferBoulderMainSessionId(boulder: OmoBoulderView): string | null {
  const ids = boulderMainSessionIds(boulder)
  return ids.length ? ids[ids.length - 1]! : null
}
