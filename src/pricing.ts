import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import type { ParsedModel, TokenBucket } from "./db"

/** USD per 1M tokens (models.dev cost fields). */
export type ModelRate = {
  input: number
  output: number
  reasoning: number | null
  cacheRead: number | null
  cacheWrite: number | null
}

export type RateMatch = {
  modelId: string
  providerId: string
  providerName: string
  rate: ModelRate
  /** Prefer official/lab providers over resellers when picking. */
  score: number
  /** True when all primary rates are 0 (subscription / free tier). */
  zeroPriced: boolean
}

export type EstimatedCost = {
  usd: number
  matched: boolean
  match: RateMatch | null
  note: string | null
}

export type PricingCatalogMeta = {
  source: "network" | "cache" | "opencode-cache" | "none"
  fetchedAt: number | null
  expiresAt: number | null
  modelCount: number
  url: string
  error: string | null
}

type ProviderEntry = {
  id?: string
  name?: string
  models?: Record<
    string,
    {
      id?: string
      name?: string
      cost?: {
        input?: number
        output?: number
        reasoning?: number
        cache_read?: number
        cache_write?: number
      } | null
    }
  >
}

const MODELS_DEV_URL = "https://models.dev/api.json"
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6h
const FETCH_TIMEOUT_MS = 20_000

/** Higher = preferred when same model id appears under many providers. */
const PROVIDER_PRIORITY: Record<string, number> = {
  openai: 100,
  anthropic: 100,
  google: 100,
  "google-vertex": 95,
  xai: 100,
  deepseek: 100,
  alibaba: 95,
  "alibaba-cn": 90,
  zhipuai: 100,
  "z-ai": 100,
  minimax: 100,
  "minimax-cn": 95,
  moonshotai: 100,
  xiaomi: 100,
  mistral: 95,
  cohere: 90,
  opencode: 85,
  "opencode-go": 80,
  llmgateway: 40,
  aihubmix: 35,
  abacus: 30,
  "routing-run": 25,
  crof: 25,
  "302ai": 20,
}

let catalog: Map<string, RateMatch[]> | null = null
let catalogMeta: PricingCatalogMeta = {
  source: "none",
  fetchedAt: null,
  expiresAt: null,
  modelCount: 0,
  url: MODELS_DEV_URL,
  error: null,
}
let inflight: Promise<void> | null = null

function cachePath(): string {
  const base =
    process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache")
  return path.join(base, "phrouros", "models-dev-api.json")
}

function opencodeCachePath(): string {
  const base =
    process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache")
  return path.join(base, "opencode", "models.json")
}

function providerScore(providerId: string): number {
  if (PROVIDER_PRIORITY[providerId] != null) return PROVIDER_PRIORITY[providerId]
  // subscription / free plans often have zero prices — deprioritize
  if (providerId.includes("coding-plan") || providerId.includes("token-plan")) return 5
  if (providerId.endsWith("-cn")) return 50
  return 15
}

function normalizeModelKey(id: string): string {
  return id.trim().toLowerCase()
}

function basenameModelId(id: string): string {
  // "z-ai/glm-5.2" -> "glm-5.2"
  const parts = id.split("/")
  return parts[parts.length - 1] || id
}

function toRate(cost: NonNullable<ProviderEntry["models"]>[string]["cost"]): ModelRate | null {
  if (!cost || typeof cost !== "object") return null
  const input = Number(cost.input)
  const output = Number(cost.output)
  if (!Number.isFinite(input) || !Number.isFinite(output)) return null
  return {
    input,
    output,
    reasoning: Number.isFinite(Number(cost.reasoning)) ? Number(cost.reasoning) : null,
    cacheRead: Number.isFinite(Number(cost.cache_read)) ? Number(cost.cache_read) : null,
    cacheWrite: Number.isFinite(Number(cost.cache_write)) ? Number(cost.cache_write) : null,
  }
}

function isZeroRate(rate: ModelRate): boolean {
  return (
    rate.input === 0 &&
    rate.output === 0 &&
    (rate.reasoning == null || rate.reasoning === 0) &&
    (rate.cacheRead == null || rate.cacheRead === 0) &&
    (rate.cacheWrite == null || rate.cacheWrite === 0)
  )
}

export function buildCatalogIndex(api: Record<string, ProviderEntry>): Map<string, RateMatch[]> {
  const index = new Map<string, RateMatch[]>()

  for (const [providerId, provider] of Object.entries(api)) {
    const models = provider.models || {}
    for (const [mid, model] of Object.entries(models)) {
      const rate = toRate(model.cost)
      if (!rate) continue
      const modelId = model.id || mid
      const keys = new Set([
        normalizeModelKey(modelId),
        normalizeModelKey(basenameModelId(modelId)),
        normalizeModelKey(mid),
        normalizeModelKey(basenameModelId(mid)),
      ])
      const match: RateMatch = {
        modelId,
        providerId,
        providerName: provider.name || providerId,
        rate,
        score: providerScore(providerId),
        zeroPriced: isZeroRate(rate),
      }
      for (const key of keys) {
        if (!key) continue
        const list = index.get(key) ?? []
        list.push(match)
        index.set(key, list)
      }
    }
  }

  // Sort each list: prefer non-zero, then higher provider score
  for (const [key, list] of index) {
    list.sort((a, b) => {
      if (a.zeroPriced !== b.zeroPriced) return a.zeroPriced ? 1 : -1
      if (b.score !== a.score) return b.score - a.score
      return a.providerId.localeCompare(b.providerId)
    })
    index.set(key, list)
  }

  return index
}

function loadIndexFromFile(filePath: string): Map<string, RateMatch[]> | null {
  try {
    if (!fs.existsSync(filePath)) return null
    const raw = fs.readFileSync(filePath, "utf8")
    const api = JSON.parse(raw) as Record<string, ProviderEntry>
    if (!api || typeof api !== "object") return null
    return buildCatalogIndex(api)
  } catch {
    return null
  }
}

function writeCache(body: string): void {
  try {
    const p = cachePath()
    fs.mkdirSync(path.dirname(p), { recursive: true })
    const tmp = `${p}.tmp`
    fs.writeFileSync(tmp, body)
    fs.renameSync(tmp, p)
  } catch {
    // cache write is best-effort
  }
}

async function fetchRemote(): Promise<Map<string, RateMatch[]>> {
  const res = await fetch(MODELS_DEV_URL, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { accept: "application/json", "user-agent": "phrouros/0.1" },
  })
  if (!res.ok) throw new Error(`models.dev HTTP ${res.status}`)
  const body = await res.text()
  const api = JSON.parse(body) as Record<string, ProviderEntry>
  writeCache(body)
  return buildCatalogIndex(api)
}

function setCatalog(index: Map<string, RateMatch[]>, source: PricingCatalogMeta["source"], error: string | null = null) {
  catalog = index
  const now = Date.now()
  catalogMeta = {
    source,
    fetchedAt: now,
    expiresAt: source === "network" || source === "cache" ? now + CACHE_TTL_MS : now + CACHE_TTL_MS,
    modelCount: index.size,
    url: MODELS_DEV_URL,
    error,
  }
}

/** Ensure catalog is loaded (network with cache fallback). Safe to call often. */
export async function ensurePricingCatalog(opts?: { force?: boolean }): Promise<PricingCatalogMeta> {
  const force = opts?.force === true
  if (!force && catalog && catalogMeta.expiresAt && Date.now() < catalogMeta.expiresAt) {
    return catalogMeta
  }
  if (inflight) {
    await inflight
    return catalogMeta
  }

  inflight = (async () => {
    try {
      const index = await fetchRemote()
      setCatalog(index, "network")
      return
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e)
      const cached = loadIndexFromFile(cachePath())
      if (cached && cached.size > 0) {
        setCatalog(cached, "cache", err)
        return
      }
      // OpenCode may already mirror models.dev
      const oc = loadIndexFromFile(opencodeCachePath())
      if (oc && oc.size > 0) {
        setCatalog(oc, "opencode-cache", err)
        return
      }
      catalog = catalog ?? new Map()
      catalogMeta = {
        ...catalogMeta,
        source: "none",
        error: err,
        modelCount: catalog.size,
      }
    }
  })()

  try {
    await inflight
  } finally {
    inflight = null
  }
  return catalogMeta
}

export function getPricingMeta(): PricingCatalogMeta {
  return catalogMeta
}

export function lookupRate(model: ParsedModel | null | undefined): RateMatch | null {
  if (!model?.id || !catalog) return null
  const keys = [
    normalizeModelKey(model.id),
    normalizeModelKey(basenameModelId(model.id)),
  ]
  // try provider-qualified key first if we ever store "provider/model"
  if (model.providerID) {
    keys.unshift(normalizeModelKey(`${model.providerID}/${model.id}`))
  }

  for (const key of keys) {
    const list = catalog.get(key)
    if (!list?.length) continue
    // Prefer exact provider match when OpenCode provider id aligns with models.dev
    if (model.providerID) {
      const pid = normalizeModelKey(model.providerID)
      const exact = list.find((m) => normalizeModelKey(m.providerId) === pid && !m.zeroPriced)
      if (exact) return exact
    }
    // skip pure zero-priced subscription stubs when a paid rate exists
    const paid = list.find((m) => !m.zeroPriced)
    return paid ?? list[0] ?? null
  }
  return null
}

/**
 * Estimate USD cost from token buckets.
 * models.dev prices are USD per 1M tokens.
 * Reasoning: use cost.reasoning if present, else bill as output (common practice).
 * Cache read/write: use dedicated rates when present; else cache_read falls back to input * 0 (not billed) only when rate missing → we don't invent.
 */
export function estimateCostUsd(
  tokens: TokenBucket,
  model: ParsedModel | null | undefined,
): EstimatedCost {
  const match = lookupRate(model)
  if (!match) {
    return {
      usd: 0,
      matched: false,
      match: null,
      note: model?.id ? `未在 models.dev 找到价格: ${model.id}` : "无模型信息",
    }
  }

  const r = match.rate
  const perM = 1_000_000
  const input = (tokens.input / perM) * r.input
  const output = (tokens.output / perM) * r.output
  const reasoningRate = r.reasoning != null ? r.reasoning : r.output
  const reasoning = (tokens.reasoning / perM) * reasoningRate
  const cacheRead =
    r.cacheRead != null ? (tokens.cacheRead / perM) * r.cacheRead : 0
  const cacheWrite =
    r.cacheWrite != null ? (tokens.cacheWrite / perM) * r.cacheWrite : 0

  const usd = input + output + reasoning + cacheRead + cacheWrite

  let note: string | null = null
  if (match.zeroPriced) {
    note = `价格为 0（订阅/套餐价: ${match.providerId}）`
  } else if (r.reasoning == null && tokens.reasoning > 0) {
    note = "推理 token 按 output 单价估算"
  }

  return {
    usd: roundUsd(usd),
    matched: true,
    match,
    note,
  }
}

function roundUsd(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0
  // keep more precision for tiny costs, still readable
  return Math.round(n * 1e6) / 1e6
}

export function emptyEstimatedCost(): EstimatedCost {
  return { usd: 0, matched: false, match: null, note: null }
}
