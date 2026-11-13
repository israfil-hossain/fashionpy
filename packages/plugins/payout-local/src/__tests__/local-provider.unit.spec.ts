import { MercurModules, PayoutAccountStatus, PayoutStatus } from "@mercurjs/types"

import providerModule, { LocalPayoutProvider, isCompletePayoutDetails } from "../providers/local"

const provider = (options: Record<string, unknown> = {}) =>
  new LocalPayoutProvider({}, options)

const accountRef = (data: Record<string, unknown> = {}) => ({
  id: "pacc_1",
  data,
})

const bankDetails = {
  payout_method: "bank",
  holder_name: "Rahim Uddin",
  account_number: "1234567890",
}

describe("LocalPayoutProvider", () => {
  describe("account lifecycle", () => {
    it("creates a pending account that waits for payout details", async () => {
      const account = await provider().createAccount({})

      expect(account.status).toBe(PayoutAccountStatus.PENDING)
      expect(account.payouts_enabled).toBe(false)
      expect(account.details_submitted).toBe(false)
      expect(account.requirements.currently_due).toEqual(["payout_details"])
    })

    it("stays pending until the details are complete", async () => {
      const incomplete = await provider().retrieveAccount({
        account: accountRef({ payout_details: { holder_name: "Rahim" } }),
      })
      expect(incomplete.status).toBe(PayoutAccountStatus.PENDING)
      expect(incomplete.payouts_enabled).toBe(false)
      expect(incomplete.requirements.currently_due).toEqual(["payout_details"])
    })

    it("activates for complete bank details", async () => {
      const account = await provider().retrieveAccount({
        account: accountRef({ payout_details: bankDetails }),
      })

      expect(account.status).toBe(PayoutAccountStatus.ACTIVE)
      expect(account.payouts_enabled).toBe(true)
      expect(account.details_submitted).toBe(true)
      expect(account.requirements.currently_due).toEqual([])
    })

    it("activates for bKash and Nagad wallets with a wallet number", async () => {
      for (const method of ["bkash", "nagad"]) {
        const account = await provider().retrieveAccount({
          account: accountRef({
            payout_details: {
              payout_method: method,
              holder_name: "Rahim Uddin",
              wallet_number: "01700000000",
            },
          }),
        })
        expect(account.payouts_enabled).toBe(true)
      }

      const missingWallet = await provider().retrieveAccount({
        account: accountRef({
          payout_details: { payout_method: "bkash", holder_name: "Rahim" },
        }),
      })
      expect(missingWallet.payouts_enabled).toBe(false)
    })
  })

  describe("onboarding links", () => {
    it("opens the vendor payout details form, never a fake provider URL", async () => {
      const local = provider({ vendorUrl: "https://vendor.example.com/" })

      const onboarding = await local.createOnboarding({
        account: accountRef(),
        refresh_url: "http://x/refresh",
        return_url: "http://x/return",
      })
      expect(onboarding.url).toBe(
        "https://vendor.example.com/settings/store/payment-details"
      )

      const login = await local.createLoginLink({ account: accountRef() })
      expect(login.url).toBe(
        "https://vendor.example.com/settings/store/payment-details"
      )
    })
  })

  describe("payouts", () => {
    it("records a manual transfer instruction with the destination", async () => {
      const payout = await provider().createPayout({
        account: accountRef({ payout_details: bankDetails }),
        amount: 162,
        currency_code: "bdt",
      })

      expect(payout.status).toBe(PayoutStatus.PROCESSING)
      expect(payout.id).toMatch(/^local_/)
      expect(payout.data.mode).toBe("manual")
      expect(payout.data.destination).toMatchObject({
        payout_method: "bank",
        holder_name: "Rahim Uddin",
        account_number: "1234567890",
      })
    })

    it("refuses to prepare a payout without a usable destination", async () => {
      await expect(
        provider().createPayout({
          account: accountRef({}),
          amount: 100,
          currency_code: "bdt",
        })
      ).rejects.toThrow(/payout details are incomplete/)
    })

    it("records a clawback instruction for a reversal", async () => {
      const reversal = await provider().reversePayout({
        payout: { id: "local_1", data: {} },
        amount: 50,
        currency_code: "bdt",
      })

      expect(reversal.status).toBe(PayoutStatus.PROCESSING)
      expect(reversal.id).toMatch(/^localrev_/)
      expect(reversal.data.mode).toBe("manual_clawback")
    })

    it("has no webhook surface", async () => {
      const result = await provider().getWebhookActionAndData({
        data: {},
        rawData: "",
        headers: {},
      })
      expect(result.action).toBe("not_supported")
    })
  })

  describe("isCompletePayoutDetails", () => {
    it("requires an account name plus the method's destination", () => {
      expect(isCompletePayoutDetails(null)).toBe(false)
      expect(isCompletePayoutDetails({ holder_name: "R" })).toBe(false)
      expect(isCompletePayoutDetails({ holder_name: "R", account_number: "1" })).toBe(true)
      expect(
        isCompletePayoutDetails({
          payout_method: "bkash",
          holder_name: "R",
          account_number: "1",
        })
      ).toBe(false)
      expect(
        isCompletePayoutDetails({
          payout_method: "nagad",
          holder_name: "R",
          wallet_number: "01700000000",
        })
      ).toBe(true)
    })
  })
})

// The config resolves `@mercurjs/payout-local/providers/local`, and Medusa's
// provider loader iterates `.services` on whatever that file default-exports.
// A plain namespace object instead throws `{} is not iterable` and the API
// crash-loops, so the export shape is the contract that keeps boot alive.
describe("provider module export", () => {
  it("default-exports the ModuleProvider definition Medusa iterates at boot", () => {
    expect(providerModule.module).toBe(MercurModules.PAYOUT)
    expect(providerModule.services).toEqual([LocalPayoutProvider])
  })
})
