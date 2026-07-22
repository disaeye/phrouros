import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"

export type Env = Record<string, string | undefined>

export function getDataDir(env: Env = process.env, homedir = os.homedir()): string {
  let dataDir = env.XDG_DATA_HOME
  if (dataDir) {
    if (dataDir === "~") dataDir = homedir
    else if (dataDir.startsWith("~/") || dataDir.startsWith("~\\")) {
      dataDir = path.join(homedir, dataDir.slice(2).replace(/[\\/]+/g, path.sep))
    }
  }
  return dataDir ?? path.join(homedir, ".local", "share")
}

export function getOpenCodeRoot(env: Env = process.env, homedir = os.homedir()): string {
  return path.join(getDataDir(env, homedir), "opencode")
}

export function getOpenCodeDbPath(env: Env = process.env, homedir = os.homedir()): string {
  if (env.OPENCODE_DB_PATH) return path.resolve(env.OPENCODE_DB_PATH)
  return path.join(getOpenCodeRoot(env, homedir), "opencode.db")
}

export function getOpenCodeStorageDir(env: Env = process.env, homedir = os.homedir()): string {
  return path.join(getOpenCodeRoot(env, homedir), "storage")
}

export function realpathSafe(p: string): string | null {
  try {
    return fs.realpathSync(p)
  } catch {
    return null
  }
}

/** Canonical absolute project path (realpath when possible). */
export function canonicalizePath(p: string): string {
  const resolved = path.resolve(p)
  return path.normalize(realpathSafe(resolved) ?? resolved)
}

export function isPathInside(rootReal: string, candidateReal: string): boolean {
  const rel = path.relative(rootReal, candidateReal)
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel))
}
