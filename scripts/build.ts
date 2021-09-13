import { build } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals'

const local = ['api', 'adapter-wechat', 'core']

async function buildCBR() {
  await build({
    entryPoints: ['packages/api/src/main.ts'],
    outfile: 'packages/api/dist/main.js',
    bundle: true,
    color: true,
    minify: true,
    sourcemap: 'inline',
    platform: 'node',
    target: 'node14.4.0',
    plugins: [nodeExternalsPlugin({
      packagePath: local.map(v => `${__dirname}/../packages/${v}/package.json`),
      allowList: local.map(v => `@cyberrun/${v}`)
    })]
  })
}

buildCBR()