import { icon, modelChip, agentChip, categoryChip } from "./icons.js"

function $(id) {
  return document.getElementById(id)
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
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
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

function formatTime(v, lang = "zh") {
  if (v == null || v === "") return "—"
  try {
    const d = typeof v === "number" ? new Date(v) : new Date(v)
    if (Number.isNaN(d.getTime())) return String(v)
    return d.toLocaleString(lang === "zh" ? "zh-CN" : "en-US", {
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

function enumClass(status) {
  const s = String(status || "unknown").toLowerCase()
  if (["running", "in_progress", "active"].includes(s)) return "enum-running"
  if (["idle", "pending", "queued"].includes(s)) return "enum-idle"
  if (["completed", "complete", "done"].includes(s)) return "enum-completed"
  if (["error", "failed"].includes(s)) return "enum-error"
  return "enum-unknown"
}

function shortModel(label) {
  if (!label) return "—"
  if (typeof label === "object" && label?.label) return shortModel(label.label)
  const parts = String(label).split("/").map((x) => x.trim()).filter(Boolean)
  return parts.length >= 2 ? parts.slice(1).join(" / ") : parts[0]
}

const I18N = {
  zh: {
    title: "执行详情",
    close: "关闭",
    loading: "加载中…",
    error: "加载失败",
    summary: "摘要",
    timeline: "回合时间线",
    toolStats: "工具统计",
    toolEvents: "工具调用",
    todos: "本会话待办",
    todosHint: "来源：本 session 的 todowrite · 只属于当前打开的 agent（与工作明细「主会话待办」同源，范围不同）",
    links: "关联",
    parent: "父 Session",
    children: "子 Session",
    omoTask: "OMO 委派",
    omoTaskHint: "来源：boulder.task_sessions · 编排器登记的委派单元；下方为执行该任务的 subagent session",
    taskKey: "任务键",
    category: "分类",
    sessionTitle: "执行 Session",
    started: "开始",
    duration: "时长",
    updated: "更新",
    ended: "结束",
    model: "模型",
    cost: "费用",
    tokens: "Token",
    turns: "回合",
    tools: "工具",
    noTurns: "无 assistant 回合记录",
    noTools: "无工具调用",
    noTodos: "此 session 暂无 todowrite 条目",
    noChildren: "无子 session",
    truncated: "已截断显示最近条目",
    count: "次",
    avg: "均耗时",
    open: "打开",
    filterAll: "全部",
    filterError: "仅错误",
    filterRunning: "仅运行中",
    more: "加载更多",
    less: "收起",
    showing: "显示 {n}/{total}",
    turnReply: "回复完成",
    turnThinking: "思考/回复",
    turnError: "错误",
    turnTools: "工具调用",
    priority: "优先级",
    srcTodo: "todowrite",
  },
  en: {
    title: "Execution detail",
    close: "Close",
    loading: "Loading…",
    error: "Failed to load",
    summary: "Summary",
    timeline: "Turn timeline",
    toolStats: "Tool stats",
    toolEvents: "Tool calls",
    todos: "Session todos",
    todosHint: "Source: this session’s todowrite · scoped to the agent you opened (same kind as board “Main session todos”, different scope)",
    links: "Links",
    parent: "Parent session",
    children: "Child sessions",
    omoTask: "OMO delegate",
    omoTaskHint: "Source: boulder.task_sessions · orchestrator-registered unit; session execution is below",
    taskKey: "Task key",
    category: "Category",
    sessionTitle: "Worker session",
    started: "Started",
    duration: "Duration",
    updated: "Updated",
    ended: "Ended",
    model: "Model",
    cost: "Cost",
    tokens: "Tokens",
    turns: "Turns",
    tools: "Tools",
    noTurns: "No assistant turns",
    noTools: "No tool calls",
    noTodos: "No todowrite items on this session",
    noChildren: "No child sessions",
    truncated: "Showing latest entries only",
    count: "x",
    avg: "avg",
    open: "Open",
    filterAll: "All",
    filterError: "Errors",
    filterRunning: "Running",
    more: "Load more",
    less: "Collapse",
    showing: "Showing {n}/{total}",
    turnReply: "Reply complete",
    turnThinking: "Thinking / reply",
    turnError: "Error",
    turnTools: "Tool calls",
    priority: "Priority",
    srcTodo: "todowrite",
  },
}

function turnDisplayLabel(tr, t) {
  if (tr.error) {
    const sample = tr.toolSample || tr.label
    return sample ? `${t("turnError")} · ${sample}` : t("turnError")
  }
  const n = Number(tr.toolCount) || 0
  if (n === 1 && tr.toolSample) return tr.toolSample
  if (n > 1 && tr.toolSummary) return tr.toolSummary
  if (tr.toolSample) return tr.toolSample
  if (tr.toolSummary) return tr.toolSummary
  if (n > 0) return `${n} ${t("turnTools")}`
  const finish = String(tr.finish || "").toLowerCase()
  if (finish === "stop" || finish === "end_turn" || finish === "end-turn" || finish === "reply") {
    return t("turnReply")
  }
  if (finish === "thinking" || !finish) return t("turnThinking")
  if (tr.label && tr.label !== tr.agent) return tr.label
  return finish || t("turnThinking")
}

export function createDetailDrawer(opts) {
  const getLang = opts.getLang || (() => "zh")
  const onOpenSession = opts.onOpenSession || (() => {})
  const t = (k) => (I18N[getLang()] || I18N.zh)[k] || I18N.zh[k] || k

  let openId = null
  let lastDetail = null
  let toolFilter = "all"
  let bodyEl = null
  let pageTurns = 12
  let pageTools = 20
  let pageToolAgg = 12
  let pageTodos = 15
  let pageChildren = 12
  const PAGE = { turns: 12, tools: 20, toolAgg: 12, todos: 15, children: 12 }

  function ensureDom() {
    if ($("detail-drawer")) return
    const wrap = document.createElement("div")
    wrap.id = "detail-root"
    wrap.innerHTML = `
      <div class="drawer-backdrop" id="detail-backdrop" hidden></div>
      <aside class="drawer" id="detail-drawer" hidden aria-hidden="true">
        <header class="drawer-h">
          <div class="drawer-h-left">
            <h2 id="detail-title">${t("title")}</h2>
            <span class="enum" id="detail-status">—</span>
          </div>
          <button type="button" class="btn drawer-close" id="detail-close" aria-label="close">${icon("x") || "×"}</button>
        </header>
        <div class="drawer-body" id="detail-body"></div>
      </aside>
    `
    document.body.appendChild(wrap)
    bodyEl = $("detail-body")
    // capture-phase so nothing can swallow the close click
    document.addEventListener(
      "click",
      (e) => {
        const t = e.target
        if (!(t instanceof Element)) return
        if (t.closest("#detail-close")) {
          e.preventDefault()
          e.stopPropagation()
          close(e)
          return
        }
        if (t.closest("#detail-backdrop")) {
          e.preventDefault()
          e.stopPropagation()
          close(e)
        }
      },
      true,
    )
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && openId) close(e)
    })
  }

  function ensureX() {
    const btn = $("detail-close")
    if (!btn) return
    btn.innerHTML = icon("close") || icon("x") || "×"
    btn.setAttribute("type", "button")
  }

  function setOpen(open) {
    ensureDom()
    const drawer = $("detail-drawer")
    const backdrop = $("detail-backdrop")
    if (!drawer || !backdrop) return
    drawer.hidden = !open
    backdrop.hidden = !open
    drawer.classList.toggle("is-open", open)
    backdrop.classList.toggle("is-open", open)
    drawer.setAttribute("aria-hidden", open ? "false" : "true")
    document.body.classList.toggle("drawer-open", open)
    if (open) ensureX()
  }

  function close(e) {
    if (e) {
      e.preventDefault?.()
      e.stopPropagation?.()
    }
    openId = null
    lastDetail = null
    setOpen(false)
  }

  async function open(sessionId, opts = {}) {
    if (!sessionId) return
    ensureDom()
    const preserveScroll = opts.preserveScroll === true
    const prevScroll = preserveScroll && bodyEl ? bodyEl.scrollTop : 0
    const keepFilter = preserveScroll ? toolFilter : "all"
    openId = sessionId
    if (!preserveScroll) {
      toolFilter = "all"
      pageTurns = PAGE.turns
      pageTools = PAGE.tools
      pageToolAgg = PAGE.toolAgg
      pageTodos = PAGE.todos
      pageChildren = PAGE.children
    } else {
      toolFilter = keepFilter
    }
    setOpen(true)
    if (!preserveScroll) {
      $("detail-title").textContent = t("loading")
      $("detail-status").className = "enum enum-unknown"
      $("detail-status").textContent = "…"
      bodyEl.innerHTML = `<div class="empty drawer-loading">${icon("refresh")}<div>${esc(t("loading"))}</div></div>`
    }
    try {
      const res = await fetch(`/api/session/${encodeURIComponent(sessionId)}`)
      const data = await res.json()
      if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`)
      if (openId !== sessionId) return
      lastDetail = data
      render(data)
      if (preserveScroll && bodyEl) {
        requestAnimationFrame(() => {
          bodyEl.scrollTop = prevScroll
        })
      }
    } catch (e) {
      if (openId !== sessionId) return
      bodyEl.innerHTML = `<div class="empty">${icon("activity")}<div>${esc(t("error"))}: ${esc(e.message || e)}</div></div>`
    }
  }

  function render(d) {
    const lang = getLang()
    const s = d.session
    const omo = d.omoTask
    const headline = omo?.taskTitle || omo?.taskKey || s.title || t("title")
    $("detail-title").textContent = headline
    const statusForHeader = omo?.status || s.status
    $("detail-status").className = `enum ${enumClass(statusForHeader)}`
    $("detail-status").textContent = statusForHeader

    const model = s.model?.label || shortModel(s.model)
    const est = s.estimate?.matched ? formatUsd(s.estimate.usd) : "—"
    const tok = s.tokens || {}
    const omoDuration =
      omo?.elapsedMs != null
        ? omo.elapsedMs
        : omo?.startedAt
          ? Math.max(
              0,
              (omo.endedAt ? new Date(omo.endedAt).getTime() : Date.now()) - new Date(omo.startedAt).getTime(),
            )
          : null

    const allTools = d.toolEvents || []
    const toolsFiltered = allTools.filter((e) => {
      if (toolFilter === "error") return /error|fail/i.test(e.status)
      if (toolFilter === "running") return /run|pending|queue/i.test(e.status)
      return true
    })
    // newest first for scanning
    const toolsNewest = toolsFiltered.slice().reverse()
    const toolsView = toolsNewest.slice(0, pageTools)

    const turnsAll = d.turns || []
    // show latest turns first for long sessions
    const turnsNewest = turnsAll.slice().reverse()
    const turnsView = turnsNewest.slice(0, pageTurns)

    const toolsAggAll = d.tools || []
    const toolsAggView = toolsAggAll.slice(0, pageToolAgg)

    const todosAll = d.todos || []
    const todosView = todosAll.slice(0, pageTodos)

    const childrenAll = d.children || []
    const childrenView = childrenAll.slice(0, pageChildren)

    const moreBtn = (kind, shown, total) => {
      if (total <= PAGE[kind]) return ""
      if (shown >= total) {
        return `<button type="button" class="chip-btn" data-page="${kind}" data-act="less">${esc(t("less"))}</button>
          <span class="faint tiny-note">${esc(t("showing").replace("{n}", String(shown)).replace("{total}", String(total)))}</span>`
      }
      return `<button type="button" class="chip-btn active" data-page="${kind}" data-act="more">${esc(t("more"))}</button>
        <span class="faint tiny-note">${esc(t("showing").replace("{n}", String(shown)).replace("{total}", String(total)))}</span>`
    }

    const omoSection = omo
      ? `<section class="dsec dsec-omo">
        <div class="dsec-h">${icon("workflow")}<h3>${esc(t("omoTask"))}</h3>
          <span class="enum ${enumClass(omo.status)}">${esc(omo.status || "—")}</span>
        </div>
        <p class="dsec-hint">${esc(t("omoTaskHint"))}</p>
        <div class="d-summary">
          <div class="d-kv"><span>${esc(t("taskKey"))}</span><b class="mono">${esc(omo.taskKey || "—")}</b></div>
          <div class="d-kv"><span>Agent</span><div>${agentChip(omo.agent || s.agent)}</div></div>
          <div class="d-kv"><span>${esc(t("category"))}</span><div>${omo.category ? categoryChip(omo.category) : "<b>—</b>"}</div></div>
          <div class="d-kv"><span>${esc(t("started"))}</span><b class="mono">${esc(formatTime(omo.startedAt, lang))}</b></div>
          <div class="d-kv"><span>${esc(t("ended"))}</span><b class="mono">${esc(formatTime(omo.endedAt, lang))}</b></div>
          <div class="d-kv"><span>${esc(t("duration"))}</span><b class="mono">${esc(formatDuration(omoDuration))}</b></div>
        </div>
        ${
          s.title && s.title !== headline
            ? `<div class="d-kv d-kv-wide"><span>${esc(t("sessionTitle"))}</span><b title="${esc(s.title)}">${esc(s.title)}</b></div>`
            : ""
        }
      </section>`
      : ""

    bodyEl.innerHTML = `
      ${omoSection}

      <section class="dsec">
        <div class="dsec-h">${icon("bot")}<h3>${esc(t("summary"))}</h3></div>
        <div class="d-summary">
          <div class="d-kv"><span>${esc(t("model"))}</span><div>${modelChip(s.model?.label || model, { short: true })}</div></div>
          <div class="d-kv"><span>Agent</span><div>${agentChip(s.agent)}</div></div>
          <div class="d-kv"><span>${esc(t("started"))}</span><b class="mono">${esc(formatTime(s.timeCreated, lang))}</b></div>
          <div class="d-kv"><span>${esc(t("duration"))}</span><b class="mono">${esc(formatDuration(s.timeUpdated && s.timeCreated ? Math.max(0, s.timeUpdated - s.timeCreated) : null))}</b></div>
          <div class="d-kv"><span>${esc(t("updated"))}</span><b class="mono">${esc(formatTime(s.timeUpdated, lang))}</b></div>
          <div class="d-kv"><span>${esc(t("cost"))}</span><b>${esc(est)}</b></div>
        </div>
        <div class="d-tokens">
          <span><i>in</i><b>${esc(formatTokens(tok.input))}</b></span>
          <span><i>out</i><b>${esc(formatTokens(tok.output))}</b></span>
          <span><i>r</i><b>${esc(formatTokens(tok.reasoning))}</b></span>
          <span><i>cache</i><b>${esc(formatTokens(tok.cacheRead))}/${esc(formatTokens(tok.cacheWrite))}</b></span>
          <span><i>Σ</i><b>${esc(formatTokens(tok.total))}</b></span>
        </div>
        <div class="mono d-sid">${esc(s.id)}</div>
      </section>

      <section class="dsec">
        <div class="dsec-h">${icon("workflow")}<h3>${esc(t("links"))}</h3></div>
        <div class="d-links">
          ${
            d.parent
              ? `<button type="button" class="link-row" data-open-session="${esc(d.parent.id)}">
                  <span class="k">${esc(t("parent"))}</span>
                  <span class="v link-agent">${agentChip(d.parent.agent, { compact: true, short: true })} <span class="faint">· ${esc(d.parent.title)}</span></span>
                  <span class="enum ${enumClass(d.parent.status)}">${esc(d.parent.status)}</span>
                </button>`
              : ""
          }
          ${
            childrenAll.length
              ? `<div class="d-subh">${esc(t("children"))} (${childrenAll.length})</div>
                 ${childrenView
                   .map(
                     (c) => `
                   <button type="button" class="link-row" data-open-session="${esc(c.id)}">
                     <span class="v link-agent">${agentChip(c.agent, { compact: true, short: true })} <span class="faint">· ${esc(c.title)}</span></span>
                     <span class="enum ${enumClass(c.status)}">${esc(c.status)}</span>
                   </button>`,
                   )
                   .join("")}
                 <div class="page-row">${moreBtn("children", childrenView.length, childrenAll.length)}</div>`
              : s.isMain
                ? `<div class="empty tiny">${esc(t("noChildren"))}</div>`
                : ""
          }
        </div>
      </section>

      <section class="dsec">
        <div class="dsec-h">${icon("activity")}<h3>${esc(t("timeline"))}</h3><span class="badge">${turnsAll.length}</span></div>
        ${
          turnsAll.length
            ? `<div class="turn-list">${turnsView
                .map((tr, i) => {
                  const idx = turnsAll.length - i
                  const headline = turnDisplayLabel(tr, t)
                  const agent = tr.agent || "assistant"
                  const n = Number(tr.toolCount) || 0
                  const detailHint =
                    n > 1 && tr.toolSample && headline !== tr.toolSample
                      ? tr.toolSample
                      : n === 1 && tr.toolSummary && headline !== tr.toolSummary
                        ? tr.toolSummary
                        : ""
                  return `
              <div class="turn-row ${tr.error ? "is-error" : ""}">
                <div class="turn-idx">#${idx}</div>
                <div class="turn-main">
                  <div class="turn-top">
                    <b class="turn-label" title="${esc(headline)}">${esc(headline)}</b>
                    <span class="enum ${tr.finish ? "enum-completed" : "enum-running"}">${esc(tr.finish || "open")}</span>
                  </div>
                  <div class="turn-sub">
                    <span class="turn-agent">${esc(agent)}</span>
                    ${detailHint ? `<span class="faint mono turn-hint">${esc(detailHint)}</span>` : ""}
                  </div>
                  <div class="turn-meta mono">
                    ${esc(formatTime(tr.startedAt, lang))} · ${esc(formatDuration(tr.durationMs))}
                    · tools ${tr.toolCount}
                    · in ${formatTokens(tr.tokens.input)} / out ${formatTokens(tr.tokens.output)}
                  </div>
                </div>
              </div>`
                })
                .join("")}</div>
              <div class="page-row">${moreBtn("turns", turnsView.length, turnsAll.length)}</div>`
            : `<div class="empty tiny">${esc(t("noTurns"))}</div>`
        }
      </section>

      <section class="dsec">
        <div class="dsec-h">${icon("cpu")}<h3>${esc(t("toolStats"))}</h3><span class="badge">${toolsAggAll.length}</span></div>
        ${
          toolsAggAll.length
            ? `<div class="tool-agg">${toolsAggView
                .map(
                  (tg) => `
              <div class="tool-agg-row">
                <div class="tool-name mono">${esc(tg.name)}</div>
                <div class="tool-nums">
                  <span>${tg.count}${esc(t("count"))}</span>
                  ${tg.running ? `<span class="enum enum-running">${tg.running}</span>` : ""}
                  ${tg.error ? `<span class="enum enum-error">${tg.error}</span>` : ""}
                  <span class="faint">${esc(t("avg"))} ${esc(formatDuration(tg.avgDurationMs))}</span>
                </div>
              </div>`,
                )
                .join("")}</div>
              <div class="page-row">${moreBtn("toolAgg", toolsAggView.length, toolsAggAll.length)}</div>`
            : `<div class="empty tiny">${esc(t("noTools"))}</div>`
        }
      </section>

      <section class="dsec">
        <div class="dsec-h">
          ${icon("zap")}<h3>${esc(t("toolEvents"))}</h3>
          <span class="badge">${toolsFiltered.length}</span>
        </div>
        <div class="filter-row">
          <button type="button" class="chip-btn ${toolFilter === "all" ? "active" : ""}" data-tool-filter="all">${esc(t("filterAll"))}</button>
          <button type="button" class="chip-btn ${toolFilter === "running" ? "active" : ""}" data-tool-filter="running">${esc(t("filterRunning"))}</button>
          <button type="button" class="chip-btn ${toolFilter === "error" ? "active" : ""}" data-tool-filter="error">${esc(t("filterError"))}</button>
        </div>
        ${d.toolTruncated ? `<div class="faint tiny-note">${esc(t("truncated"))}</div>` : ""}
        ${
          toolsView.length
            ? `<div class="tool-events">${toolsView
                .map(
                  (e) => `
              <div class="tool-ev">
                <span class="enum ${enumClass(e.status)}">${esc(e.status)}</span>
                <span class="mono tool-ev-name">${esc(e.name)}</span>
                <span class="mono faint">${esc(formatDuration(e.durationMs))}</span>
                <span class="mono faint">${esc(formatTime(e.startedAt, lang))}</span>
              </div>`,
                )
                .join("")}</div>
              <div class="page-row">${moreBtn("tools", toolsView.length, toolsFiltered.length)}</div>`
            : `<div class="empty tiny">${esc(t("noTools"))}</div>`
        }
      </section>

      <section class="dsec">
        <div class="dsec-h">${icon("listTodo")}<h3>${esc(t("todos"))}</h3><span class="badge">${todosAll.length}</span></div>
        <p class="dsec-hint">${esc(t("todosHint"))}</p>
        ${
          todosAll.length
            ? `<div class="todo-list">${todosView
                .map((td) => {
                  const pri = td.priority ? String(td.priority) : ""
                  const priCls = pri ? `pri-${pri.toLowerCase()}` : ""
                  return `
              <div class="todo-row">
                <span class="enum ${enumClass(td.status)}">${esc(td.status)}</span>
                <div class="todo-main">
                  <div class="todo-text" title="${esc(td.content || "")}">${esc(td.content || "—")}</div>
                  <div class="todo-meta">
                    <span class="src-chip">${esc(t("srcTodo"))}</span>
                    ${pri ? `<span class="pri-chip ${priCls}">${esc(t("priority"))} ${esc(pri)}</span>` : ""}
                  </div>
                </div>
              </div>`
                })
                .join("")}</div>
              <div class="page-row">${moreBtn("todos", todosView.length, todosAll.length)}</div>`
            : `<div class="empty tiny">${esc(t("noTodos"))}</div>`
        }
      </section>
    `

    bodyEl.querySelectorAll("[data-open-session]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-open-session")
        if (id) {
          onOpenSession(id)
          open(id)
        }
      })
    })
    bodyEl.querySelectorAll("[data-tool-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        toolFilter = btn.getAttribute("data-tool-filter") || "all"
        pageTools = PAGE.tools
        if (lastDetail) render(lastDetail)
      })
    })
    bodyEl.querySelectorAll("[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const kind = btn.getAttribute("data-page")
        const act = btn.getAttribute("data-act")
        const step = PAGE[kind] || 12
        if (kind === "turns") pageTurns = act === "more" ? pageTurns + step : PAGE.turns
        if (kind === "tools") pageTools = act === "more" ? pageTools + step : PAGE.tools
        if (kind === "toolAgg") pageToolAgg = act === "more" ? pageToolAgg + step : PAGE.toolAgg
        if (kind === "todos") pageTodos = act === "more" ? pageTodos + step : PAGE.todos
        if (kind === "children") pageChildren = act === "more" ? pageChildren + step : PAGE.children
        if (lastDetail) render(lastDetail)
      })
    })
  }

  function refreshIfOpen() {
    if (!openId) return
    open(openId, { preserveScroll: true })
  }

  return { open, close, refreshIfOpen, getOpenId: () => openId }
}
