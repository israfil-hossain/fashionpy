import {
  canTransition,
  IDLE_STATE,
  resetCheckout,
  transition,
} from "../state"

describe("chatbot checkout state machine", () => {
  test("starts idle", () => {
    expect(IDLE_STATE.phase).toBe("idle")
    expect(resetCheckout().phase).toBe("idle")
  })

  test("happy path idle → cart → address → shipping → payment → review → placed", () => {
    let s = IDLE_STATE
    s = transition(s, "cart", { cart_id: "cart_1" })
    expect(s.phase).toBe("cart")
    s = transition(s, "address", { address_id: "addr_1" })
    expect(s.phase).toBe("address")
    s = transition(s, "shipping", { shipping_method_id: "opt_1" })
    expect(s.phase).toBe("shipping")
    s = transition(s, "payment", { payment_provider_id: "pp_cod" })
    expect(s.phase).toBe("payment")
    expect(s.payment_provider_id).toBe("pp_cod")
    s = transition(s, "review")
    expect(s.phase).toBe("review")
    s = transition(s, "placed", { order_group_id: "og_1", confirmed: true })
    expect(s.phase).toBe("placed")
    expect(s.order_group_id).toBe("og_1")
  })

  test("rejects skipping confirmation phases", () => {
    expect(canTransition("idle", "placed")).toBe(false)
    expect(canTransition("cart", "review")).toBe(false)
    expect(canTransition("cart", "placed")).toBe(false)
    expect(() => transition(IDLE_STATE, "placed")).toThrow(
      "Invalid checkout transition idle → placed"
    )
  })

  test("allows abandoning back to idle from mid-flow", () => {
    const cart = transition(IDLE_STATE, "cart", { cart_id: "c" })
    expect(canTransition("cart", "idle")).toBe(true)
    const back = transition(cart, "idle")
    expect(back.phase).toBe("idle")
  })
})
