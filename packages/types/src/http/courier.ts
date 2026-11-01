import { PaginatedResponse } from "@medusajs/types"
import { CourierAccountDTO, CourierShipmentDTO } from "../courier"

export interface VendorCourierAccountResponse {
  courier_account: Omit<CourierAccountDTO, "data">
}

export type VendorCourierAccountListResponse = PaginatedResponse<{
  courier_accounts: Omit<CourierAccountDTO, "data">[]
}>

export interface VendorCourierAccountDeleteResponse {
  id: string
  object: "courier_account"
  deleted: boolean
}

export interface VendorCourierShipmentResponse {
  shipment: CourierShipmentDTO | null
}

export interface AdminCourierAccountResponse {
  courier_account: Omit<CourierAccountDTO, "data">
  /**
   * Platform COD credentials present in env (PATHAO_* / STEADFAST_*) —
   * independent of any platform account row stored from the admin panel.
   */
  platform_env?: Record<string, boolean>
}

export type AdminCourierAccountListResponse = PaginatedResponse<{
  courier_accounts: (Omit<CourierAccountDTO, "data"> & {
    seller_name?: string | null
  })[]
  platform_env?: Record<string, boolean>
}>
