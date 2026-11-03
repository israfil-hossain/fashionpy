export default function imagesConverter(images: string) {
  const isLocalhost =
    images.startsWith("http://localhost:9000") ||
    images.startsWith("https://localhost:9000")

  if (isLocalhost) {
    // Same-origin panels: the browser origin is the backend.
    const backend = typeof window !== "undefined" ? window.location.origin : ""
    return images
      .replace("http://localhost:9000", backend)
      .replace("https://localhost:9000", backend)
  }

  return images
}
