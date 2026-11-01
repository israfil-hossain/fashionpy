import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ api }) => {
    describe("Store - Google auth", () => {
      it("initiates Google OAuth for customers and returns the consent redirect", async () => {
        const response = await api.get(`/auth/customer/google`)

        expect(response.status).toEqual(200)
        expect(response.data.location).toContain(
          "https://accounts.google.com/o/oauth2/v2/auth"
        )
        expect(response.data.location).toContain(
          "client_id=test-google-client-id"
        )
        expect(response.data.location).toContain(
          encodeURIComponent("http://localhost:3000/api/auth/google/callback")
        )
      })

      it("rejects Google auth for the admin user actor type", async () => {
        const response = await api.get(`/auth/user/google`).catch((e) => e.response)

        expect(response.status).toEqual(400)
        expect(response.data.message).toContain(
          "The actor type user is not allowed to use the auth provider google"
        )
      })

      it("rejects Google auth for the vendor member actor type", async () => {
        const response = await api.get(`/auth/member/google`).catch((e) => e.response)

        expect(response.status).toEqual(400)
        expect(response.data.message).toContain(
          "The actor type member is not allowed to use the auth provider google"
        )
      })
    })
  },
})
