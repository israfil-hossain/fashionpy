import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
const server = await createServer({
  root: '/Users/israfil/Proejcts/fashionpy/mercur/apps/vendor',
  configFile: false,
  server: { middlewareMode: true, hmr: false },
  logLevel: 'error',
  plugins: [react()],
})
for (const id of ['@mercurjs/vendor/index.css', '@mercurjs/vendor']) {
  try {
    const r = await server.pluginContainer.resolveId(id, '/Users/israfil/Proejcts/fashionpy/mercur/apps/vendor/src/main.tsx')
    console.log(id, '=>', r?.id ?? 'NULL')
  } catch (e) { console.log(id, 'THREW', e.message) }
}
await server.close()
