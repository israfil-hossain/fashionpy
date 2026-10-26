import { loadEnv } from '@medusajs/framework/utils'
import { withMercur } from '@mercurjs/core'
import path from 'path'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Dashboard panels are served by these modules in production (static dist under
// /dashboard and /seller). Locally the panels run as Vite dev servers, so the
// modules stay disabled unless DASHBOARDS_SERVE=true is set explicitly.
// appDir must point at a directory whose `dist/` contains the built panel.
const dashboardAppDir = (envVar: string, fallback: string) =>
  process.env[envVar] || path.join(__dirname, fallback)

module.exports = withMercur({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      vendorCors: process.env.VENDOR_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  featureFlags: {
    seller_registration: true
  },
  modules: [
    {
      resolve: '@mercurjs/core/modules/admin-ui',
      options: {
        appDir: dashboardAppDir('ADMIN_UI_APP_DIR', '../admin-test'),
        path: '/dashboard',
        disable: process.env.DASHBOARDS_SERVE !== 'true',
      }
    },
    {
      resolve: '@mercurjs/core/modules/vendor-ui',
      options: {
        appDir: dashboardAppDir('VENDOR_UI_APP_DIR', '../vendor'),
        path: '/seller',
        disable: process.env.DASHBOARDS_SERVE !== 'true',
      }
    },
    {
      resolve: '@medusajs/medusa/cache-redis',
      options: { redisUrl: REDIS_URL },
    },
    {
      resolve: '@medusajs/medusa/event-bus-redis',
      options: { redisUrl: REDIS_URL },
    },
    {
      resolve: '@medusajs/medusa/workflow-engine-redis',
      options: { redis: { url: REDIS_URL } },
    },
    {
      resolve: '@medusajs/medusa/locking',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/locking-redis',
            id: 'locking-redis',
            is_default: true,
            options: { redisUrl: REDIS_URL },
          },
        ],
      },
    },
    {
      resolve: '@medusajs/medusa/file',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/file-s3',
            id: 's3',
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION || 'auto',
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
              // R2 does not support S3 ACLs; omit the ACL header.
              acl: false,
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/wishlist",
    },
  ],
})
