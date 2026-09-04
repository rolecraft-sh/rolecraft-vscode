export class RoleCraftError extends Error {
  constructor(
    message: string,
    public exitCode: number,
    public stderr: string,
  ) {
    super(message)
    this.name = 'RoleCraftError'
  }
}

export class RoleCraftNotFoundError extends Error {
  constructor(executablePath: string) {
    super(`RoleCraft CLI not found at '${executablePath}'`)
    this.name = 'RoleCraftNotFoundError'
  }
}

export class RoleCraftJsonParseError extends Error {
  constructor(output: string) {
    super(`Failed to parse RoleCraft JSON output: ${output.slice(0, 200)}`)
    this.name = 'RoleCraftJsonParseError'
  }
}
