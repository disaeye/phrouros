import * as fs from "node:fs"
import * as path from "node:path"
import { createHash } from "node:crypto"
import { canonicalizePath } from "./paths"

export type SourceEntry = {
  id: string
  projectRoot: string
  label: string
  createdAt: number
  updatedAt: number
}

type SourcesRegistry = {
  version: 1
  sources: Record<string, SourceEntry>
}

const REGISTRY_VERSION = 1 as const

function emptyRegistry(): SourcesRegistry {
  return { version: REGISTRY_VERSION, sources: {} }
}

export function getRegistryPath(storageRoot: string): string {
  return path.join(storageRoot, "dashboard", "sources.json")
}

function hashProjectRoot(projectRoot: string): string {
  return createHash("sha256").update(projectRoot).digest("hex")
}

export function loadRegistry(storageRoot: string): SourcesRegistry {
  const registryPath = getRegistryPath(storageRoot)
  if (!fs.existsSync(registryPath)) return emptyRegistry()
  try {
    const parsed = JSON.parse(fs.readFileSync(registryPath, "utf8")) as SourcesRegistry
    if (parsed?.version !== REGISTRY_VERSION || typeof parsed.sources !== "object" || !parsed.sources) {
      return emptyRegistry()
    }
    return parsed
  } catch {
    return emptyRegistry()
  }
}

function writeRegistry(storageRoot: string, registry: SourcesRegistry): void {
  const registryPath = getRegistryPath(storageRoot)
  fs.mkdirSync(path.dirname(registryPath), { recursive: true })
  const tmpPath = `${registryPath}.tmp`
  fs.writeFileSync(tmpPath, JSON.stringify(registry), "utf8")
  fs.renameSync(tmpPath, registryPath)
}

export function listSources(storageRoot: string): SourceEntry[] {
  const registry = loadRegistry(storageRoot)
  return Object.values(registry.sources).sort((a, b) => {
    if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt
    return a.label.localeCompare(b.label, "zh-CN")
  })
}

export function getSourceById(storageRoot: string, sourceId: string): SourceEntry | null {
  return loadRegistry(storageRoot).sources[sourceId] ?? null
}

export function addOrUpdateSource(
  storageRoot: string,
  input: { projectRoot: string; label?: string },
): SourceEntry {
  if (!fs.existsSync(input.projectRoot) || !fs.statSync(input.projectRoot).isDirectory()) {
    throw new Error(`目录不存在或不是文件夹: ${input.projectRoot}`)
  }

  const projectRoot = canonicalizePath(input.projectRoot)
  const id = hashProjectRoot(projectRoot)
  const now = Date.now()
  const defaultLabel = path.basename(projectRoot) || projectRoot
  const registry = loadRegistry(storageRoot)
  const existing = registry.sources[id]

  const entry: SourceEntry = existing
    ? {
        ...existing,
        projectRoot,
        label: input.label?.trim() || existing.label || defaultLabel,
        updatedAt: now,
      }
    : {
        id,
        projectRoot,
        label: input.label?.trim() || defaultLabel,
        createdAt: now,
        updatedAt: now,
      }

  registry.sources[id] = entry
  writeRegistry(storageRoot, registry)
  return entry
}

export function removeSource(storageRoot: string, sourceId: string): boolean {
  const registry = loadRegistry(storageRoot)
  if (!registry.sources[sourceId]) return false
  delete registry.sources[sourceId]
  writeRegistry(storageRoot, registry)
  return true
}
