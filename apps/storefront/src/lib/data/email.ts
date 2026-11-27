'use server'

import { sdk } from '../client'
import { getAuthHeaders } from './cookies'

export const unsubscribeEmail = async (
  token: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const store = sdk.store as unknown as {
      email: {
        unsubscribe: {
          mutate: (input: {
            token: string
            fetchOptions: { headers: Record<string, string> }
          }) => Promise<{ success: boolean }>
        }
      }
    }
    const result = await store.email.unsubscribe.mutate({
      token,
      fetchOptions: { headers: await getAuthHeaders() },
    })
    return { success: result.success }
  } catch (error) {
    return { success: false, error: (error as Error)?.message }
  }
}
