import {
  createUnsubscribeToken,
  isOptedOut,
  verifyUnsubscribeToken,
} from "../../../packages/core/src/email/unsubscribe"
import { escapeHtml, cartReminderHtml } from "../../../packages/core/src/email/templates"

describe("email helpers", () => {
  test("escapes html in templates", () => {
    expect(escapeHtml('<b>"x"</b>')).toBe("&lt;b&gt;&quot;x&quot;&lt;/b&gt;")
  })

  test("unsubscribe tokens round trip and reject tampering", () => {
    const token = createUnsubscribeToken({
      customerId: "cus_1",
      kind: "cart_reminder",
    })
    expect(verifyUnsubscribeToken(token)).toEqual({
      customerId: "cus_1",
      kind: "cart_reminder",
    })
    expect(verifyUnsubscribeToken(`${token}tampered`)).toBeNull()
  })

  test("respects opt-out flags", () => {
    expect(isOptedOut({ email_opt_out: ["all"] }, "cart_reminder")).toBe(true)
    expect(
      isOptedOut({ email_opt_out: ["wishlist_reminder"] }, "cart_reminder")
    ).toBe(false)
    expect(isOptedOut({}, "cart_reminder")).toBe(false)
  })

  test("follow-up templates include an unsubscribe link", () => {
    const html = cartReminderHtml({
      items: [],
      unsubscribeUrl: "https://fashionpy.com/unsubscribe?token=abc",
    })
    expect(html).toContain("https://fashionpy.com/unsubscribe?token=abc")
  })
})
