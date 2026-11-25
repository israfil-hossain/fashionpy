const mockRun = jest.fn()

jest.mock("@medusajs/core-flows", () => ({
  updateStoresWorkflow: jest.fn(() => ({ run: mockRun })),
}))

import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import handler, { config } from "../stock-location-deleted"

const locationId = "sloc_deleted"

const makeContainer = (stores: Record<string, unknown>[]) => ({
  resolve: jest.fn((key: string) => {
    if (key === ContainerRegistrationKeys.QUERY) {
      return { graph: jest.fn().mockResolvedValue({ data: stores }) }
    }
    if (key === ContainerRegistrationKeys.LOGGER) {
      return { info: jest.fn() }
    }
    throw new Error(`Unexpected registration: ${key}`)
  }),
})

describe("stockLocationDeletedHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("subscribes to the stock location deletion event", () => {
    expect(config.event).toBe("stock_location.stock-location.deleted")
  })

  test("clears the default location of stores that reference the deleted one", async () => {
    const container = makeContainer([
      { id: "store_1", default_location_id: locationId },
      { id: "store_2", default_location_id: "sloc_kept" },
    ])

    await handler({
      event: { data: { id: locationId } },
      container,
    } as never)

    expect(mockRun).toHaveBeenCalledWith({
      input: {
        selector: { id: ["store_1"] },
        update: { default_location_id: null },
      },
    })
  })

  test("does nothing when no store references the deleted location", async () => {
    const container = makeContainer([
      { id: "store_1", default_location_id: "sloc_kept" },
    ])

    await handler({
      event: { data: { id: locationId } },
      container,
    } as never)

    expect(mockRun).not.toHaveBeenCalled()
  })
})
