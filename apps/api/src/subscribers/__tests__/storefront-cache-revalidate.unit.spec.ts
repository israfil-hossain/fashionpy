jest.mock("@mercurjs/core/workflows", () => ({
  OfferWorkflowEvents: {
    CREATED: "offer.created",
    UPDATED: "offer.updated",
    DELETED: "offer.deleted",
  },
  ProductWorkflowEvents: {
    PUBLISHED: "product.published",
    REJECTED: "product.rejected",
  },
}))

import handler from "../storefront-cache-revalidate"

describe("storefront-cache-revalidate subscriber", () => {
  const originalUrl = process.env.STOREFRONT_REVALIDATE_URL
  const originalSecret = process.env.STOREFRONT_REVALIDATE_SECRET

  let fetchMock: jest.SpyInstance
  let warnMock: jest.SpyInstance
  let errorMock: jest.SpyInstance

  const run = (name = "store.updated") =>
    handler({
      event: { name, data: [{ id: "store_1" }] },
      container: {} as never,
      pluginOptions: {},
    })

  beforeEach(() => {
    fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
    } as unknown as Response)
    warnMock = jest.spyOn(console, "warn").mockImplementation(() => {})
    errorMock = jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    if (originalUrl === undefined) {
      delete process.env.STOREFRONT_REVALIDATE_URL
    } else {
      process.env.STOREFRONT_REVALIDATE_URL = originalUrl
    }
    if (originalSecret === undefined) {
      delete process.env.STOREFRONT_REVALIDATE_SECRET
    } else {
      process.env.STOREFRONT_REVALIDATE_SECRET = originalSecret
    }
  })

  it("warns once and skips the call when the revalidate env is missing", async () => {
    delete process.env.STOREFRONT_REVALIDATE_URL
    delete process.env.STOREFRONT_REVALIDATE_SECRET

    await run()
    await run()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(warnMock).toHaveBeenCalledTimes(1)
    expect(warnMock.mock.calls[0][0]).toContain("STOREFRONT_REVALIDATE_URL")
  })

  it("posts the store tag with the shared secret when configured", async () => {
    process.env.STOREFRONT_REVALIDATE_URL =
      "https://storefront.test/api/revalidate"
    process.env.STOREFRONT_REVALIDATE_SECRET = "s3cret"

    await run()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toEqual("https://storefront.test/api/revalidate")
    expect(init.method).toEqual("POST")
    expect(init.headers["x-revalidate-secret"]).toEqual("s3cret")
    expect(JSON.parse(init.body)).toEqual({ tags: ["store"] })
    expect(errorMock).not.toHaveBeenCalled()
  })

  it("logs an error when the storefront responds non-2xx", async () => {
    process.env.STOREFRONT_REVALIDATE_URL =
      "https://storefront.test/api/revalidate"
    process.env.STOREFRONT_REVALIDATE_SECRET = "s3cret"
    fetchMock.mockResolvedValue({ ok: false, status: 503 } as unknown as Response)

    await run()

    expect(errorMock).toHaveBeenCalledTimes(1)
    expect(String(errorMock.mock.calls[0][0])).toContain("503")
  })

  it("logs an error when the fetch itself fails", async () => {
    process.env.STOREFRONT_REVALIDATE_URL =
      "https://storefront.test/api/revalidate"
    process.env.STOREFRONT_REVALIDATE_SECRET = "s3cret"
    fetchMock.mockRejectedValue(new Error("connection refused"))

    await run()

    expect(errorMock).toHaveBeenCalledTimes(1)
    expect(String(errorMock.mock.calls[0][0])).toContain("revalidation failed")
  })
})
