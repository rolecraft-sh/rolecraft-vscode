import { exec } from 'node:child_process'
import * as os from 'node:os'
import { promisify } from 'node:util'
import * as vscode from 'vscode'
import { RoleCraftError, RoleCraftJsonParseError, RoleCraftNotFoundError } from './errors.js'

const execAsync = promisify(exec)

function getExecutablePath(): string {
  const config = vscode.workspace.getConfiguration('rolecraft')
  return config.get<string>('executablePath', 'rolecraft')
}

export async function runRolecraft(args: string[], cwd?: string): Promise<string> {
  const executablePath = getExecutablePath()
  const resolvedCwd = cwd ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? os.homedir()
  const escapedArgs = args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(' ')
  const fullCommand = `${executablePath} ${escapedArgs}`

  try {
    const { stdout, stderr } = await execAsync(fullCommand, {
      cwd: resolvedCwd,
      timeout: 30_000,
      env: {
        ...process.env,
        PATH: process.env.PATH,
      },
    })

    if (stderr) {
      console.warn('RoleCraft stderr:', stderr)
    }

    return stdout.trim()
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error) {
      const nodeError = error as { code: string; stderr?: string }
      if (nodeError.code === 'ENOENT') {
        throw new RoleCraftNotFoundError(executablePath)
      }
    }

    if (error instanceof Error && 'exitCode' in error) {
      const execError = error as { exitCode: number; stderr?: string; stdout?: string }
      throw new RoleCraftError(
        `RoleCraft command failed with exit code ${execError.exitCode}`,
        execError.exitCode,
        execError.stderr ?? '',
      )
    }

    throw error
  }
}

export async function runRolecraftJson<T>(args: string[], cwd?: string): Promise<T> {
  const output = await runRolecraft([...args, '--json'], cwd)

  if (!output) {
    throw new RoleCraftJsonParseError('(empty output)')
  }

  try {
    return JSON.parse(output) as T
  } catch {
    throw new RoleCraftJsonParseError(output)
  }
}

export { RoleCraftError, RoleCraftNotFoundError, RoleCraftJsonParseError } from './errors.js'
