export default function medusaError(error: any): never {
  if (error.response) {
    const u = new URL(error.config.url, error.config.baseURL)
    console.error("Resource:", u.toString())
    console.error("Response data:", error.response.data)
    console.error("Status code:", error.response.status)
    console.error("Headers:", error.response.headers)

    const data = error.response.data
    const raw =
      typeof data === "string"
        ? data
        : typeof data?.message === "string"
        ? data.message
        : typeof data?.message === "object" && typeof data.message.message === "string"
        ? data.message.message
        : "The request could not be completed"

    throw new Error(raw.charAt(0).toUpperCase() + raw.slice(1) + ".")
  } else if (error.request) {
    throw new Error("No response received: " + error.request)
  } else {
    throw new Error("Error setting up the request: " + error.message)
  }
}
