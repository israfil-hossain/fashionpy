import { loadEnv } from '@medusajs/framework/utils'
import { withMercur } from '@mercurjs/core'
import path from 'path'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Cloudflare R2's S3 API rejects a Cloudflare account token ("cfat_...") with
// an opaque 500 ("Credential access key has length N, should be 32"). Fail
// fast at boot with the real cause instead.
if (process.env.S3_ACCESS_KEY_ID?.startsWith('cfat_')) {
  console.warn(
    '\n[medusa-config] S3_ACCESS_KEY_ID looks like a Cloudflare account token (cfat_...).\n' +
      'Uploads will fail with HTTP 500 until this is replaced with an R2 API token Access Key ID\n' +
      '(32 chars). Create one in Cloudflare Dashboard → R2 → Manage R2 API Tokens.\n'
  )
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

// Google OAuth is optional: the provider is only registered when credentials
// are present, so the API boots cleanly without them.
const googleAuthConfigured = !!(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
)

// Dashboard panels are served by these modules in production (static dist under
// /dashboard and /seller). Locally the panels run as Vite dev servers, so the
// modules stay disabled unless DASHBOARDS_SERVE=true is set explicitly.
// appDir must point at a directory whose `dist/` contains the built panel.
const dashboardAppDir = (envVar: string, fallback: string) =>
  process.env[envVar] || path.join(__dirname, fallback)

export default withMercur({
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
      // Google login is for storefront customers only; the admin (user) and
      // vendor (member) actor types stay on emailpass.
      authMethodsPerActor: {
        customer: googleAuthConfigured ? ['emailpass', 'google'] : ['emailpass'],
        user: ['emailpass'],
        member: ['emailpass'],
      },
    }
  },
  featureFlags: {
    seller_registration: true
  },
  plugins: [
    // Provider-agnostic payout loop for the local (manual) payout provider:
    // COD capture on delivery, payout processing, reversals and seller
    // onboarding. Mutually exclusive with @mercurjs/stripe-connector-plugin,
    // which ships the same trigger surface for Stripe Connect (Phase 5).
    {
      resolve: '@mercurjs/payout-local',
      options: {},
    },
  ],
  modules: [
    // Payouts go through the local manual provider: no money moves over an
    // API — the operator exports the batch, transfers from the platform
    // account, and marks rows paid in the admin panel. The Stripe Connect
    // provider returns with multi-provider routing in Phase 5 (the module
    // accepts exactly one provider today).
    {
      resolve: '@mercurjs/core/modules/payout',
      options: {
        providers: [
          {
            resolve: '@mercurjs/payout-local/providers/local',
            id: 'local',
            options: {
              vendorUrl: process.env.VENDOR_URL || 'http://localhost:7001',
            },
          },
        ],
        onboarding: {
          returnUrl: `${process.env.VENDOR_URL || 'http://localhost:7001'}/settings/store/payment-details`,
          refreshBaseUrl: process.env.BACKEND_URL || 'http://localhost:9000',
        },
      },
    },
    {
      resolve: '@medusajs/medusa/auth',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/auth-emailpass',
            id: 'emailpass',
          },
          ...(googleAuthConfigured
            ? [
                {
                  resolve: '@medusajs/medusa/auth-google',
                  id: 'google',
                  options: {
                    clientId: process.env.GOOGLE_CLIENT_ID!,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                    callbackUrl: process.env.GOOGLE_CALLBACK_URL!,
                  },
                },
              ]
            : []),
        ],
      },
    },
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
      resolve: "@medusajs/medusa/file",
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
    // ── Payments ──────────────────────────────────────────────────────────────
    // The built-in system/manual provider always registers alongside these
    // entries; pp_cod adds a distinct id so checkout can offer Cash on Delivery
    // and courier booking can collect COD cash through the platform. Adding
    // STRIPE_SECRET_KEY later enables card checkout here only — payouts stay
    // on the local provider until Phase 5 (Stripe capture jobs ship with the
    // stripe-connector plugin, which is not installed).
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          ...(STRIPE_SECRET_KEY
            ? [
                {
                  resolve: '@mercurjs/stripe-connector-plugin/providers/payment-stripe',
                  id: 'stripe',
                  options: {
                    apiKey: STRIPE_SECRET_KEY,
                    webhookSecret: process.env.STRIPE_OPERATOR_WEBHOOK_SECRET,
                  },
                },
              ]
            : []),
          {
            resolve: "@mercurjs/payment-cod",
            options: {},
          },
        ],
      },
    },
    // ── Couriers (Pathao / Steadfast) ─────────────────────────────────────────
    // Seller accounts are created per-seller in the vendor panel; the platform
    // credentials below book COD consignments so COD cash is remitted to the
    // platform and commission flows through the normal split → payout path.
    {
      resolve: "@mercurjs/core/modules/courier",
      options: {
        providers: [
          {
            resolve: "@mercurjs/courier-pathao",
            id: "pathao",
            options: {
              sandbox: process.env.PATHAO_SANDBOX === "true",
            },
          },
          {
            resolve: "@mercurjs/courier-steadfast",
            id: "steadfast",
            options: {
              baseUrl: process.env.STEADFAST_BASE_URL || undefined,
              webhookToken: process.env.STEADFAST_WEBHOOK_TOKEN || undefined,
            },
          },
        ],
        platform: {
          ...(process.env.PATHAO_CLIENT_ID &&
          process.env.PATHAO_CLIENT_SECRET &&
          process.env.PATHAO_USERNAME &&
          process.env.PATHAO_PASSWORD
            ? {
                pathao: {
                  client_id: process.env.PATHAO_CLIENT_ID,
                  client_secret: process.env.PATHAO_CLIENT_SECRET,
                  username: process.env.PATHAO_USERNAME,
                  password: process.env.PATHAO_PASSWORD,
                  store_id: process.env.PATHAO_STORE_ID
                    ? Number(process.env.PATHAO_STORE_ID)
                    : undefined,
                },
              }
            : {}),
          ...(process.env.STEADFAST_API_KEY && process.env.STEADFAST_SECRET_KEY
            ? {
                steadfast: {
                  apiKey: process.env.STEADFAST_API_KEY,
                  secretKey: process.env.STEADFAST_SECRET_KEY,
                  baseUrl: process.env.STEADFAST_BASE_URL || undefined,
                },
              }
            : {}),
        },
      },
    },
    {
      resolve: "./src/modules/wishlist",
    },
  ],
})
