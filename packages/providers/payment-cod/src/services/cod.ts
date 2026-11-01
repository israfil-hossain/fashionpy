import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  CreateAccountHolderInput,
  CreateAccountHolderOutput,
  DeleteAccountHolderInput,
  DeleteAccountHolderOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrieveAccountHolderInput,
  RetrieveAccountHolderOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import {
  AbstractPaymentProvider,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"

/**
 * Cash-on-Delivery payment provider.
 *
 * Semantically identical to the built-in manual/system provider — no money
 * moves online — but registered under its own id (`pp_cod`) so:
 *  - the storefront can label the option "Cash on Delivery"
 *  - courier booking can detect COD orders and collect cash from the rider
 *    on the platform account (keeping commission flow automatic)
 *
 * Region admins enable it under Settings → Regions → Payment providers.
 */
export class CodPaymentProvider extends AbstractPaymentProvider {
  static identifier = "cod"

  // AbstractPaymentProvider's constructor is protected — a public one is
  // required to pass the class into ModuleProvider({ services }).
  constructor(container: unknown, options: Record<string, unknown> = {}) {
    // @ts-expect-error — base ctor signature varies across Medusa versions
    super(container, options)
  }

  async getStatus(_: any): Promise<string> {
    return "authorized"
  }

  async getPaymentData(_: any): Promise<Record<string, unknown>> {
    return {}
  }

  async initiatePayment(_input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    return { data: {}, id: crypto.randomUUID() }
  }

  async getPaymentStatus(_input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    return { status: PaymentSessionStatus.AUTHORIZED }
  }

  async retrievePayment(_input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return {}
  }

  async authorizePayment(_input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    return { data: {}, status: PaymentSessionStatus.AUTHORIZED }
  }

  async updatePayment(_input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: {} }
  }

  async deletePayment(_input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: {} }
  }

  async capturePayment(_input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    // Cash is collected by the courier on delivery — nothing to capture online.
    return { data: {} }
  }

  async retrieveAccountHolder(
    input: RetrieveAccountHolderInput
  ): Promise<RetrieveAccountHolderOutput> {
    return { id: input.id }
  }

  async createAccountHolder(
    input: CreateAccountHolderInput
  ): Promise<CreateAccountHolderOutput> {
    return { id: (input as any).context.customer.id }
  }

  async deleteAccountHolder(
    _input: DeleteAccountHolderInput
  ): Promise<DeleteAccountHolderOutput> {
    return { data: {} }
  }

  async refundPayment(_input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    // COD refunds are cash returns handled outside the platform.
    return { data: {} }
  }

  async cancelPayment(_input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: {} }
  }

  async getWebhookActionAndData(
    _data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return { action: PaymentActions.NOT_SUPPORTED }
  }
}

export default CodPaymentProvider
