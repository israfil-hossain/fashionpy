import { asFunction, Lifetime } from "@medusajs/framework/awilix"
import { moduleProviderLoader } from "@medusajs/framework/modules-sdk"
import {
  LoaderOptions,
  ModuleProvider,
  ModulesSdkTypes,
} from "@medusajs/framework/types"

import { CourierProviderRegistrationPrefix } from "../services/provider-service"
import { SystemCourierProvider } from "../providers"

const registrationFn = async (klass, container, pluginOptions) => {
  if (!klass?.identifier) {
    throw new Error(
      `Courier provider registration received an invalid service (${String(klass)}) ` +
        `for id "${pluginOptions?.id}" — check the provider package's ModuleProvider export.`
    )
  }
  const key = `${CourierProviderRegistrationPrefix}${klass.identifier}_${pluginOptions.id}`

  container.register({
    [key]: asFunction(
      (cradle) => new klass(cradle, pluginOptions.options ?? {}),
      {
        lifetime: klass.LIFE_TIME || Lifetime.SINGLETON,
      }
    ),
  })
}

export default async ({
  container,
  options,
}: LoaderOptions<
  (
    | ModulesSdkTypes.ModuleServiceInitializeOptions
    | ModulesSdkTypes.ModuleServiceInitializeCustomDataLayerOptions
  ) & { providers: ModuleProvider[] }
>): Promise<void> => {
  // The system provider is always registered: it backs dev/test bookings that
  // have no real courier credentials and doubles as the no-config fallback.
  await registrationFn(SystemCourierProvider, container, {
    id: "system",
  })

  const providers = options?.providers || []
  if (!providers.length) {
    return
  }

  await moduleProviderLoader({
    container,
    providers,
    registerServiceFn: registrationFn,
  })
}
