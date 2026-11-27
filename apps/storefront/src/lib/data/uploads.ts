'use server'

import { sdk } from '../client'
import { getAuthHeaders } from './cookies'

type UploadResult = { files?: Array<{ id: string; url: string }> }

export const uploadCustomizationFile = async (
  file: File
): Promise<{ url: string } | { error: string }> => {
  try {
    const store = sdk.store as unknown as {
      uploads: {
        mutate: (input: {
          files: File[]
          fetchOptions: { headers: Record<string, string> }
        }) => Promise<UploadResult>
      }
    }

    const result = await store.uploads.mutate({
      files: [file],
      fetchOptions: { headers: await getAuthHeaders() },
    })
    const uploaded = result.files?.[0]
    if (!uploaded?.url) {
      return { error: "The upload did not return a file URL" }
    }
    return { url: uploaded.url }
  } catch (error) {
    return { error: (error as Error)?.message || "Upload failed" }
  }
}
