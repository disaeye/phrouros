const PATHS = {
  bot: `<path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />`,
  spark: `<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" />`,
  chart: `<path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />`,
  users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />`,
  plan: `<rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />`,
  list: `<path d="M3 12h.01" /><path d="M3 18h.01" /><path d="M3 6h.01" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M8 6h13" />`,
  check: `<circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />`,
  clock: `<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />`,
  play: `<polygon points="6 3 20 12 6 21 6 3" />`,
  refresh: `<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />`,
  close: `<path d="M18 6 6 18" /><path d="m6 6 12 12" />`,
  coin: `<circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" />`,
  chip: `<rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" /><path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />`,
  db: `<ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5V19A9 3 0 0 0 21 19V5" /><path d="M3 12A9 3 0 0 0 21 12" />`,
  folder: `<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />`,
  link: `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />`,
  zap: `<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />`,
  sun: `<circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />`,
  moon: `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />`,
  brain: `<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" /><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /><path d="M17.599 6.5a3 3 0 0 0 .399-1.375" /><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" /><path d="M3.477 10.896a4 4 0 0 1 .585-.396" /><path d="M19.938 10.5a4 4 0 0 1 .585.396" /><path d="M6 18a4 4 0 0 1-1.967-.516" /><path d="M19.967 17.484A4 4 0 0 1 18 18" />`,
  layers: `<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" /><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />`,
  target: `<circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />`,
  gitBranch: `<line x1="6" x2="6" y1="3" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />`,
  boulder: `<path d="m8 3 4 8 5-5 5 15H2L8 3z" />`,
  globe: `<circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />`,
  flame: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />`,
  scale: `<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />`,
  shield: `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />`,
  eye: `<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />`,
  search: `<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />`,
  book: `<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />`,
  hammer: `<path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9" /><path d="m18 15 4-4" /><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" />`,
  wrench: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />`,
  activity: `<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />`,
}

const ALIAS = {
  bot: "bot",
  cpu: "chip",
  coins: "coin",
  layers: "layers",
  activity: "activity",
  users: "users",
  listTodo: "list",
  listChecks: "check",
  workflow: "plan",
  clock: "clock",
  play: "play",
  refresh: "refresh",
  sun: "sun",
  moon: "moon",
  folder: "folder",
  sparkles: "spark",
  database: "db",
  zap: "zap",
  circleDollar: "coin",
  hardDrive: "db",
  brain: "brain",
  x: "close",
  close: "close",
  plan: "plan",
  target: "target",
  gitBranch: "gitBranch",
  chart: "chart",
  link: "link",
  boulder: "boulder",
  globe: "globe",
  flame: "flame",
  scale: "scale",
  shield: "shield",
  eye: "eye",
  search: "search",
  book: "book",
  hammer: "hammer",
  wrench: "wrench",
  chip: "chip",
  list: "list",
  check: "check",
  coin: "coin",
  db: "db",
  spark: "spark",
}

export function icon(name, cls = "ico", opts = {}) {
  const key = ALIAS[name] || name
  const body = PATHS[key]
  if (!body) return ""
  const sw = opts.strokeWidth != null ? opts.strokeWidth : opts.badge ? 2.25 : 2
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`
}

export function iconLabel(name, text, cls = "ico-label") {
  return `<span class="${cls}">${icon(name)}${text ? `<span>${text}</span>` : ""}</span>`
}

const AGENT_ROLES = {
  sisyphus: { icon: "boulder", tone: "blue", short: "Sisyphus" },
  atlas: { icon: "globe", tone: "cyan", short: "Atlas" },
  prometheus: { icon: "flame", tone: "orange", short: "Prometheus" },
  metis: { icon: "scale", tone: "violet", short: "Metis" },
  momus: { icon: "shield", tone: "green", short: "Momus" },
  oracle: { icon: "eye", tone: "violet", short: "Oracle" },
  explore: { icon: "search", tone: "cyan", short: "Explore" },
  librarian: { icon: "book", tone: "blue", short: "Librarian" },
  looker: { icon: "eye", tone: "orange", short: "Looker" },
  hephaestus: { icon: "hammer", tone: "orange", short: "Hephaestus" },
  junior: { icon: "wrench", tone: "green", short: "Junior" },
  default: { icon: "bot", tone: "blue", short: "Agent" },
}

const AGENT_MATCH = [
  [/sisyphus[-\s]?junior|s-?junior|\bjunior\b/, "junior"],
  [/sisyphus/, "sisyphus"],
  [/atlas/, "atlas"],
  [/prometheus/, "prometheus"],
  [/metis/, "metis"],
  [/momus/, "momus"],
  [/oracle/, "oracle"],
  [/\bexplore\b/, "explore"],
  [/librarian/, "librarian"],
  [/multimodal|looker/, "looker"],
  [/hephaestus/, "hephaestus"],
]

export function agentMeta(name) {
  const raw = String(name || "").trim()
  const lower = raw.toLowerCase()
  let key = "default"
  for (const [re, k] of AGENT_MATCH) {
    if (re.test(lower)) {
      key = k
      break
    }
  }
  const role = AGENT_ROLES[key] || AGENT_ROLES.default
  return {
    key,
    icon: role.icon,
    tone: role.tone,
    short: role.short,
    label: raw || role.short,
  }
}

export function agentChip(name, opts = {}) {
  const meta = agentMeta(name)
  const full = meta.label
  const display = opts.short ? meta.short : full
  const safe = display
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
  const fullSafe = full
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
  const cls = `agent-chip tone-${meta.tone}${opts.compact ? " is-compact" : ""}`
  const glyph = icon(meta.icon, "agent-ico", { badge: true, strokeWidth: 2.25 })
  return `<span class="${cls}" data-agent-role="${meta.key}" title="${fullSafe}"><span class="agent-glyph" aria-hidden="true">${glyph}</span><span class="agent-name">${safe}</span></span>`
}

const CATEGORY_META = {
  ultrabrain: { icon: "brain", tone: "violet", short: "ultrabrain" },
  deep: { icon: "layers", tone: "violet", short: "deep" },
  "visual-engineering": { icon: "spark", tone: "orange", short: "visual" },
  artistry: { icon: "target", tone: "orange", short: "artistry" },
  quick: { icon: "zap", tone: "cyan", short: "quick" },
  writing: { icon: "book", tone: "blue", short: "writing" },
  "unspecified-high": { icon: "chart", tone: "green", short: "high" },
  "unspecified-low": { icon: "list", tone: "muted", short: "low" },
  default: { icon: "chip", tone: "muted", short: "cat" },
}

const CATEGORY_MATCH = [
  [/ultra/, "ultrabrain"],
  [/\bdeep\b/, "deep"],
  [/visual/, "visual-engineering"],
  [/art/, "artistry"],
  [/quick/, "quick"],
  [/writ/, "writing"],
  [/unspecified[-_]?high|high[-_]?effort|\bhigh\b/, "unspecified-high"],
  [/unspecified[-_]?low|low[-_]?effort|\blow\b/, "unspecified-low"],
]

export function categoryMeta(name) {
  const raw = String(name || "").trim()
  const lower = raw.toLowerCase().replaceAll("_", "-")
  let key = "default"
  if (CATEGORY_META[lower]) key = lower
  else {
    for (const [re, k] of CATEGORY_MATCH) {
      if (re.test(lower)) {
        key = k
        break
      }
    }
  }
  const meta = CATEGORY_META[key] || CATEGORY_META.default
  return {
    key,
    icon: meta.icon,
    tone: meta.tone,
    short: meta.short,
    label: raw || meta.short,
  }
}

export function categoryChip(name, opts = {}) {
  if (!name) return ""
  const meta = categoryMeta(name)
  const display = opts.short ? meta.short : meta.label
  const safe = display
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
  const fullSafe = meta.label
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
  const cls = `cat-chip tone-${meta.tone}${opts.compact ? " is-compact" : ""}`
  const glyph = icon(meta.icon, "cat-ico", { badge: true, strokeWidth: 2.2 })
  return `<span class="${cls}" data-category="${meta.key}" title="${fullSafe}"><span class="cat-glyph" aria-hidden="true">${glyph}</span><span class="cat-name">${safe}</span></span>`
}

// Align with Claude Code Hub model icons: https://cch-plus.com/model-icons/
// Map source: ding113/claude-code-hub vendor-icon-map.json (LobeHub static SVGs)
const ICON_BASE = "https://cch-plus.com/model-icons/"

const VENDOR_ICONS = {
  openai: { file: "openai.svg", mono: true },
  anthropic: { file: "anthropic.svg", mono: true },
  google: { file: "google-color.svg", mono: false },
  xai: { file: "xai.svg", mono: true },
  zhipuai: { file: "zhipu-color.svg", mono: false },
  deepseek: { file: "deepseek-color.svg", mono: false },
  alibaba: { file: "alibaba-color.svg", mono: false },
  qwen: { file: "alibaba-color.svg", mono: false },
  minimax: { file: "minimax-color.svg", mono: false },
  moonshotai: { file: "moonshot.svg", mono: true },
  kimi: { file: "kimi-color.svg", mono: false },
  mistral: { file: "mistral-color.svg", mono: false },
  meta: { file: "meta-color.svg", mono: false },
  llama: { file: "meta-color.svg", mono: false },
  xiaomi: { file: "xiaomimimo.svg", mono: true },
  azure: { file: "azure-color.svg", mono: false },
  cohere: { file: "cohere-color.svg", mono: false },
  perplexity: { file: "perplexity-color.svg", mono: false },
  openrouter: { file: "openrouter.svg", mono: true },
  ollama: { file: "ollama.svg", mono: true },
  bytedance: { file: "bytedance-color.svg", mono: false },
  baidu: { file: "baidu-color.svg", mono: false },
  tencent: { file: "tencent-color.svg", mono: false },
}

const VENDOR_RULES = [
  [/claude|anthropic|sonnet|opus|haiku/, "anthropic"],
  [/gpt|o1|o3|o4|openai|chatgpt/, "openai"],
  [/gemini|gemma|google/, "google"],
  [/grok|\bxai\b|x-ai/, "xai"],
  [/glm|zhipu|z-ai|chatglm/, "zhipuai"],
  [/deepseek/, "deepseek"],
  [/qwen|tongyi/, "qwen"],
  [/minimax/, "minimax"],
  [/kimi|moonshot/, "moonshotai"],
  [/mistral|mixtral|codestral/, "mistral"],
  [/llama|meta-/, "meta"],
  [/mimo|xiaomi/, "xiaomi"],
  [/doubao|seed|bytedance|volc/, "bytedance"],
  [/ernie|baidu/, "baidu"],
  [/hunyuan|tencent/, "tencent"],
  [/command|cohere/, "cohere"],
  [/sonar|perplexity/, "perplexity"],
]

const PREFIX_ALIAS = {
  anthropic: "anthropic",
  openai: "openai",
  google: "google",
  xai: "xai",
  "x-ai": "xai",
  deepseek: "deepseek",
  "deepseek-ai": "deepseek",
  qwen: "qwen",
  alibaba: "alibaba",
  zhipuai: "zhipuai",
  "z-ai": "zhipuai",
  minimax: "minimax",
  moonshotai: "moonshotai",
  moonshot: "moonshotai",
  kimi: "kimi",
  mistral: "mistral",
  meta: "meta",
  llama: "meta",
  "meta-llama": "meta",
  xiaomi: "xiaomi",
  mimo: "xiaomi",
  cch: null,
  "cch-oai": null,
  "cch-anth": "anthropic",
}

export function modelBrand(modelText) {
  const raw = String(modelText || "").trim()
  const lower = raw.toLowerCase()
  const slash = lower.split("/")
  if (slash.length >= 2) {
    const pref = slash[0].trim()
    if (PREFIX_ALIAS[pref]) return { key: PREFIX_ALIAS[pref], label: PREFIX_ALIAS[pref] }
    const rest = slash.slice(1).join("/")
    for (const [re, key] of VENDOR_RULES) if (re.test(rest) || re.test(lower)) return { key, label: key }
  }
  for (const [re, key] of VENDOR_RULES) if (re.test(lower)) return { key, label: key }
  return { key: "generic", label: "model" }
}

function displayModelName(modelText, short) {
  const raw = String(modelText || "—").trim() || "—"
  if (!short) return raw
  const parts = raw.split("/").map((s) => s.trim()).filter(Boolean)
  const variants = new Set(["high", "medium", "low", "max", "xhigh", "default", "fast", "slow", "min", "lite"])
  let ids = parts.slice()
  while (ids.length > 1 && variants.has(ids[ids.length - 1].toLowerCase())) ids.pop()
  if (
    ids.length >= 2 &&
    (/^(cch-|openai|anthropic|google|xai|zhipu|deepseek|qwen|alibaba|meta)/i.test(ids[0]) ||
      PREFIX_ALIAS[ids[0].toLowerCase()] !== undefined)
  ) {
    ids = ids.slice(1)
  }
  return ids.join(" / ") || parts[parts.length - 1] || raw
}

export function modelChip(modelText, opts = {}) {
  const brand = modelBrand(modelText)
  const display = displayModelName(modelText, opts.short !== false)
  const full = String(modelText || "—")
  const safe = display.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;")
  const fullSafe = full.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;")
  const entry = VENDOR_ICONS[brand.key]
  let logo
  if (entry) {
    const monoClass = entry.mono ? " mono" : ""
    logo = `<img class="model-logo-img${monoClass}" src="${ICON_BASE}${entry.file}" alt="" width="14" height="14" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
  } else {
    const initial = (/[a-z0-9]/i.exec(display)?.[0] || "?").toUpperCase()
    logo = `<span class="model-mono">${initial}</span>`
  }
  return `<span class="model brand-${brand.key}" title="${fullSafe}"><span class="model-logo" aria-hidden="true">${logo}</span><span class="model-name">${safe}</span></span>`
}
