import {
  resolveReadTargets,
  resolveRecipientCounterField,
} from "../service"
import { buildThreadKey, resolveRecipientId } from "../types/mutations"

/**
 * The three conversation types route unread counters, read targets and SSE
 * recipients differently. These tests exercise the real helpers the service
 * uses inside createMessageAtomic / markMessagesReadAtomic.
 */
describe("three-type unread counter routing", () => {
  describe("resolveRecipientCounterField (who gets bumped when a message lands)", () => {
    it("marketplace: customer messages bump the seller counter", () => {
      expect(resolveRecipientCounterField("marketplace", "customer")).toBe(
        "unread_count_seller"
      )
    })

    it("marketplace: seller messages bump the customer counter", () => {
      expect(resolveRecipientCounterField("marketplace", "seller")).toBe(
        "unread_count_customer"
      )
    })

    it("support_customer: customer messages bump the shared admin counter", () => {
      expect(resolveRecipientCounterField("support_customer", "customer")).toBe(
        "unread_count_admin"
      )
    })

    it("support_vendor: seller messages bump the shared admin counter", () => {
      expect(resolveRecipientCounterField("support_vendor", "seller")).toBe(
        "unread_count_admin"
      )
    })

    it("support_customer: admin replies bump the customer counter", () => {
      expect(resolveRecipientCounterField("support_customer", "admin")).toBe(
        "unread_count_customer"
      )
    })

    it("support_vendor: admin replies bump the seller counter", () => {
      expect(resolveRecipientCounterField("support_vendor", "admin")).toBe(
        "unread_count_seller"
      )
    })
  })

  describe("resolveReadTargets (which messages a reader marks read)", () => {
    it("admin reading a support thread marks both human sides and clears the admin counter", () => {
      expect(resolveReadTargets("support_customer", "admin")).toEqual({
        senderTypesToMark: ["customer", "seller"],
        counterField: "unread_count_admin",
      })
      expect(resolveReadTargets("support_vendor", "admin")).toEqual({
        senderTypesToMark: ["customer", "seller"],
        counterField: "unread_count_admin",
      })
    })

    it("customer in a support thread only marks admin messages", () => {
      expect(resolveReadTargets("support_customer", "customer")).toEqual({
        senderTypesToMark: ["admin"],
        counterField: "unread_count_customer",
      })
    })

    it("customer in a marketplace thread marks seller messages (unchanged behavior)", () => {
      expect(resolveReadTargets("marketplace", "customer")).toEqual({
        senderTypesToMark: ["seller"],
        counterField: "unread_count_customer",
      })
    })

    it("seller in a support thread only marks admin messages", () => {
      expect(resolveReadTargets("support_vendor", "seller")).toEqual({
        senderTypesToMark: ["admin"],
        counterField: "unread_count_seller",
      })
    })

    it("seller in a marketplace thread marks customer messages (unchanged behavior)", () => {
      expect(resolveReadTargets("marketplace", "seller")).toEqual({
        senderTypesToMark: ["customer"],
        counterField: "unread_count_seller",
      })
    })
  })
})

describe("thread keys", () => {
  it("builds one key per pair/type so find-or-create is race-safe", () => {
    expect(
      buildThreadKey("marketplace", {
        buyer_id: "cus_1",
        seller_id: "sel_1",
      })
    ).toBe("mk:cus_1:sel_1")
    expect(buildThreadKey("support_customer", { buyer_id: "cus_1" })).toBe(
      "sc:cus_1"
    )
    expect(buildThreadKey("support_vendor", { seller_id: "sel_1" })).toBe(
      "sv:sel_1"
    )
  })

  it("keys differ across types for the same participants", () => {
    const marketplace = buildThreadKey("marketplace", {
      buyer_id: "cus_1",
      seller_id: "sel_1",
    })
    const support = buildThreadKey("support_customer", { buyer_id: "cus_1" })
    expect(marketplace).not.toBe(support)
  })
})

describe("SSE recipient routing", () => {
  const ids = { buyer_id: "cus_1", seller_id: "sel_1" }

  it("marketplace threads address the opposite participant", () => {
    expect(resolveRecipientId("marketplace", "customer", ids)).toBe("sel_1")
    expect(resolveRecipientId("marketplace", "seller", ids)).toBe("cus_1")
  })

  it("human messages in support threads route to the shared admin channel", () => {
    expect(resolveRecipientId("support_customer", "customer", ids)).toBe(
      "admin"
    )
    expect(resolveRecipientId("support_vendor", "seller", ids)).toBe("admin")
  })

  it("admin replies route to the human side of the thread", () => {
    expect(resolveRecipientId("support_customer", "admin", ids)).toBe("cus_1")
    expect(resolveRecipientId("support_vendor", "admin", ids)).toBe("sel_1")
  })

  it("support threads without a buyer/seller fall back to the admin channel", () => {
    expect(
      resolveRecipientId("support_customer", "admin", {
        buyer_id: null,
        seller_id: null,
      })
    ).toBe("admin")
  })
})
