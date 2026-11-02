import { loadEnv } from '@medusajs/framework/utils'
import { withMercur } from '@mercurjs/core'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = withMercur({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      vendorCors: process.env.VENDOR_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
      authMethodsPerActor: {
        customer: ['emailpass', 'google'],
        user: ['emailpass'],
        member: ['emailpass'],
      },
    }
  },
  featureFlags: {
    seller_registration: true,
  },
  plugins: [
    { resolve: '@mercurjs/magento2-connector-plugin', options: {} },
  ],
  modules: [
    {
      resolve: '@medusajs/medusa/auth',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/auth-emailpass',
            id: 'emailpass',
          },
          {
            resolve: '@medusajs/medusa/auth-google',
            id: 'google',
            options: {
              clientId: 'test-google-client-id',
              clientSecret: 'test-google-client-secret',
              callbackUrl: 'http://localhost:3000/api/auth/google/callback',
            },
          },
        ],
      },
    },
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          {
            resolve: '@mercurjs/magento2-connector-plugin/providers/payment-external',
            id: 'external',
          },
        ],
      },
    },
    {
      resolve: '@mercurjs/core/modules/admin-ui',
      options: {
        appDir: '',
        path: '/dashboard',
        disable: true
      }
    },
    {
      resolve: '@mercurjs/core/modules/vendor-ui',
      options: {
        appDir: '',
        path: '/seller',
        disable: true
      }
    },
    {
      resolve: '@mercurjs/core/modules/courier',
      options: {
        providers: [
          {
            resolve: '@mercurjs/courier-pathao',
            id: 'pathao',
            options: { sandbox: true },
          },
          {
            resolve: '@mercurjs/courier-steadfast',
            id: 'steadfast',
            options: {},
          },
        ],
      },
    },
  ],
})
