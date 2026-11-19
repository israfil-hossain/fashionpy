export type CheckoutPhase =
  | "idle"
  | "cart"
  | "address"
  | "shipping"
  | "payment"
  | "review"
  | "placed"

export interface CheckoutState {
  phase: CheckoutPhase
  cart_id?: string | null
  address_id?: string | null
  shipping_method_id?: string | null
  payment_provider_id?: string | null
  confirmed?: boolean
  order_group_id?: string | null
}

export const IDLE_STATE: CheckoutState = { phase: "idle" }

const TRANSITIONS: Record<CheckoutPhase, CheckoutPhase[]> = {
  idle: ["cart", "idle"],
  cart: ["address", "cart", "idle"],
  address: ["shipping", "address", "cart", "idle"],
  shipping: ["payment", "shipping", "address", "idle"],
  payment: ["review", "payment", "shipping", "idle"],
  review: ["placed", "payment", "idle"],
  placed: ["idle", "placed"],
}

export function canTransition(from: CheckoutPhase, to: CheckoutPhase): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function transition(state: CheckoutState, to: CheckoutPhase, patch: Partial<CheckoutState> = {}): CheckoutState {
  if (!canTransition(state.phase, to)) {
    throw new Error(`Invalid checkout transition ${state.phase} → ${to}`)
  }
  return { ...state, ...patch, phase: to }
}

export function resetCheckout(): CheckoutState {
  return { ...IDLE_STATE }
}
