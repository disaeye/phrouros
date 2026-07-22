import { icon, iconLabel, modelChip, agentChip, agentMeta, categoryChip } from "./icons.js"
import { createDetailDrawer } from "./detail.js"

const $ = (id) => document.getElementById(id)

function setText(el, value, empty = "—") {
  if (!el) return
  const raw = value == null ? "" : String(value).trim()
  const isEmpty = raw === "" || raw === "—" || raw === "-"
  el.textContent = isEmpty ? empty : raw
  el.classList.toggle("is-empty", isEmpty)
}

function setHtml(el, html) {
  if (!el) return
  el.innerHTML = html
}

function mountIcons(root = document) {
  root.querySelectorAll("[data-ico]").forEach((el) => {
    const name = el.getAttribute("data-ico")
    if (!name || el.dataset.iconMounted === "1") return
    el.innerHTML = icon(name)
    el.dataset.iconMounted = "1"
  })
}


const I18N = {
  zh: {
    "app.title": "Phrouros",
    "app.tagline": "本地 agent 监控",
    "rail.project": "项目",
    "rail.prefs": "偏好",
    "theme.light": "日间",
    "theme.dark": "夜间",
    "action.refresh": "刷新",
    "action.auto": "自动刷新",
    "action.import": "导入",
    "action.remove": "移除当前",
    "status.live": "实时",
    "kpi.main": "主会话",
    "kpi.plan": "计划",
    "kpi.background": "后台",
    "kpi.cost": "费用",
    "section.metrics": "项目总览",
    "section.main": "主 Agent",
    "section.omo": "计划进度",
    "section.background": "后台 Agent",
    "section.models": "模型消耗",
    "section.details": "工作明细",
    "section.activeTasks": "进行中委派",
    "section.waterfall": "执行瀑布",
    "waterfall.desc": "横轴时间 · 纵轴 Agent · 点击色块查看详情",
    "waterfall.follow": "跟随现在",
    "waterfall.empty": "暂无 agent 时间线",
    "waterfall.main": "主",

    "omo.desc": "boulder 计划总览：清单完成度 + 委派任务统计",
    "details.desc": "三类清单含义不同，请按标签切换",
    "omo.stat.done": "已完成",
    "omo.stat.run": "进行中",
    "omo.stat.pend": "待处理",
    "omo.stat.total": "总委派",

    "section.import": "导入 / 管理项目",
    "metric.planProgress": "计划进度",
    "metric.active": "正在干活",
    "metric.remaining": "剩余步骤",
    "metric.backlog": "待办未清",
    "metric.cost": "本轮费用",
    "metric.token": "本轮 Token",
    "metric.hit": "缓存命中",
    "metric.runtime": "本轮时长",
    "metric.none": "—",
    "metric.noPlan": "未挂计划",
    "metric.noMain": "无主会话",
    "metric.stepsOf": "{c}/{t} 已完成",
    "metric.remainOf": "还剩 {n} 步",
    "metric.activeOf": "委派 {d} · 后台 {b}",
    "metric.todoOpen": "{n} 条未完成",
    "metric.scopeRun": "统计范围：当前主会话及其子会话",
    "metric.scopeHint": "主会话树 · 非全项目历史",
    "field.agent": "Agent",
    "field.model": "模型",
    "field.updated": "更新",
    "field.started": "开始",
    "field.duration": "时长",
    "field.tokens": "Token",
    "field.cost": "费用",
    "token.in": "输入",
    "token.out": "输出",
    "token.reason": "推理",
    "token.cache": "缓存",
    "col.model": "模型",
    "col.sessions": "会话",
    "col.usd": "$",
    "col.in": "入",
    "col.out": "出",
    "col.reason": "推",
    "col.cacheR": "缓存读",
    "col.cacheW": "缓存写",
    "col.hit": "命中",
    "col.token": "合计",
    "col.rate": "单价源",
    "col.total": "合计",
    "tab.tasks": "委派任务",
    "tab.todos": "主会话待办",
    "tab.steps": "计划清单",
    "tab.hint.tasks": "来源：boulder.task_sessions · 编排器派给子 agent 的执行单元（可点开详情）",
    "tab.hint.todos": "来源：主 session 的 todowrite · 主 agent 自己的 checklist（≠ 计划文档 / 委派）",
    "tab.hint.steps": "来源：计划 markdown checkbox · 文档级里程碑，不绑具体 agent",
    "ph.path": "项目绝对路径",
    "ph.label": "显示名称（可选）",
    "empty.noProject": "请先导入一个项目目录",
    "empty.noActive": "当前没有进行中的委派",
    "empty.noBg": "没有后台 Agent",
    "empty.noOmo": "未检测到 .omo/boulder.json",
    "empty.noTodos": "主会话暂无 todowrite 待办",
    "empty.noSteps": "计划文档暂无 checkbox 步骤",
    "todo.src": "todowrite",
    "todo.priority": "优先级",
    "legend.tasks": "委派",
    "legend.todos": "会话待办",
    "legend.steps": "计划步骤",
    "label.runningOf": "运行中 {r} / 共 {t}",
    "label.planPct": "{c}/{t} 步骤",
    "label.noPlan": "无计划文件",
    "label.updated": "更新 {t}",
    "label.orchestrator": "编排 {a}",
    "label.startedAt": "开始 {t}",
    "label.ranFor": "已跑 {t}",
    "label.cacheRW": "读 {r} / 写 {w}",
    "label.io": "入 {i} · 出 {o} · 推 {r}",
    "label.hitOf": "读 {r} / 写 {w}",
    "label.agentsOf": "主 {m} · 后台运行 {r}/{t}",
    "label.noTokens": "暂无 token",
    "status.running": "运行中",
    "status.idle": "空闲",
    "status.archived": "已归档",
    "status.unknown": "未知",
    "status.completed": "完成",
    "status.complete": "完成",
    "status.done": "完成",
    "status.pending": "待处理",
    "status.queued": "排队",
    "status.in_progress": "进行中",
    "status.active": "进行中",
    "status.error": "错误",
    "status.failed": "失败",
    "status.cancelled": "取消",
    "msg.imported": "已导入 {n}",
    "msg.removed": "已移除",
    "msg.needPath": "请填写项目路径",
    "msg.confirmRemove": "确定移除当前项目？（不删除本地数据）",
  },
  en: {
    "app.title": "Phrouros",
    "app.tagline": "Local agent monitoring",
    "rail.project": "Project",
    "rail.prefs": "Prefs",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "action.refresh": "Refresh",
    "action.auto": "Auto refresh",
    "action.import": "Import",
    "action.remove": "Remove",
    "status.live": "Live",
    "kpi.main": "Main",
    "kpi.plan": "Plan",
    "kpi.background": "Background",
    "kpi.cost": "Cost",
    "section.metrics": "Project overview",
    "section.main": "Main agent",
    "section.omo": "Plan progress",
    "section.background": "Background agents",
    "section.models": "Model usage",
    "section.details": "Work breakdown",
    "section.activeTasks": "Active delegates",
    "section.waterfall": "Execution waterfall",
    "waterfall.desc": "Time on X · Agent on Y · click a bar for detail",
    "waterfall.follow": "Follow now",
    "waterfall.empty": "No agent timeline yet",
    "waterfall.main": "Main",

    "omo.desc": "Boulder plan overview: checklist progress + delegated task stats",
    "details.desc": "Three different lists — switch tabs for the right source",
    "omo.stat.done": "Done",
    "omo.stat.run": "Running",
    "omo.stat.pend": "Pending",
    "omo.stat.total": "Delegates",

    "section.import": "Import / manage project",
    "metric.planProgress": "Plan progress",
    "metric.active": "Working now",
    "metric.remaining": "Steps left",
    "metric.backlog": "Open todos",
    "metric.cost": "Run cost",
    "metric.token": "Run tokens",
    "metric.hit": "Cache hit",
    "metric.runtime": "Run duration",
    "metric.none": "—",
    "metric.noPlan": "No plan",
    "metric.noMain": "No main session",
    "metric.stepsOf": "{c}/{t} done",
    "metric.remainOf": "{n} left",
    "metric.activeOf": "Delegates {d} · BG {b}",
    "metric.todoOpen": "{n} open",
    "metric.scopeRun": "Scope: current main session + its children",
    "metric.scopeHint": "Main-session tree · not project history",
    "field.agent": "Agent",
    "field.model": "Model",
    "field.updated": "Updated",
    "field.started": "Started",
    "field.duration": "Duration",
    "field.tokens": "Tokens",
    "field.cost": "Cost",
    "token.in": "In",
    "token.out": "Out",
    "token.reason": "Reason",
    "token.cache": "Cache",
    "col.model": "Model",
    "col.sessions": "Sessions",
    "col.usd": "$",
    "col.in": "In",
    "col.out": "Out",
    "col.reason": "Rsn",
    "col.cacheR": "Cache R",
    "col.cacheW": "Cache W",
    "col.hit": "Hit",
    "col.token": "Total",
    "col.rate": "Rate source",
    "col.total": "Total",
    "tab.tasks": "Delegates",
    "tab.todos": "Main session todos",
    "tab.steps": "Plan checklist",
    "tab.hint.tasks": "Source: boulder.task_sessions · units delegated to subagents (click for detail)",
    "tab.hint.todos": "Source: main session todowrite · main agent checklist (≠ plan doc / delegates)",
    "tab.hint.steps": "Source: plan markdown checkboxes · document milestones, not tied to an agent",
    "ph.path": "Absolute project path",
    "ph.label": "Display name (optional)",
    "empty.noProject": "Import a project directory first",
    "empty.noActive": "No active delegates",
    "empty.noBg": "No background agents",
    "empty.noOmo": "No .omo/boulder.json detected",
    "empty.noTodos": "No todowrite items on the main session",
    "empty.noSteps": "No checkbox steps in the plan doc",
    "todo.src": "todowrite",
    "todo.priority": "Priority",
    "legend.tasks": "Delegates",
    "legend.todos": "Session todos",
    "legend.steps": "Plan steps",
    "label.runningOf": "{r} running / {t} total",
    "label.planPct": "{c}/{t} steps",
    "label.noPlan": "Plan file missing",
    "label.updated": "Updated {t}",
    "label.orchestrator": "Orchestrator {a}",
    "label.startedAt": "Started {t}",
    "label.ranFor": "Ran {t}",
    "label.cacheRW": "R {r} / W {w}",
    "label.io": "In {i} · Out {o} · R {r}",
    "label.hitOf": "R {r} / W {w}",
    "label.agentsOf": "Main {m} · BG run {r}/{t}",
    "label.noTokens": "No tokens yet",
    "status.running": "Running",
    "status.idle": "Idle",
    "status.archived": "Archived",
    "status.unknown": "Unknown",
    "status.completed": "Done",
    "status.complete": "Done",
    "status.done": "Done",
    "status.pending": "Pending",
    "status.queued": "Queued",
    "status.in_progress": "In progress",
    "status.active": "Active",
    "status.error": "Error",
    "status.failed": "Failed",
    "status.cancelled": "Cancelled",
    "msg.imported": "Imported {n}",
    "msg.removed": "Removed",
    "msg.needPath": "Path required",
    "msg.confirmRemove": "Remove current project? (local data kept)",
  },
}

let detailDrawer = null

const LS_PREFIX = "phrouros:"

function storageGet(key) {
  return localStorage.getItem(LS_PREFIX + key)
}

function storageSet(key, value) {
  localStorage.setItem(LS_PREFIX + key, value)
}

function storageRemove(key) {
  localStorage.removeItem(LS_PREFIX + key)
}

const state = {
  wfFollow: true,
  wfWindowMs: 45 * 60 * 1000,
  lastDrawerRefresh: 0,
  drawerFinger: "",
  sourceId: storageGet("sourceId"),
  lang: storageGet("lang") || "zh",
  theme: storageGet("theme") || "light",
  timer: null,
  tab: "steps",
  last: null,
  now: Date.now(),
}

function t(key, vars) {
  const dict = I18N[state.lang] || I18N.zh
  let s = dict[key] || I18N.zh[key] || key
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}

function applyI18n() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en"
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n")
    const label = t(key)
    // keep sibling icons: if parent has .ico-slot or el is inside button with data-ico, only update text node / span
    if (el.children.length === 0) {
      el.textContent = label
      return
    }
    // prefer a text span without data-ico
    const textSpan = el.querySelector(":scope > span:not([data-ico]):not(.ico-slot)")
    if (textSpan) textSpan.textContent = label
    else el.childNodes.forEach((n) => { if (n.nodeType === 3) n.textContent = label })
  })
  document.querySelectorAll("button.tab").forEach((btn) => {
    const textEl = btn.querySelector(".tab-text[data-i18n]") || btn.querySelector(".tab-text")
    const key = textEl?.getAttribute("data-i18n") || btn.getAttribute("data-i18n")
    if (!key) return
    if (textEl) textEl.textContent = t(key)
    ;[...btn.childNodes].forEach((n) => {
      if (n.nodeType === 3) n.textContent = ""
    })
  })
  // refresh button
  const refresh = $("btn-refresh")
  if (refresh) {
    const span = refresh.querySelector("[data-i18n], .btn-text") || refresh.querySelector("span:not(.ico-slot)")
    if (span && span.hasAttribute("data-i18n")) span.textContent = t(span.getAttribute("data-i18n"))
  }
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"))
  })
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const label = t(el.getAttribute("data-i18n-title"))
    el.title = label
    if (el.hasAttribute("aria-label") || el.classList.contains("btn-icon-only") || el.classList.contains("icon-seg-btn") || el.classList.contains("check-icon") || el.id === "live-badge") {
      el.setAttribute("aria-label", label)
    }
  })
  document.querySelectorAll("[data-lang-set]").forEach((el) => {
    const on = el.getAttribute("data-lang-set") === state.lang
    el.classList.toggle("active", on)
    el.setAttribute("aria-pressed", on ? "true" : "false")
  })
  document.querySelectorAll("[data-theme-set]").forEach((el) => {
    const on = el.getAttribute("data-theme-set") === state.theme
    el.classList.toggle("active", on)
    el.setAttribute("aria-pressed", on ? "true" : "false")
  })
  document.querySelectorAll("[data-i18n=\"omo.desc\"], [data-i18n=\"details.desc\"]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"))
  })
  document.title = `${t("app.title")} · ${t("app.tagline")}`
  mountIcons()
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme)
  document.documentElement.setAttribute("data-lang", state.lang)
}

function formatTokens(n) {
  const v = Number(n) || 0
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B"
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M"
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K"
  return String(Math.round(v))
}

function formatUsd(c) {
  const v = Number(c) || 0
  if (v <= 0) return "$0.00"
  if (v < 0.01) return `$${v.toFixed(4)}`
  return `$${v.toFixed(2)}`
}

function formatDuration(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—"
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h ${m % 60}m`
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h`
}

function formatTime(v) {
  if (v == null || v === "") return "—"
  try {
    const d = typeof v === "number" ? new Date(v) : new Date(v)
    if (Number.isNaN(d.getTime())) return String(v)
    return d.toLocaleString(state.lang === "zh" ? "zh-CN" : "en-US", {
      hour12: false,
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  } catch {
    return String(v)
  }
}

function toMs(v) {
  if (v == null) return null
  if (typeof v === "number" && Number.isFinite(v)) return v
  const n = Date.parse(String(v))
  return Number.isFinite(n) ? n : null
}

function shortModel(label) {
  if (!label) return "—"
  const parts = String(label).split("/").map((s) => s.trim()).filter(Boolean)
  return parts.length >= 2 ? parts.slice(1).join(" / ") : parts[0]
}

function statusKey(status) {
  return String(status || "unknown").toLowerCase().replaceAll(" ", "_")
}

function statusText(status) {
  const k = statusKey(status)
  const key = `status.${k}`
  return t(key) !== key ? t(key) : status || t("status.unknown")
}

function enumClass(status) {
  const s = statusKey(status)
  if (["running", "in_progress", "active"].includes(s)) return "enum-running"
  if (["idle", "pending", "queued"].includes(s)) return "enum-idle"
  if (["completed", "complete", "done"].includes(s)) return "enum-completed"
  if (["error", "failed"].includes(s)) return "enum-error"
  return "enum-unknown"
}

function catClass(cat) {
  const c = String(cat || "default").toLowerCase()
  if (c.includes("ultra")) return "cat-ultrabrain"
  if (c.includes("deep")) return "cat-deep"
  if (c.includes("quick")) return "cat-quick"
  if (c.includes("visual")) return "cat-visual-engineering"
  if (c.includes("art")) return "cat-artistry"
  if (c.includes("writ")) return "cat-writing"
  if (c.includes("high")) return "cat-unspecified-high"
  if (c.includes("low")) return "cat-unspecified-low"
  return "cat-default"
}

function barClass(status) {
  const s = statusKey(status)
  if (["running", "in_progress", "active"].includes(s)) return "running"
  if (["idle", "pending", "queued"].includes(s)) return "idle"
  if (["completed", "complete", "done"].includes(s)) return "completed"
  if (["error", "failed"].includes(s)) return "error"
  return ""
}

function isActive(status) {
  return ["running", "in_progress", "active", "pending", "queued"].includes(statusKey(status))
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function setMsg(text, isErr = false) {
  const el = $("import-msg")
  if (!text) {
    el.hidden = true
    el.textContent = ""
    return
  }
  el.hidden = false
  el.textContent = text
  el.classList.toggle("err", isErr)
}

function setError(text) {
  const el = $("error")
  el.hidden = !text
  el.textContent = text || ""
}

function setNote(text) {
  const el = $("note")
  el.hidden = !text
  el.textContent = text || ""
}

async function api(path, opts) {
  const res = await fetch(path, {
    headers: {
      accept: "application/json",
      ...(opts?.body ? { "content-type": "application/json" } : {}),
    },
    ...opts,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ok === false) throw new Error(data.error || data.note || `HTTP ${res.status}`)
  return data
}

async function loadSources() {
  const data = await api("/api/sources")
  const select = $("source-select")
  const prev = state.sourceId
  select.innerHTML = ""
  if (!data.sources?.length) {
    const opt = document.createElement("option")
    opt.value = ""
    opt.textContent = "—"
    select.appendChild(opt)
    state.sourceId = null
    storageRemove("sourceId")
    return
  }
  for (const s of data.sources) {
    const opt = document.createElement("option")
    opt.value = s.id
    opt.textContent = s.label
    opt.title = s.projectRoot
    select.appendChild(opt)
  }
  const exists = data.sources.some((s) => s.id === prev)
  state.sourceId = exists ? prev : data.defaultSourceId || data.sources[0].id
  select.value = state.sourceId
  storageSet("sourceId", state.sourceId)
}

function agentDuration(a) {
  const start = a.timeCreated
  const end = isActive(a.status) ? state.now : a.timeUpdated || state.now
  if (!start) return null
  return Math.max(0, end - start)
}

function taskDuration(task) {
  if (typeof task.elapsedMs === "number" && Number.isFinite(task.elapsedMs)) return task.elapsedMs
  const start = toMs(task.startedAt)
  if (!start) return null
  const end = toMs(task.endedAt) || (isActive(task.status) ? state.now : toMs(task.updatedAt) || state.now)
  return Math.max(0, end - start)
}

function rowTask(title, subParts, status, category, timeBits, sessionId, agentName) {
  const cats = category ? categoryChip(category, { compact: true }) : ""
  const times = (timeBits || []).filter(Boolean).map((p) => `<span>${escapeHtml(p)}</span>`).join("")
  const sidAttr = sessionId ? ` data-session-id="${escapeHtml(sessionId)}" title="${escapeHtml(state.lang === "zh" ? "点击查看执行详情" : "Click for detail")}"` : ""
  const agentBit = agentName ? agentChip(agentName, { compact: true }) : ""
  const rest = (subParts || []).filter((p) => p && p !== agentName && p !== category)
  return `
    <div class="row row-task"${sidAttr}>
      <div class="row-main">
        <div class="row-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
        <div class="row-sub">${agentBit}${cats}${rest.map((p) => `<span>${escapeHtml(p)}</span>`).join("")}${times}</div>
      </div>
      <div class="row-side"><span class="enum ${enumClass(status)}">${escapeHtml(statusText(status))}</span></div>
    </div>
  `
}

function rowSessionTodo(item) {
  const pri = item.priority ? String(item.priority) : ""
  const priCls = pri ? `pri-${pri.toLowerCase()}` : ""
  return `
    <div class="row row-todo">
      <span class="enum ${enumClass(item.status)}">${escapeHtml(statusText(item.status))}</span>
      <div class="row-main">
        <div class="todo-content" title="${escapeHtml(item.content || "")}">${escapeHtml(item.content || "—")}</div>
        <div class="row-sub">
          <span class="src-chip">${escapeHtml(t("todo.src"))}</span>
          ${pri ? `<span class="pri-chip ${priCls}">${escapeHtml(t("todo.priority"))} ${escapeHtml(pri)}</span>` : ""}
        </div>
      </div>
    </div>
  `
}

function rowPlanStep(step) {
  const done = Boolean(step.checked)
  return `
    <div class="row row-step ${done ? "is-done" : ""}">
      <span class="step-mark" aria-hidden="true">${done ? "✓" : "○"}</span>
      <div class="row-main">
        <div class="row-title step-text" title="${escapeHtml(step.text || "")}">${escapeHtml(step.text || "—")}</div>
        <div class="row-sub"><span class="src-chip">${escapeHtml(t("legend.steps"))}</span></div>
      </div>
      <div class="row-side">
        <span class="enum ${done ? "enum-completed" : "enum-pending"}">${escapeHtml(done ? statusText("completed") : statusText("pending"))}</span>
      </div>
    </div>
  `
}

function renderStatusStrip(data) {
  $("status-strip").hidden = false
  const main = data.main
  const boulder = data.omo?.boulder
  const totals = data.totals

  if (main) {
    $("chip-main-status").className = `enum ${enumClass(main.status)}`
    setText($("chip-main-status"), statusText(main.status))
    const chipMain = $("chip-main-text")
    if (chipMain) {
      chipMain.classList.remove("is-empty")
      chipMain.innerHTML = agentChip(main.agent, { compact: true, short: true })
      chipMain.title = main.title || main.agent || ""
    }
  } else {
    $("chip-main-status").className = "enum enum-unknown"
    setText($("chip-main-status"), t("status.unknown"))
    setText($("chip-main-text"), "—")
  }

  if (boulder?.present) {
    $("chip-plan-status").className = `enum ${enumClass(boulder.status)}`
    setText($("chip-plan-status"), statusText(boulder.status))
    setText($("chip-plan-text"), boulder.planName || "—")
  } else {
    $("chip-plan-status").className = "enum enum-unknown"
    setText($("chip-plan-status"), state.lang === "zh" ? "无" : "N/A")
    setText($("chip-plan-text"), state.lang === "zh" ? "无计划" : "No plan")
  }

  const running = totals?.runningBackgroundCount ?? 0
  const total = totals?.backgroundCount ?? 0
  $("chip-bg-status").className = `enum ${running ? "enum-running" : "enum-completed"}`
  setText($("chip-bg-status"), running ? statusText("running") : statusText("completed"))
  setText($("chip-bg-text"), t("label.runningOf", { r: running, t: total }))
  setText($("chip-cost-text"), formatUsd(totals?.estimatedCost ?? 0))
}

function cacheHitRate(tok) {
  const input = Number(tok?.input) || 0
  const cacheRead = Number(tok?.cacheRead) || 0
  const denom = input + cacheRead
  if (denom <= 0) return null
  return Math.round((cacheRead / denom) * 1000) / 10
}

function formatHit(pct) {
  if (pct == null || !Number.isFinite(pct)) return "—"
  return `${pct}%`
}

function countByStatus(list, keys) {
  const set = new Set(keys.map((k) => String(k).toLowerCase()))
  let n = 0
  for (const x of list || []) {
    if (set.has(statusKey(x.status))) n += 1
  }
  return n
}

function buildProjectKpis(data) {
  const totals = data.totals || {}
  const all = totals.all || {}
  const boulder = data.omo?.boulder
  const plan = boulder?.plan
  const tasks = boulder?.taskSessions || []
  const todos = data.omo?.todos || []
  const bg = data.background || []
  const main = data.main

  const taskRun = countByStatus(tasks, ["running", "in_progress", "active"])
  const todoOpen = todos.filter((x) => !["completed", "complete", "done", "cancelled"].includes(statusKey(x.status))).length
  const bgRun = totals.runningBackgroundCount ?? countByStatus(bg, ["running", "in_progress", "active"])
  const activeWorkers = taskRun + bgRun
  const hit = cacheHitRate(all)
  const planPresent = Boolean(boulder?.present && plan && !plan.missing)
  const stepsLeft = planPresent ? Math.max(0, (plan.total || 0) - (plan.completed || 0)) : null
  const scope = t("metric.scopeHint")

  return [
    {
      id: "plan-progress",
      icon: "listChecks",
      tone: planPresent && plan.isComplete ? "ok" : planPresent ? "neutral" : "neutral",
      value: planPresent ? `${plan.percent ?? 0}%` : t("metric.none"),
      label: t("metric.planProgress"),
      sub: planPresent
        ? `${boulder.planName || "plan"} · ${t("metric.stepsOf", { c: plan.completed || 0, t: plan.total || 0 })}`
        : t("metric.noPlan"),
      jump: "tile-omo",
    },
    {
      id: "active",
      icon: "zap",
      tone: activeWorkers > 0 ? "running" : "neutral",
      value: String(activeWorkers),
      label: t("metric.active"),
      sub: t("metric.activeOf", { d: taskRun, b: bgRun }),
      jump: activeWorkers > 0 ? "tile-bg" : "tile-details",
      tab: activeWorkers > 0 ? null : "tasks",
    },
    {
      id: "remaining",
      icon: "target",
      tone: stepsLeft != null && stepsLeft > 0 ? "running" : planPresent ? "ok" : "neutral",
      value: stepsLeft == null ? t("metric.none") : String(stepsLeft),
      label: t("metric.remaining"),
      sub: stepsLeft == null ? t("metric.noPlan") : t("metric.remainOf", { n: stepsLeft }),
      jump: "tile-details",
      tab: "steps",
    },
    {
      id: "backlog",
      icon: "listTodo",
      tone: todoOpen > 0 ? "running" : "neutral",
      value: String(todoOpen),
      label: t("metric.backlog"),
      sub: t("metric.todoOpen", { n: todoOpen }),
      jump: "tile-details",
      tab: "todos",
    },
    {
      id: "cost",
      icon: "circleDollar",
      tone: "cost",
      value: formatUsd(totals.estimatedCost ?? all.estimatedCost ?? 0),
      label: t("metric.cost"),
      sub: scope,
      jump: "tile-models",
    },
    {
      id: "token",
      icon: "layers",
      tone: "neutral",
      value: formatTokens(all.total),
      label: t("metric.token"),
      sub: t("label.io", {
        i: formatTokens(all.input),
        o: formatTokens(all.output),
        r: formatTokens(all.reasoning),
      }),
      jump: "tile-models",
    },
    {
      id: "hit",
      icon: "hardDrive",
      tone: hit != null && hit >= 50 ? "ok" : "neutral",
      value: formatHit(hit),
      label: t("metric.hit"),
      sub: t("label.hitOf", {
        r: formatTokens(all.cacheRead),
        w: formatTokens(all.cacheWrite),
      }),
      jump: "tile-models",
    },
    {
      id: "runtime",
      icon: "clock",
      tone: "neutral",
      value: main ? formatDuration(agentDuration(main)) : "—",
      label: t("metric.runtime"),
      sub: main ? formatTime(main.timeCreated) : t("metric.noMain"),
      jump: "tile-main",
    },
  ]
}

function renderMetrics(data) {
  const grid = $("metric-grid")
  if (!grid) return
  const kpis = buildProjectKpis(data)
  grid.innerHTML = kpis
    .map((k) => {
      const jump = k.jump ? ` data-jump="${escapeHtml(k.jump)}"` : ""
      const tab = k.tab ? ` data-tab-jump="${escapeHtml(k.tab)}"` : ""
      const title = escapeHtml([k.label, k.sub, t("metric.scopeRun")].filter(Boolean).join(" · "))
      return `
        <button type="button" class="metric tone-${escapeHtml(k.tone || "neutral")}"${jump}${tab} title="${title}">
          <span class="metric-ico">${icon(k.icon)}</span>
          <div class="metric-n">${escapeHtml(k.value)}</div>
          <div class="metric-l">${escapeHtml(k.label)}</div>
          <div class="metric-s">${escapeHtml(k.sub || "—")}</div>
        </button>`
    })
    .join("")
}

function renderMain(data) {
  const tile = $("tile-main")
  if (!data.main) {
    tile.hidden = true
    return
  }
  tile.hidden = false
  const m = data.main
  tile.setAttribute("data-session-id", m.id)
  tile.title = (state.lang === "zh" ? "点击查看执行详情" : "Click for execution detail")
  $("main-enum").className = `enum ${enumClass(m.status)}`
  setText($("main-enum"), statusText(m.status))
  setText($("main-title"), m.title)
  {
    const el = $("main-agent")
    if (el) {
      el.classList.remove("is-empty")
      el.innerHTML = agentChip(m.agent)
      el.title = m.agent || ""
    }
  }
  {
    const el = $("main-model")
    if (el) {
      el.classList.remove("is-empty")
      el.innerHTML = modelChip(m.model?.label || shortModel(m.model), { short: true })
      el.title = m.model?.label || ""
    }
  }
  setText($("main-started"), formatTime(m.timeCreated))
  setText($("main-duration"), formatDuration(agentDuration(m)))
  setText($("main-updated"), formatTime(m.timeUpdated))
  setText($("main-tokens"), formatTokens(m.tokens?.total))
  setText($("main-cost"), m.estimate?.matched ? formatUsd(m.estimate.usd) : "—")
  setText($("main-in"), formatTokens(m.tokens?.input))
  setText($("main-out"), formatTokens(m.tokens?.output))
  setText($("main-reason"), formatTokens(m.tokens?.reasoning))
  setText($("main-cache"), `${formatTokens(m.tokens?.cacheRead)} / ${formatTokens(m.tokens?.cacheWrite)}`)
  setText($("main-id"), m.id)
}

function renderOmo(data) {
  const tile = $("tile-omo")
  const details = $("tile-details")
  const boulder = data.omo?.boulder
  const todos = data.omo?.todos || []

  if (!boulder?.present && !todos.length) {
    tile.hidden = true
    details.hidden = true
    return
  }

  tile.hidden = false
  details.hidden = false

  if (boulder?.present) {
    $("omo-enum").className = `enum ${enumClass(boulder.status)}`
    setText($("omo-enum"), statusText(boulder.status))
    setText($("omo-name"), boulder.planName || "—")
    const plan = boulder.plan || {}
    const pct = plan.missing ? 0 : plan.percent || 0
    $("omo-progress")?.classList.remove("is-empty")
    $("omo-meta")?.classList.remove("is-empty")
    $("omo-active-label")?.classList.remove("is-empty")
    $("omo-progress-fill").style.width = `${pct}%`
    setText($("omo-progress-text"), plan.missing
      ? t("label.noPlan")
      : t("label.planPct", { c: plan.completed, t: plan.total }))
    setText($("omo-progress-pct"), plan.missing ? "—" : `${pct}%`)
    // runtime task status counts
    const counts = boulder.taskStatusCounts || {}
    const done = (counts.completed || 0) + (counts.done || 0) + (counts.complete || 0)
    const run = (counts.running || 0) + (counts.in_progress || 0) + (counts.active || 0)
    const pend = (counts.pending || 0) + (counts.queued || 0)
    const totalTasks = Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0)
    const stats = $("omo-stats")
    if (stats) {
      stats.hidden = false
      stats.innerHTML = `
        <div class="os"><b>${done}</b><span>${t("omo.stat.done")}</span></div>
        <div class="os"><b>${run}</b><span>${t("omo.stat.run")}</span></div>
        <div class="os"><b>${pend}</b><span>${t("omo.stat.pend")}</span></div>
        <div class="os"><b>${totalTasks}</b><span>${t("omo.stat.total")}</span></div>`
    }
    const desc = $("omo-desc")
    if (desc) desc.textContent = t("omo.desc")

    {
      const metaEl = $("omo-meta")
      if (metaEl) {
        metaEl.classList.remove("is-empty")
        const bits = [
          boulder.agent
            ? `<span class="omo-orch">${escapeHtml(state.lang === "zh" ? "编排" : "Orchestrator")} ${agentChip(boulder.agent, { compact: true, short: true })}</span>`
            : null,
          boulder.startedAt ? escapeHtml(t("label.startedAt", { t: formatTime(boulder.startedAt) })) : null,
          boulder.updatedAt ? escapeHtml(t("label.updated", { t: formatTime(boulder.updatedAt) })) : null,
          boulder.activeWorkId ? `<span class="mono faint">${escapeHtml(boulder.activeWorkId)}</span>` : null,
        ].filter(Boolean)
        metaEl.innerHTML = bits.length ? bits.join(" · ") : "—"
      }
    }

    const tasks = boulder.taskSessions || []
    const active = tasks.filter((x) => isActive(x.status))
    $("omo-active-count").textContent = String(active.length)
    $("omo-active").innerHTML = active.length
      ? active
          .slice(0, 8)
          .map((x) => {
            const dur = taskDuration(x)
            return rowTask(
              x.taskTitle || x.taskKey,
              [x.sessionId].filter(Boolean),
              x.status,
              x.category,
              [
                x.startedAt ? t("label.startedAt", { t: formatTime(x.startedAt) }) : null,
                dur != null ? t("label.ranFor", { t: formatDuration(dur) }) : null,
              ],
              x.sessionId,
              x.agent,
            )
          })
          .join("")
      : `<div class="empty">${icon("zap")}<div>${escapeHtml(t("empty.noActive"))}</div></div>`

    $("tab-tasks").innerHTML = tasks.length
      ? tasks
          .slice(0, 50)
          .map((x) => {
            const dur = taskDuration(x)
            return rowTask(
              x.taskTitle || x.taskKey,
              [x.sessionId].filter(Boolean),
              x.status,
              x.category,
              [
                x.startedAt ? t("label.startedAt", { t: formatTime(x.startedAt) }) : null,
                dur != null ? t("label.ranFor", { t: formatDuration(dur) }) : null,
              ],
              x.sessionId,
              x.agent,
            )
          })
          .join("")
      : `<div class="empty">${icon("zap")}<div>${escapeHtml(t("empty.noActive"))}</div></div>`

    $("tab-steps").innerHTML = (plan.steps || []).length
      ? plan.steps.map((s) => rowPlanStep(s)).join("")
      : `<div class="empty">${icon("listChecks")}<div>${escapeHtml(t("empty.noSteps"))}</div></div>`
  } else {
    $("omo-enum").className = "enum enum-unknown"
    setText($("omo-enum"), t("status.unknown"))
    setText($("omo-name"), t("empty.noOmo"))
    $("omo-progress")?.classList.add("is-empty")
    const stats = $("omo-stats")
    if (stats) { stats.hidden = true; stats.innerHTML = "" }
    const meta = $("omo-meta")
    if (meta) {
      meta.classList.add("is-empty")
      meta.textContent = ""
    }
    $("omo-active-label")?.classList.add("is-empty")
    const desc = $("omo-desc")
    if (desc) desc.textContent = t("omo.desc")
    $("omo-active-count").textContent = "0"
    $("omo-active").innerHTML = `<div class="empty">${icon("workflow")}<div>${escapeHtml(t("empty.noOmo"))}</div></div>`
    $("tab-tasks").innerHTML = `<div class="empty">${icon("workflow")}<div>${escapeHtml(t("empty.noOmo"))}</div></div>`
    $("tab-steps").innerHTML = `<div class="empty">${icon("listChecks")}<div>${escapeHtml(t("empty.noSteps"))}</div></div>`
  }

  $("tab-todos").innerHTML = todos.length
    ? `<div class="list-legend"><span class="src-chip">${escapeHtml(t("todo.src"))}</span><span class="faint">${todos.length}</span></div>` +
      todos.slice(0, 50).map((x) => rowSessionTodo(x)).join("")
    : `<div class="empty">${icon("listTodo")}<div>${escapeHtml(t("empty.noTodos"))}</div></div>`

  const taskCount = boulder?.present ? (boulder.taskSessions || []).length : 0
  const stepCount = boulder?.present ? ((boulder.plan && boulder.plan.steps) || []).length : 0
  setTabCounts({ tasks: taskCount, todos: todos.length, steps: stepCount })
}

function setTabCounts(counts) {
  document.querySelectorAll("#detail-tabs .tab, #tile-details .tab").forEach((el) => {
    const key = el.getAttribute("data-tab")
    if (!key) return
    let badge = el.querySelector(".tab-count")
    if (!badge) {
      badge = document.createElement("span")
      badge.className = "tab-count"
      el.appendChild(badge)
    }
    const n = Number(counts[key]) || 0
    badge.textContent = String(n)
    badge.hidden = false
  })
}

function renderBg(bg) {
  const tile = $("tile-bg")
  tile.hidden = false
  const list = bg || []
  $("bg-count").textContent = String(list.length)
  if (!list.length) {
    $("bg-legend").innerHTML = ""
    $("bg-body").innerHTML = `<div class="empty">${icon("users")}<div>${escapeHtml(t("empty.noBg"))}</div></div>`
    return
  }

  const counts = {}
  for (const a of list) {
    const k = statusKey(a.status)
    counts[k] = (counts[k] || 0) + 1
  }
  $("bg-legend").innerHTML = Object.entries(counts)
    .map(([k, n]) => {
      const color =
        k.includes("run") || k.includes("active") || k.includes("progress")
          ? "green"
          : k.includes("idle") || k.includes("pend") || k.includes("queue")
            ? "orange"
            : k.includes("error") || k.includes("fail")
              ? "red"
              : "blue"
      return `<span class="legend-item"><span class="legend-dot" style="background:var(--${color})"></span>${escapeHtml(statusText(k))} ${n}</span>`
    })
    .join("")

  const ordered = [...list].sort((a, b) => {
    const ar = isActive(a.status) ? 0 : 1
    const br = isActive(b.status) ? 0 : 1
    return ar - br || (a.ageMs ?? 0) - (b.ageMs ?? 0)
  })

  $("bg-body").innerHTML = ordered
    .slice(0, 24)
    .map((a) => {
      const cost = a.estimate?.matched ? formatUsd(a.estimate.usd) : "—"
      const dur = agentDuration(a)
      const tok = a.tokens || {}
      const model = shortModel(a.model?.label)
      return `
        <article class="bg-item status-${barClass(a.status) || "unknown"}" data-session-id="${escapeHtml(a.id)}" title="${escapeHtml(state.lang === "zh" ? "点击查看执行详情" : "Click for detail")}">
          <header class="bg-item-h">
            <div class="bg-item-title">
              <span class="bg-agent">${agentChip(a.agent)}</span>
              <span class="enum ${enumClass(a.status)}">${escapeHtml(statusText(a.status))}</span>
            </div>
            <p class="bg-task" title="${escapeHtml(a.title)}">${escapeHtml(a.title)}</p>
          </header>
          <div class="bg-time">
            <span>${icon("play")}<span class="lbl" data-keep>${escapeHtml(t("field.started"))}</span><b>${escapeHtml(formatTime(a.timeCreated))}</b></span>
            <span>${icon("clock")}<span class="lbl" data-keep>${escapeHtml(t("field.duration"))}</span><b>${escapeHtml(formatDuration(dur))}</b></span>
            <span>${icon("refresh")}<span class="lbl" data-keep>${escapeHtml(t("field.updated"))}</span><b>${escapeHtml(formatTime(a.timeUpdated))}</b></span>
          </div>
          <div class="bg-model-row">${modelChip(a.model?.label || model, { short: true })}</div>
          <div class="bg-grid two">
            <div class="bg-cell">${icon("circleDollar")}<div><span class="k">${escapeHtml(t("field.cost"))}</span><b>${escapeHtml(cost)}</b></div></div>
            <div class="bg-cell">${icon("layers")}<div><span class="k">Token</span><b>${escapeHtml(formatTokens(tok.total))}</b></div></div>
          </div>
          <div class="bg-tokens">
            <span><i>in</i><b>${escapeHtml(formatTokens(tok.input))}</b></span>
            <span><i>out</i><b>${escapeHtml(formatTokens(tok.output))}</b></span>
            <span><i>r</i><b>${escapeHtml(formatTokens(tok.reasoning))}</b></span>
            <span><i>cache</i><b>${escapeHtml(formatTokens(tok.cacheRead))}/${escapeHtml(formatTokens(tok.cacheWrite))}</b></span>
          </div>
        </article>`
    })
    .join("")
}

function modelRowHtml(m, { total = false } = {}) {
  const tok = m.tokens || {}
  const hit = cacheHitRate(tok)
  const label = m.modelId || m.model || "—"
  const nameCell = total
    ? `<td><b>${escapeHtml(t("col.total"))}</b></td>`
    : `<td title="${escapeHtml(m.model || label)}">${modelChip(label, { short: true })}</td>`
  const cls = total ? ' class="is-total"' : ""
  return `
      <tr${cls}>
        ${nameCell}
        <td>${m.sessions ?? "—"}</td>
        <td>${m.estimate?.matched || total ? formatUsd(m.estimate?.usd ?? tok.estimatedCost ?? 0) : "—"}</td>
        <td class="mono">${formatTokens(tok.input)}</td>
        <td class="mono">${formatTokens(tok.output)}</td>
        <td class="mono">${formatTokens(tok.reasoning)}</td>
        <td class="mono">${formatTokens(tok.cacheRead)}</td>
        <td class="mono">${formatTokens(tok.cacheWrite)}</td>
        <td class="mono">${formatHit(hit)}</td>
        <td class="mono"><b>${formatTokens(tok.total)}</b></td>
        <td>${total ? "—" : escapeHtml((m.rateLabel || "—").split(" · ")[0])}</td>
      </tr>`
}

function renderModels(models) {
  const tile = $("tile-models")
  const body = $("model-body")
  const foot = $("model-foot")
  if (!models?.length) {
    tile.hidden = true
    if (body) body.innerHTML = ""
    if (foot) foot.innerHTML = ""
    return
  }
  tile.hidden = false
  const byId = new Map()
  for (const m of models) {
    const id = String(m.modelId || m.model || "").toLowerCase() || "(unknown)"
    const prev = byId.get(id)
    if (!prev) {
      byId.set(id, {
        ...m,
        tokens: { ...m.tokens },
      })
      continue
    }
    const t0 = prev.tokens || {}
    const n = m.tokens || {}
    prev.sessions = (prev.sessions || 0) + (m.sessions || 0)
    prev.tokens = {
      input: (t0.input || 0) + (n.input || 0),
      output: (t0.output || 0) + (n.output || 0),
      reasoning: (t0.reasoning || 0) + (n.reasoning || 0),
      cacheRead: (t0.cacheRead || 0) + (n.cacheRead || 0),
      cacheWrite: (t0.cacheWrite || 0) + (n.cacheWrite || 0),
      total: (t0.total || 0) + (n.total || 0),
      cost: (t0.cost || 0) + (n.cost || 0),
      estimatedCost: (t0.estimatedCost || 0) + (n.estimatedCost || 0),
    }
    if (m.estimate?.matched) {
      prev.estimate = {
        ...(prev.estimate || {}),
        matched: true,
        usd: (prev.estimate?.usd || 0) + (m.estimate.usd || 0),
        match: prev.estimate?.match || m.estimate.match,
        note: prev.estimate?.note || m.estimate.note,
      }
    }
    if (!prev.rateLabel && m.rateLabel) prev.rateLabel = m.rateLabel
    if (!prev.modelId && m.modelId) prev.modelId = m.modelId
  }
  const merged = [...byId.values()].sort(
    (a, b) => (b.estimate?.usd || 0) - (a.estimate?.usd || 0) || (b.tokens?.total || 0) - (a.tokens?.total || 0),
  )

  const sum = {
    sessions: 0,
    tokens: {
      input: 0,
      output: 0,
      reasoning: 0,
      cacheRead: 0,
      cacheWrite: 0,
      total: 0,
      cost: 0,
      estimatedCost: 0,
    },
    estimate: { matched: true, usd: 0, match: null, note: null },
  }
  for (const m of merged) {
    sum.sessions += m.sessions || 0
    const tok = m.tokens || {}
    sum.tokens.input += tok.input || 0
    sum.tokens.output += tok.output || 0
    sum.tokens.reasoning += tok.reasoning || 0
    sum.tokens.cacheRead += tok.cacheRead || 0
    sum.tokens.cacheWrite += tok.cacheWrite || 0
    sum.tokens.total += tok.total || 0
    sum.tokens.cost += tok.cost || 0
    sum.tokens.estimatedCost += tok.estimatedCost || 0
    sum.estimate.usd += m.estimate?.usd || tok.estimatedCost || 0
  }

  if (body) {
    body.innerHTML = merged.slice(0, 12).map((m) => modelRowHtml(m)).join("")
  }
  if (foot) {
    foot.innerHTML = modelRowHtml(sum, { total: true })
  }
}

function renderMeta(data) {
  const p = data.pricing
  setText($("rail-foot"), [
    data.source?.label || "",
    p ? `prices:${p.source}` : "",
    data.generatedAt ? formatTime(data.generatedAt) : "",
  ].filter(Boolean).join(" · "))
  setText($("page-sub"), data.projectRoot || data.source?.label || "—")
}


function syncStickyOffset() {
  const chrome = $("sticky-chrome")
  if (!chrome) return
  const h = Math.ceil(chrome.getBoundingClientRect().height) + 12
  document.documentElement.style.setProperty("--sticky-offset", `${h}px`)
}

function flashTile(id) {
  const el = $(id)
  if (!el || el.hidden) return
  syncStickyOffset()
  el.classList.remove("flash")
  void el.offsetWidth
  el.classList.add("flash")
  el.scrollIntoView({ behavior: "smooth", block: "start" })
  window.setTimeout(() => el.classList.remove("flash"), 1200)
}

function setupJumpChips() {
  const strip = $("status-strip")
  if (strip && strip.dataset.bound !== "1") {
    strip.dataset.bound = "1"
    strip.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-jump]")
      if (!chip) return
      const target = chip.getAttribute("data-jump")
      strip.querySelectorAll(".status-chip").forEach((c) => c.classList.remove("active-jump"))
      chip.classList.add("active-jump")
      window.setTimeout(() => chip.classList.remove("active-jump"), 900)
      flashTile(target)
      if (target === "tile-details") setTab(state.tab || "steps")
    })
  }

  const metrics = $("tile-metrics")
  if (metrics && metrics.dataset.bound !== "1") {
    metrics.dataset.bound = "1"
    metrics.addEventListener("click", (e) => {
      const card = e.target.closest("[data-jump]")
      if (!card || !metrics.contains(card)) return
      const target = card.getAttribute("data-jump")
      const tab = card.getAttribute("data-tab-jump")
      flashTile(target)
      if (target === "tile-details" && tab) setTab(tab)
    })
  }
}

const DETAIL_TABS = ["steps", "todos", "tasks"]

function setTab(name) {
  const next = DETAIL_TABS.includes(name) ? name : "steps"
  state.tab = next
  document.querySelectorAll("#detail-tabs .tab, #tile-details .tab").forEach((el) => {
    el.classList.toggle("active", el.getAttribute("data-tab") === next)
  })
  for (const id of DETAIL_TABS) {
    const panel = $(`tab-${id}`)
    if (!panel) continue
    panel.hidden = id !== next
  }
  const hint = $("tab-hint")
  if (hint) setText(hint, t(`tab.hint.${next}`))
}


const WF_COLORS = [
  "#0b6bcb", "#0f9d58", "#c47a00", "#7c3aed", "#db2777",
  "#0d9488", "#4f46e5", "#ea580c", "#0891b2", "#be123c",
]

function agentColor(name) {
  const s = String(name || "agent")
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0
  return WF_COLORS[h % WF_COLORS.length]
}

function renderWaterfall(data) {
  const tile = $("tile-waterfall")
  if (!tile) return
  const main = data.main
  const bg = data.background || []
  if (!main && !bg.length) {
    tile.hidden = true
    return
  }
  tile.hidden = false
  state.now = Date.now()

  const rawItems = []
  if (main) {
    rawItems.push({
      id: main.id,
      agent: main.agent || "main",
      title: main.title || "",
      status: main.status,
      start: main.timeCreated,
      end: isActive(main.status) ? state.now : main.timeUpdated,
      isMain: true,
    })
  }
  for (const a of bg) {
    rawItems.push({
      id: a.id,
      agent: a.agent || "agent",
      title: a.title || "",
      status: a.status,
      start: a.timeCreated,
      end: isActive(a.status) ? state.now : a.timeUpdated,
      isMain: false,
    })
  }

  const cleaned = rawItems
    .map((it) => {
      let start = Number(it.start) || 0
      let end = Number(it.end) || start
      if (end < start) end = start
      if (end - start < 30_000) end = start + 30_000
      return { ...it, start, end, active: isActive(it.status) }
    })
    .filter((it) => it.start > 0)

  const byStartThenId = (a, b) => (a.start - b.start) || String(a.id).localeCompare(String(b.id))
  const activeItems = cleaned.filter((it) => it.active).sort(byStartThenId)
  const idleItems = cleaned.filter((it) => !it.active).sort(byStartThenId)
  const laneItems = []

  // main lane first if main exists (running or not — main is the anchor)
  if (main) {
    const mainIt = cleaned.find((it) => it.isMain)
    if (mainIt) laneItems.push({ type: "session", item: mainIt })
  }
  for (const it of activeItems) {
    if (it.isMain) continue
    laneItems.push({ type: "session", item: it })
  }
  if (idleItems.length) {
    const historyBars = idleItems.filter((it) => !it.isMain)
    if (historyBars.length) {
      laneItems.push({ type: "history", items: historyBars })
    }
  }

  // If main is running and no other actives and no history — still show main
  // If only idle main and idle bg — show main + history
  if (!laneItems.length && cleaned.length) {
    // fallback: just main or first item
    laneItems.push({ type: "session", item: cleaned[0] })
  }

  const barCount = laneItems.reduce(
    (n, lane) => n + (lane.type === "history" ? lane.items.length : 1),
    0,
  )
  $("wf-count").textContent = String(activeItems.length)
  if (!laneItems.length) {
    $("wf-shell").innerHTML = `<div class="wf-empty">${escapeHtml(t("waterfall.empty"))}</div>`
    $("wf-legend").innerHTML = ""
    return
  }

  if (!$("wf-yaxis") || !$("wf-scroll")) {
    $("wf-shell").innerHTML = `
      <div class="wf-yaxis" id="wf-yaxis"></div>
      <div class="wf-scroll" id="wf-scroll">
        <div class="wf-canvas" id="wf-canvas">
          <div class="wf-grid" id="wf-grid"></div>
          <div class="wf-now" id="wf-now"></div>
          <div class="wf-lanes" id="wf-lanes"></div>
        </div>
      </div>`
  }

  function shortTitle(it) {
    let title = (it.title || "").replace(/\s*\(@[^)]*subagent\)\s*$/i, "").trim()
    const m = title.match(/\bT(\d+)\b/i)
    if (m) return `T${m[1]}`
    if (title.length > 18) return title.slice(0, 16) + "…"
    return title
  }

  function laneLabel(lane) {
    if (lane.type === "history") {
      return state.lang === "zh"
        ? `已结束 · ${lane.items.length}`
        : `Idle · ${lane.items.length}`
    }
    const it = lane.item
    const tag = shortTitle(it)
    if (it.isMain) return `${it.agent}${tag ? ` · ${tag}` : ""}`
    return tag ? `${it.agent} · ${tag}` : it.agent
  }

  const allForRange = cleaned
  const minStart = Math.min(...allForRange.map((x) => x.start))
  const maxEnd = Math.max(...allForRange.map((x) => x.end), state.now)
  const pad = 60_000
  let viewEnd = state.wfFollow ? Math.max(state.now, maxEnd) + pad : maxEnd + pad
  let viewStart = viewEnd - state.wfWindowMs
  if (maxEnd - minStart < state.wfWindowMs * 0.7) {
    viewStart = minStart - pad
    viewEnd = viewStart + state.wfWindowMs
    if (viewEnd < state.now + pad) viewEnd = state.now + pad
    viewStart = viewEnd - state.wfWindowMs
  }

  const span = Math.max(60_000, viewEnd - viewStart)
  const pxPerMs = 0.0022
  const width = Math.max(720, Math.round(span * pxPerMs))
  const laneH = 44

  $("wf-yaxis").innerHTML = laneItems
    .map((lane) => {
      if (lane.type === "history") {
        return `<div class="wf-y-item is-history" title="${escapeHtml(state.lang === "zh" ? "已结束的后台任务（合并泳道）" : "Finished agents (merged lane)")}">
          <i class="dot" style="background:var(--faint)"></i>
          <span>${escapeHtml(laneLabel(lane))}</span>
        </div>`
      }
      const it = lane.item
      const color = agentColor(it.id + it.agent)
      const meta = agentMeta(it.agent)
      return `<div class="wf-y-item ${it.isMain ? "is-main" : ""} ${it.active ? "is-running" : ""}" title="${escapeHtml(`${it.agent}\n${it.title}\n${it.status}`)}">
        <span class="wf-agent-ico tone-${meta.tone}" title="${escapeHtml(it.agent)}">${icon(meta.icon, "agent-ico", { badge: true, strokeWidth: 2.25 })}</span>
        <span>${escapeHtml(laneLabel(lane))}</span>
      </div>`
    })
    .join("")

  const tickMs = 5 * 60_000
  const firstTick = Math.ceil(viewStart / tickMs) * tickMs
  let ticks = ""
  for (let t0 = firstTick; t0 <= viewEnd; t0 += tickMs) {
    const x = ((t0 - viewStart) / span) * width
    const label = new Date(t0).toLocaleTimeString(state.lang === "zh" ? "zh-CN" : "en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    ticks += `<div class="wf-tick" style="left:${x}px"></div>
      <div class="wf-tick-label" style="left:${x}px">${escapeHtml(label)}</div>`
  }
  $("wf-grid").innerHTML = ticks

  const nowX = ((state.now - viewStart) / span) * width
  const nowEl = $("wf-now")
  if (nowEl) {
    nowEl.style.left = `${Math.max(0, Math.min(width, nowX))}px`
    nowEl.style.display = state.now >= viewStart && state.now <= viewEnd ? "block" : "none"
  }

  const canvas = $("wf-canvas")
  const lanesEl = $("wf-lanes")
  if (canvas) {
    canvas.style.width = `${width}px`
    canvas.style.height = `${laneItems.length * laneH}px`
  }

  function barHtml(it, color, extraClass = "") {
    const left = ((it.start - viewStart) / span) * width
    const w = Math.max(6, ((it.end - it.start) / span) * width)
    const running = isActive(it.status)
    const label = `${shortTitle(it) || it.agent}`
    return `<div class="wf-bar ${running ? "is-running" : "is-idle"} ${extraClass}"
      data-session-id="${escapeHtml(it.id)}"
      title="${escapeHtml(`${it.agent}\n${it.title}\n${formatTime(it.start)} → ${formatTime(it.end)} (${formatDuration(it.end - it.start)}) · ${it.status}`)}"
      style="left:${left}px;width:${w}px;--bar:${color}">
      <span class="wf-bar-label">${escapeHtml(label)}</span>
    </div>`
  }

  function shortTitle(it) {
    let title = (it.title || "").replace(/\s*\(@[^)]*subagent\)\s*$/i, "").trim()
    const m = title.match(/\bT(\d+)\b/i)
    if (m) return `T${m[1]}`
    if (title.length > 24) return title.slice(0, 22) + "…"
    return title
  }

  lanesEl.innerHTML = laneItems
    .map((lane) => {
      if (lane.type === "history") {
        const bars = lane.items
          .map((it) => barHtml(it, agentColor(it.id + it.agent), "is-history-bar"))
          .join("")
        return `<div class="wf-lane is-history">${bars}</div>`
      }
      const it = lane.item
      const color = agentColor(it.id + it.agent)
      return `<div class="wf-lane">${barHtml(it, color)}</div>`
    })
    .join("")

  const runningN = activeItems.length
  const idleN = idleItems.filter((it) => !it.isMain).length
  $("wf-legend").innerHTML = [
    `<span><i style="background:var(--green)"></i>${escapeHtml(state.lang === "zh" ? `运行中 ${runningN}` : `Running ${runningN}`)}</span>`,
    idleN
      ? `<span><i style="background:var(--faint)"></i>${escapeHtml(state.lang === "zh" ? `已结束合并 ${idleN}` : `Idle merged ${idleN}`)}</span>`
      : "",
    `<span>${escapeHtml(state.lang === "zh" ? "泳道仅展开运行中 agent" : "Lanes = running agents only")}</span>`,
  ]
    .filter(Boolean)
    .join("")

  const sc = $("wf-scroll")
  const follow = $("wf-follow")
  if (follow) follow.checked = !!state.wfFollow
  if (sc && state.wfFollow) {
    const target = Math.max(0, nowX - sc.clientWidth * 0.7)
    sc.scrollLeft = target
  }
}


function renderDashboard(data) {
  state.last = data
  state.now = Date.now()
  setNote(data.note || "")
  renderMeta(data)

  if (!data.main && !data.omo?.boulder?.present && !(data.omo?.todos || []).length) {
    $("bento").hidden = true
    $("status-strip").hidden = true
    if ($("tile-waterfall")) $("tile-waterfall").hidden = true
    setNote(t("empty.noProject"))
    return
  }

  $("bento").hidden = false
  renderStatusStrip(data)
  renderMetrics(data)
  renderMain(data)
  renderOmo(data)
  renderWaterfall(data)
  renderBg(data.background || [])
  renderModels(data.modelBreakdown || [])
  setTab(state.tab)
  mountIcons()
  syncStickyOffset()
}

async function loadDashboard() {
  setError("")
  if (!state.sourceId) {
    $("bento").hidden = true
    $("status-strip").hidden = true
    setNote(t("empty.noProject"))
    setText($("page-sub"), "—")
    setText($("rail-foot"), "")
    return
  }
  const data = await api(`/api/dashboard?sourceId=${encodeURIComponent(state.sourceId)}`)
  renderDashboard(data)
}

async function onImport() {
  const projectRoot = $("project-path").value.trim()
  const label = $("project-label").value.trim()
  if (!projectRoot) {
    setMsg(t("msg.needPath"), true)
    return
  }
  try {
    const data = await api("/api/sources", {
      method: "POST",
      body: JSON.stringify({ projectRoot, label: label || undefined }),
    })
    setMsg(t("msg.imported", { n: data.source.label }))
    state.sourceId = data.source.id
    storageSet("sourceId", state.sourceId)
    $("project-path").value = ""
    $("project-label").value = ""
    await loadSources()
    await loadDashboard()
  } catch (e) {
    setMsg(e.message || String(e), true)
  }
}

async function onRemove() {
  if (!state.sourceId) return
  if (!confirm(t("msg.confirmRemove"))) return
  try {
    await api(`/api/sources/${encodeURIComponent(state.sourceId)}`, { method: "DELETE" })
    state.sourceId = null
    storageRemove("sourceId")
    setMsg(t("msg.removed"))
    await loadSources()
    await loadDashboard()
  } catch (e) {
    setMsg(e.message || String(e), true)
  }
}

function setupAutoRefresh() {
  if (state.timer) {
    clearInterval(state.timer)
    state.timer = null
  }
  if ($("auto-refresh").checked) {
    state.timer = setInterval(() => {
      loadDashboard()
        .then(() => {
          if (!detailDrawer?.getOpenId?.()) return
          const now = Date.now()
          // throttle heavy drawer re-render
          if (now - (state.lastDrawerRefresh || 0) < 12000) return
          state.lastDrawerRefresh = now
          detailDrawer.refreshIfOpen()
        })
        .catch((e) => setError(e.message || String(e)))
    }, 4000)
  }
}

function setLang(lang) {
  state.lang = lang === "en" ? "en" : "zh"
  storageSet("lang", state.lang)
  applyTheme()
  applyI18n()
  if (state.last) renderDashboard(state.last)
}

function setTheme(theme) {
  state.theme = theme === "dark" ? "dark" : "light"
  storageSet("theme", state.theme)
  applyTheme()
  applyI18n()
}

async function boot() {
  applyTheme()
  applyI18n()

  $("btn-import").addEventListener("click", onImport)
  $("btn-remove").addEventListener("click", onRemove)
  $("btn-refresh").addEventListener("click", () => {
    loadDashboard().catch((e) => setError(e.message || String(e)))
  })
  $("source-select").addEventListener("change", (e) => {
    state.sourceId = e.target.value || null
    if (state.sourceId) storageSet("sourceId", state.sourceId)
    else storageRemove("sourceId")
    loadDashboard().catch((err) => setError(err.message || String(err)))
  })
  $("auto-refresh").addEventListener("change", setupAutoRefresh)
  const wfFollow = $("wf-follow")
  if (wfFollow) {
    wfFollow.checked = !!state.wfFollow
    wfFollow.addEventListener("change", () => {
      state.wfFollow = wfFollow.checked
      storageSet("wfFollow", state.wfFollow ? "1" : "0")
      if (state.last) renderWaterfall(state.last)
    })
  }
  $("project-path").addEventListener("keydown", (e) => {
    if (e.key === "Enter") onImport()
  })

  document.querySelectorAll("[data-lang-set]").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang-set")))
  })
  document.querySelectorAll("[data-theme-set]").forEach((btn) => {
    btn.addEventListener("click", () => setTheme(btn.getAttribute("data-theme-set")))
  })

  // event delegation so tabs always work after re-render/i18n
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#tile-details .tab, #detail-tabs .tab")
    if (!btn) return
    e.preventDefault()
    setTab(btn.getAttribute("data-tab"))
  })
  setupJumpChips()
  {
    const chrome = $("sticky-chrome")
    if (chrome) {
      syncStickyOffset()
      window.addEventListener("resize", syncStickyOffset, { passive: true })
      if ("ResizeObserver" in window) {
        new ResizeObserver(() => syncStickyOffset()).observe(chrome)
      }
      if ("IntersectionObserver" in window) {
        const sentinel = document.createElement("div")
        sentinel.className = "sticky-sentinel"
        sentinel.setAttribute("aria-hidden", "true")
        chrome.parentNode?.insertBefore(sentinel, chrome)
        const io = new IntersectionObserver(
          ([entry]) => {
            chrome.classList.toggle("is-stuck", Boolean(entry) && !entry.isIntersecting)
          },
          { threshold: [0] },
        )
        io.observe(sentinel)
      }
    }
  }
  mountIcons()
  detailDrawer = createDetailDrawer({
    getLang: () => state.lang,
    onOpenSession: () => {},
  })


  document.addEventListener("click", (e) => {
    // never treat drawer chrome as "open detail"
    if (e.target.closest("#detail-root, #detail-drawer, #detail-backdrop, #detail-close")) return
    const hit = e.target.closest("[data-session-id], #tile-main, .bg-item")
    if (!hit) return
    if (e.target.closest("button, a, select, input, .tab, .chip-btn, .drawer-close")) return
    let sid = hit.getAttribute("data-session-id")
    if (!sid && hit.id === "tile-main") sid = state.last?.main?.id
    if (!sid && hit.classList.contains("bg-item")) sid = hit.getAttribute("data-session-id")
    if (sid && detailDrawer) detailDrawer.open(sid)
  })

  try {
    await loadSources()
    await loadDashboard()
  } catch (e) {
    setError(e.message || String(e))
  }
  setupAutoRefresh()
}

boot()
