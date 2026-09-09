import { build, context } from 'esbuild'

const watch = process.argv.includes('--watch')

// Common options for both builds
const commonOptions = {
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  minify: false,
  logLevel: 'info',
}

const buildOptions = {
  ...commonOptions,
  external: ['vscode'],
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.js',
  bundle: true,
}

// Browser-side script for the security report webview
// (IIFE, no node resolution, loaded into the webview via nonce)
const webviewOptions = {
  entryPoints: ['src/webview/securityReport.browser.ts'],
  outfile: 'dist/webview/securityReport.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  sourcemap: false,
  minify: false,
  logLevel: 'info',
}

if (watch) {
  const ctx = await context(buildOptions)
  const webviewCtx = await context(webviewOptions)
  await Promise.all([ctx.watch(), webviewCtx.watch()])
  console.log('Watching for changes...')
} else {
  await build(buildOptions)
  await build(webviewOptions)
  console.log('Build complete')
}
