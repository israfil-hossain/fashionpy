import crypto from "crypto"

import { ModuleProvider } from "@medusajs/framework/utils"
import {
  AccountOutput,
  CreateAccountInput,
  CreateLoginLinkInput,
  CreateOnboardingInput,
  CreatePayoutInput,
  DeleteAccountInput,
  IPayoutProvider,
  LinkOutput,
  MercurModules,
  PayoutAccountStatus,
  PayoutOutput,
  PayoutProviderError,
  PayoutStatus,
  PayoutWebhookActionInput,
  PayoutWebhookResult,
  RetrieveAccountInput,
  ReversePayoutInput,
} from "@mercurjs/types"

export type LocalPayoutProviderOptions = {
  /** Vendor panel base URL — onboarding/login links open the payout details form. */
  vendorUrl?: string
  /** Path of the payout details form on the vendor panel. */
  detailsPath?: string
}

type PayoutDetails = {
  payout_method?: string | null
  holder_name?: string | null
  bank_name?: string | null
  account_number?: string | null
  wallet_number?: string | null
  iban?: string | null
  bic?: string | null
  routing_number?: string | null
  country_code?: string | null
}

const detailsOf = (data: Record<string, unknown> | null | undefined): PayoutDetails | null =>
  (data?.payout_details as PayoutDetails | undefined) ?? null

/**
 * A destination is usable when the account name is there plus the account
 * number for a bank payout or the wallet number for bKash/Nagad.
 */
export const isCompletePayoutDetails = (
  details: PayoutDetails | null
): details is PayoutDetails => {
  if (!details?.holder_name) {
    return false
  }
  const method = details.payout_method ?? "bank"
  if (method === "bank") {
    return !!details.account_number
  }
  return !!details.wallet_number
}

/**
 * Payout provider that moves no money itself: every payout becomes a manual
 * transfer instruction the operator executes from the platform account (bank
 * transfer or bKash/Nagad send-money) and then marks paid in the admin panel.
 *
 * Seller details live on the payout account (`data.payout_details`), written
 * by the payment-details sync workflow; an account activates once a usable
 * destination is stored.
 */
export class LocalPayoutProvider implements IPayoutProvider {
  static identifier = "local"
  static _isPayoutProvider = true

  protected readonly options_: LocalPayoutProviderOptions

  constructor(_cradle: Record<string, unknown>, options: LocalPayoutProviderOptions = {}) {
    this.options_ = options
  }

  protected detailsUrl_(): string {
    const base = (this.options_.vendorUrl ?? "http://localhost:7001").replace(/\/+$/, "")
    return `${base}${this.options_.detailsPath ?? "/settings/store/payment-details"}`
  }

  async createAccount(_input: CreateAccountInput): Promise<AccountOutput> {
    return {
      id: crypto.randomUUID(),
      status: PayoutAccountStatus.PENDING,
      payouts_enabled: false,
      charges_enabled: false,
      details_submitted: false,
      disabled_reason: null,
      requirements: {
        currently_due: ["payout_details"],
        past_due: [],
        pending_verification: [],
      },
      data: {},
    }
  }

  async retrieveAccount(input: RetrieveAccountInput): Promise<AccountOutput> {
    const details = detailsOf(input.account.data)
    const complete = isCompletePayoutDetails(details)

    return {
      id: input.account.id,
      status: complete ? PayoutAccountStatus.ACTIVE : PayoutAccountStatus.PENDING,
      payouts_enabled: complete,
      charges_enabled: complete,
      details_submitted: complete,
      disabled_reason: null,
      requirements: complete
        ? { currently_due: [], past_due: [], pending_verification: [] }
        : {
            currently_due: ["payout_details"],
            past_due: [],
            pending_verification: [],
          },
      data: input.account.data ?? {},
    }
  }

  async deleteAccount(_input: DeleteAccountInput): Promise<void> {
    // Local accounts are the payout account row itself; nothing to remove.
  }

  async createOnboarding(_input: CreateOnboardingInput): Promise<LinkOutput> {
    return { url: this.detailsUrl_(), data: { kind: "details" } }
  }

  async createLoginLink(_input: CreateLoginLinkInput): Promise<LinkOutput> {
    return { url: this.detailsUrl_(), data: { kind: "details" } }
  }

  async createPayout(input: CreatePayoutInput): Promise<PayoutOutput> {
    const details = detailsOf(input.account.data)
    if (!isCompletePayoutDetails(details)) {
      throw new PayoutProviderError(
        "The store's payout details are incomplete; the payout cannot be prepared"
      )
    }

    return {
      id: `local_${crypto.randomUUID()}`,
      status: PayoutStatus.PROCESSING,
      data: {
        mode: "manual",
        destination: {
          payout_method: details.payout_method ?? "bank",
          holder_name: details.holder_name ?? null,
          bank_name: details.bank_name ?? null,
          account_number: details.account_number ?? null,
          wallet_number: details.wallet_number ?? null,
          routing_number: details.routing_number ?? null,
        },
      },
    }
  }

  async reversePayout(_input: ReversePayoutInput): Promise<PayoutOutput> {
    // A clawback on a manual transfer: the operator collects it from the
    // store (or nets it against the next payout); the row records the debt.
    return {
      id: `localrev_${crypto.randomUUID()}`,
      status: PayoutStatus.PROCESSING,
      data: { mode: "manual_clawback" },
    }
  }

  async getWebhookActionAndData(_payload: PayoutWebhookActionInput): Promise<PayoutWebhookResult> {
    return { action: "not_supported" }
  }
}

// The package maps `./providers/local` to this file, so Medusa's provider
// loader reads the ModuleProvider definition from here — not from index.ts.
// Without this default export the loader iterates the module namespace and
// dies with `{} is not iterable` at boot.
export default ModuleProvider(MercurModules.PAYOUT, {
  services: [LocalPayoutProvider],
})
