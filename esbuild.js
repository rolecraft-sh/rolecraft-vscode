import { build, context } from 'esbuild'

const watch = process.argv.includes('--watch')

const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  minify: false,
  logLevel: 'info',
}

if (watch) {
  const ctx = await context(buildOptions)
  await ctx.watch()
  console.log('Watching for changes...')
} else {
  await build(buildOptions)
  console.log('Build complete')
}
