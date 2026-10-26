import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { mercurDashboardPlugin } from '@mercurjs/dashboard-sdk/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl =
    env.VITE_MERCUR_BACKEND_URL || env.MERCUR_BACKEND_URL
  const vendorUrl =
    env.VITE_MERCUR_VENDOR_URL || env.MERCUR_VENDOR_URL
  // Production builds served by the backend under a sub-path (e.g. /dashboard)
  // must emit assets relative to that sub-path or they 404 once the backend
  // strips the route prefix. Defaults to "/" for local dev.
  const base = env.VITE_BASE_PATH || '/'

return {
    base,
    plugins: [
      react(),
      mercurDashboardPlugin({
        medusaConfigPath: '../api/medusa-config.ts',
        ...(backendUrl ? { backendUrl } : {}),
        ...(vendorUrl ? { vendorUrl } : {}),
        name: 'FashionPy',
        logo: '/f_logo.png',
      }),
    ],
  }
})
