import { build } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals'

async function buildCBR() {
  await build({
    entryPoints: ['packages/api/src/main.ts'],
    outfile: 'packages/api/dist/main.js',
    bundle: true,
    minify: false,
    sourcemap: 'inline',
    platform: 'node',
    target: 'node14.4.0',
    plugins: [nodeExternalsPlugin()],
  })
}

buildCBR()