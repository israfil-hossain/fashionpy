import {
  EmitEvents,
  InjectManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils"
import { Context, DAL } from "@medusajs/framework/types"
import { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import {
  CourierAccountStatus,
  CourierModuleOptions,
  CourierRateQuote,
  CourierShipmentDTO,
  CourierShipmentStatus,
  CourierWebhookResult,
  CreateCourierShipmentDTO,
  CreateCourierShipmentInput,
} from "@mercurjs/types"

import CourierProviderService from "./provider-service"
import { CourierAccount, CourierShipment } from "../models"

type InjectedDependencies = {
  courierProviderService: CourierProviderService
  baseRepository: DAL.RepositoryService
}

export default class CourierModuleService extends MedusaService({
  CourierAccount,
  CourierShipment,
}) {
  protected readonly courierProviderService_: CourierProviderService
  protected readonly baseRepository_: DAL.RepositoryService
  protected readonly options_: CourierModuleOptions

  constructor(
    {
      courierProviderService,
      baseRepository,
    }: InjectedDependencies,
    options: CourierModuleOptions
  ) {
    // @ts-ignore
    super(...arguments)
    this.courierProviderService_ = courierProviderService
    this.baseRepository_ = baseRepository
    this.options_ = options ?? {}
  }

  getOptions(): CourierModuleOptions {
    return this.options_ ?? {}
  }

  /**
   * Round-trip the seller-entered credentials against the courier API
   * (Pathao: issue-token, Steadfast: balance check). Pure dispatch — no rows
   * are written; the caller persists the result.
   */
  @InjectManager()
  async validateAccountCredentials(
    input: { provider: string; data: Record<string, unknown> },
    @MedusaContext() _sharedContext?: Context<EntityManager>
  ) {
    const provider = this.courierProviderService_.getProvider(input.provider)
    return await provider.validateAccount({ data: input.data })
  }

  /**
   * Resolve credentials, book the consignment at the courier, and persist the
   * courier_shipment row.
   *
   * COD rule (commission integrity): cash-on-delivery shipments are always
   * booked with the platform's courier credentials so the rider remits to the
   * platform and the normal split → commission → payout flow applies. Prepaid
   * shipments book on the seller's own account.
   */
  @InjectManager()
  @EmitEvents()
  async bookShipment(
    input: CreateCourierShipmentDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<CourierShipmentDTO> {
    const providerName = input.provider
    // Fails fast with a clear message for unregistered providers
    this.courierProviderService_.getProvider(providerName)

    const isCod = !!input.cod_amount && input.cod_amount > 0
    const credentials = await this.resolveCredentials_(
      providerName,
      input.seller_id,
      isCod,
      sharedContext
    )

    const providerInput: CreateCourierShipmentInput = {
      data: credentials,
      order_id: input.order_id,
      fulfillment_id: input.fulfillment_id,
      recipient: {
        name: input.recipient_name,
        phone: input.recipient_phone,
        secondary_phone: input.recipient_secondary_phone,
        email: input.recipient_email,
        address: input.recipient_address,
        city: input.recipient_city,
        postal_code: input.recipient_postal_code,
        country_code: input.recipient_country_code,
      },
      weight: input.weight,
      item_count: input.item_count,
      item_description: input.item_description,
      special_instruction: input.special_instruction,
      cod_amount: input.cod_amount,
      currency_code: input.currency_code,
      delivery_type: input.delivery_type,
    }

    const result = await this.courierProviderService_
      .getProvider(providerName)
      .createShipment(providerInput)

    const shipment = await this.createCourierShipments(
      {
        provider: providerName,
        consignment_id: result.consignment_id,
        tracking_code: result.tracking_code ?? null,
        tracking_url: result.tracking_url ?? null,
        status: result.status ?? CourierShipmentStatus.PENDING,
        order_id: input.order_id,
        fulfillment_id: input.fulfillment_id,
        cod_amount: isCod ? input.cod_amount : null,
        delivery_fee: result.delivery_fee ?? null,
        currency_code: input.currency_code,
        data: result.raw ?? null,
      },
      sharedContext
    )

    return await this.baseRepository_.serialize<CourierShipmentDTO>(shipment)
  }

  @InjectManager()
  protected async resolveCredentials_(
    provider: string,
    sellerId: string | undefined,
    isCod: boolean,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<Record<string, unknown>> {
    if (provider === "system") {
      return {}
    }

    if (isCod) {
      // The platform account saved via Admin → Settings → Courier wins; env
      // credentials (PATHAO_* / STEADFAST_*) are the fallback.
      const accounts = await this.listCourierAccounts(
        { provider, status: CourierAccountStatus.ACTIVE },
        {},
        sharedContext
      )
      const platformRow = accounts.find((a) => !a.seller_id)
      if (platformRow) {
        return platformRow.data as Record<string, unknown>
      }

      const envPlatform = (
        this.options_.platform as Record<string, Record<string, unknown>>
      )?.[provider]
      if (envPlatform) {
        return envPlatform
      }

      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `COD shipments require platform ${provider} credentials — add them ` +
          `in Admin → Settings → Courier (or set ` +
          `${provider === "pathao" ? "PATHAO_*" : "STEADFAST_*"} env vars).`
      )
    }

    const accounts = await this.listCourierAccounts(
      {
        provider,
        seller_id: sellerId ?? "",
        status: CourierAccountStatus.ACTIVE,
      },
      { take: 1 },
      sharedContext
    )

    const account = accounts[0]
    if (!account) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        sellerId
          ? `Seller has no active "${provider}" courier account. Connect one in Settings → Courier first.`
          : `No active "${provider}" courier account found for this shipment.`
      )
    }

    return account.data as Record<string, unknown>
  }

  /**
   * Best-effort live rate for a seller's courier account. Returns null when
   * the provider has no rate API (Steadfast), the seller has no active
   * account, or the destination can't be quoted — callers keep the flat price.
   */
  async getRatesForSeller(input: {
    provider: string
    seller_id: string
    recipient: {
      name: string
      phone: string
      address: string
      city?: string
      postal_code?: string
      country_code?: string
    }
    weight: number
    item_count?: number
    cod_amount?: number
  }): Promise<CourierRateQuote | null> {
    if (!this.courierProviderService_.hasProvider(input.provider)) {
      return null
    }

    const accounts = await this.listCourierAccounts(
      {
        provider: input.provider,
        seller_id: input.seller_id,
        status: CourierAccountStatus.ACTIVE,
      },
      { take: 1 }
    )
    const account = accounts[0]
    if (!account) {
      return null
    }

    try {
      return await this.courierProviderService_
        .getProvider(input.provider)
        .getRates({
          data: account.data as Record<string, unknown>,
          recipient: input.recipient,
          weight: input.weight,
          item_count: input.item_count,
          cod_amount: input.cod_amount,
        })
    } catch {
      return null
    }
  }

  /**
   * Cancel the courier consignment attached to a fulfillment (called when a
   * vendor cancels the fulfillment). The consignment is cancelled at the
   * COURIER first (Pathao/system via API; Steadfast has no cancel endpoint
   * and returns a message telling the vendor to use its panel). The local
   * shipment is only marked canceled when the courier accepted — a failed
   * provider cancel keeps courier and platform in sync and the caller
   * surfaces the message as a 400.
   *
   * Returns { canceled: false, message } when the consignment could not be
   * cancelled remotely; { canceled: true } otherwise.
   */
  @InjectManager()
  async cancelBookedShipment(
    input: { seller_id?: string; fulfillment_id: string },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<{ canceled: boolean; message?: string }> {
    const shipments = await this.listCourierShipments(
      { fulfillment_id: input.fulfillment_id },
      { take: 1 },
      sharedContext
    )
    const shipment = shipments[0]
    if (!shipment) {
      return { canceled: false }
    }

    const isCod = !!shipment.cod_amount && Number(shipment.cod_amount) > 0
    let providerCanceled = false
    let message: string | undefined
    try {
      const credentials = await this.resolveCredentials_(
        shipment.provider,
        input.seller_id,
        isCod,
        sharedContext
      )
      const provider = this.courierProviderService_.getProvider(
        shipment.provider
      )
      if (!provider.cancelShipment) {
        message = `Provider "${shipment.provider}" has no cancel API — cancel the consignment in the courier panel first.`
      } else {
        await provider.cancelShipment({
          data: credentials,
          consignment_id: shipment.consignment_id,
          order_id: shipment.order_id,
        })
        providerCanceled = true
      }
    } catch (error) {
      message =
        error instanceof Error ? error.message : String(error)
    }

    // Only mirror the cancel locally when the COURIER accepted it — a failed
    // provider cancel means the parcel is still out; the row must keep
    // reflecting courier reality (and the caller gets a 400 telling the
    // vendor to cancel in the courier panel first).
    if (providerCanceled) {
      await this.updateCourierShipments(
        {
          id: shipment.id,
          status: CourierShipmentStatus.CANCELED,
          data: {
            ...(shipment.data ?? {}),
            provider_canceled: true,
          },
        } as any,
        sharedContext
      )
    }

    return { canceled: providerCanceled, message }
  }

  /**
   * Parse a courier webhook payload into a canonical status event.
   */
  async getWebhookEvent(
    provider: string,
    payload: {
      data: Record<string, unknown>
      rawData: string | Buffer
      headers: Record<string, string>
    }
  ): Promise<CourierWebhookResult> {
    const providerInstance =
      this.courierProviderService_.getProvider(provider)
    return await providerInstance.getWebhookActionAndData({
      data: payload.data,
      rawData: payload.rawData,
      headers: payload.headers,
    })
  }
}
