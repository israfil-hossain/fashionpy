import { MedusaError } from "@medusajs/framework/utils"
import { ICourierProvider } from "@mercurjs/types"

export const CourierProviderRegistrationPrefix = "courier_"

type InjectedDependencies = {
  [key: `${typeof CourierProviderRegistrationPrefix}${string}`]: ICourierProvider
}

/**
 * Holds every registered courier provider (pathao, steadfast, system) and
 * dispatches by identifier — unlike the payout module, which asserts exactly
 * one provider, several couriers are active at once.
 */
export default class CourierProviderService {
  protected readonly providers_: Map<string, ICourierProvider>

  constructor(container: InjectedDependencies) {
    const providerKeys = Object.keys(container).filter((k) =>
      k.startsWith(CourierProviderRegistrationPrefix)
    )

    if (!providerKeys.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Courier module should be initialized with at least one provider`
      )
    }

    this.providers_ = new Map(
      providerKeys.map((key) => {
        const instance = container[key]
        const identifier =
          (instance.constructor as { identifier?: string }).identifier ?? key
        return [identifier, instance] as const
      })
    )
  }

  getProvider(identifier: string): ICourierProvider {
    const provider = this.providers_.get(identifier)
    if (!provider) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Courier provider "${identifier}" is not registered. Available providers: ${[
          ...this.providers_.keys(),
        ].join(", ")}`
      )
    }
    return provider
  }

  hasProvider(identifier: string): boolean {
    return this.providers_.has(identifier)
  }

  listProviderIdentifiers(): string[] {
    return [...this.providers_.keys()]
  }
}
