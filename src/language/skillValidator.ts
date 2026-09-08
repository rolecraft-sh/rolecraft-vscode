import * as vscode from 'vscode'
import { CATEGORY_OPTIONS } from './skillCompletion.js'

const REQUIRED_FIELDS = ['name', 'slug', 'owner', 'description'] as const
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/

interface ParsedField {
  key: string
  value: string
  keyRange: vscode.Range
  valueRange: vscode.Range
}

export class SkillValidator implements vscode.CodeActionProvider {
  private diagnosticCollection: vscode.DiagnosticCollection
  private debounceTimer: ReturnType<typeof setTimeout> | undefined
  private enabled = true

  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix]

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('rolecraft.skill')
  }

  register(_context: vscode.ExtensionContext): vscode.Disposable {
    const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
      if (!this.enabled) return
      if (event.document.languageId !== 'skill') return
      this.debounceValidate(event.document)
    })

    const saveListener = vscode.workspace.onDidSaveTextDocument((document) => {
      if (!this.enabled) return
      if (document.languageId !== 'skill') return
      this.validate(document)
    })

    const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('rolecraft.validation.enabled')) {
        const config = vscode.workspace.getConfiguration('rolecraft')
        this.enabled = config.get<boolean>('validation.enabled', true)
        if (!this.enabled) {
          this.diagnosticCollection.clear()
        }
      }
    })

    const openListener = vscode.workspace.onDidOpenTextDocument((document) => {
      if (!this.enabled) return
      if (document.languageId !== 'skill') return
      this.validate(document)
    })

    for (const document of vscode.workspace.textDocuments) {
      if (document.languageId === 'skill' && this.enabled) {
        this.validate(document)
      }
    }

    return {
      dispose: () => {
        this.debounceTimer && clearTimeout(this.debounceTimer)
        this.diagnosticCollection.dispose()
        documentChangeListener.dispose()
        saveListener.dispose()
        configListener.dispose()
        openListener.dispose()
      },
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.diagnosticCollection.clear()
    }
  }

  validate(document: vscode.TextDocument): void {
    const diagnostics: vscode.Diagnostic[] = []
    const frontmatterRange = this.getFrontmatterRange(document)

    if (!frontmatterRange) {
      this.diagnosticCollection.set(document.uri, [])
      return
    }

    const fields = this.parseFields(document, frontmatterRange)
    const foundFields = new Set<string>()

    for (const field of fields) {
      foundFields.add(field.key)

      if (REQUIRED_FIELDS.includes(field.key as (typeof REQUIRED_FIELDS)[number])) {
        if (field.value.trim() === '') {
          diagnostics.push(
            this.createDiagnostic(
              field.valueRange,
              `Field '${field.key}' must not be empty`,
              vscode.DiagnosticSeverity.Error,
            ),
          )
        }
      }

      const formatError = this.validateFieldFormat(field.key, field.value)
      if (formatError) {
        diagnostics.push(
          this.createDiagnostic(field.valueRange, formatError, vscode.DiagnosticSeverity.Error),
        )
      }
    }

    for (const required of REQUIRED_FIELDS) {
      if (!foundFields.has(required)) {
        const line = frontmatterRange.start.line + 1
        const range = new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, 0))
        diagnostics.push(
          this.createDiagnostic(
            range,
            `Missing required field '${required}'`,
            vscode.DiagnosticSeverity.Error,
          ),
        )
      }
    }

    this.diagnosticCollection.set(document.uri, diagnostics)
  }

  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken,
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = []

    for (const diagnostic of context.diagnostics) {
      const line = document.lineAt(diagnostic.range.start.line)
      const fieldMatch = line.text.match(/^\s*(\w+)\s*:\s*(.*)$/)

      if (
        fieldMatch &&
        diagnostic.message.includes('slug') &&
        diagnostic.message.includes('kebab-case')
      ) {
        const _key = fieldMatch[1]
        const value = fieldMatch[2]
        if (value) {
          const kebabValue = value
            .toLowerCase()
            .replace(/[_\s]+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')

          const edit = new vscode.WorkspaceEdit()
          edit.replace(document.uri, diagnostic.range, kebabValue)

          const action = new vscode.CodeAction(
            `Convert '${value}' to kebab-case`,
            vscode.CodeActionKind.QuickFix,
          )
          action.edit = edit
          actions.push(action)
        }
      }
    }

    return actions
  }

  private debounceValidate(document: vscode.TextDocument): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    this.debounceTimer = setTimeout(() => {
      this.validate(document)
    }, 500)
  }

  private getFrontmatterRange(document: vscode.TextDocument): vscode.Range | undefined {
    const firstLine = document.lineAt(0)
    if (!firstLine.text.startsWith('---')) {
      return undefined
    }

    for (let i = 1; i < document.lineCount; i++) {
      const line = document.lineAt(i)
      if (line.text.startsWith('---')) {
        return new vscode.Range(new vscode.Position(0, 0), new vscode.Position(i, line.text.length))
      }
    }

    return undefined
  }

  private parseFields(document: vscode.TextDocument, range: vscode.Range): ParsedField[] {
    const fields: ParsedField[] = []

    for (let i = range.start.line + 1; i < range.end.line; i++) {
      const line = document.lineAt(i)
      const match = line.text.match(/^(\s*)(\w+)\s*:\s*(.*)$/)
      if (match) {
        const indent = match[1]
        const key = match[2]
        const value = match[3].trim()

        const keyStart = indent.length
        const keyEnd = keyStart + key.length
        const keyRange = new vscode.Range(
          new vscode.Position(i, keyStart),
          new vscode.Position(i, keyEnd),
        )

        const valueStart = line.text.indexOf(':', keyEnd) + 1
        const valueRange = new vscode.Range(
          new vscode.Position(i, valueStart),
          new vscode.Position(i, line.text.length),
        )

        fields.push({ key, value, keyRange, valueRange })
      }
    }

    return fields
  }

  private validateFieldFormat(key: string, value: string): string | undefined {
    if (value.trim() === '') return undefined

    switch (key) {
      case 'slug':
        if (!SLUG_PATTERN.test(value)) {
          return `Invalid slug format. Must be kebab-case (e.g., 'my-skill'). Use only lowercase letters, numbers, and hyphens.`
        }
        break
      case 'version':
        if (!SEMVER_PATTERN.test(value)) {
          return `Invalid version format. Must be valid semver (e.g., '1.0.0').`
        }
        break
      case 'category':
        if (!CATEGORY_OPTIONS.includes(value as (typeof CATEGORY_OPTIONS)[number])) {
          return `Invalid category '${value}'. Must be one of: ${CATEGORY_OPTIONS.join(', ')}`
        }
        break
      case 'mcp_servers':
      case 'agents': {
        const items = value.split(',').map((s) => s.trim())
        for (const item of items) {
          if (item === '') continue
          if (!/^[a-zA-Z0-9._-]+$/.test(item)) {
            return `Invalid ${key} item '${item}'. Must contain only letters, numbers, dots, underscores, or hyphens.`
          }
        }
        break
      }
    }

    return undefined
  }

  private createDiagnostic(
    range: vscode.Range,
    message: string,
    severity: vscode.DiagnosticSeverity,
  ): vscode.Diagnostic {
    const diagnostic = new vscode.Diagnostic(range, message, severity)
    diagnostic.source = 'rolecraft'
    return diagnostic
  }

  dispose(): void {
    this.debounceTimer && clearTimeout(this.debounceTimer)
    this.diagnosticCollection.dispose()
  }
}
