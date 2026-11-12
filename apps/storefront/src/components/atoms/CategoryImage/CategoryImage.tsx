"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

import { CATEGORY_IMAGE_FALLBACK } from "@/lib/helpers/category-image"

type CategoryImageProps = Omit<ImageProps, "src"> & {
  src: string
}

/**
 * `next/image` that degrades to the placeholder when either the admin media
 * URL or the static `/images/categories/{handle}.png` file is missing.
 */
export function CategoryImage({ src, ...props }: CategoryImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const resolvedSrc = failedSrc === src ? CATEGORY_IMAGE_FALLBACK : src

  return (
    <Image
      {...props}
      src={resolvedSrc}
      onError={() => setFailedSrc(src)}
    />
  )
}
