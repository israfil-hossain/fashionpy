import { createClient, InferClient, adminAuth } from '@mercurjs/client'
import { Routes } from '@mercurjs/core/_generated'

import { assetUrl } from '../../utils/asset-url'
import { clearAuthToken, getAuthHeaders } from './auth-token'
import { buildHttpErrorMessage } from './error-message'

declare const __BACKEND_URL__: string

// Prod panels are served same-origin with the API (admin.fashionpy.com), so
// the browser origin IS the backend. The vite dev server runs on a different
// port than the API, so localhost falls back to the __BACKEND_URL__ define.
const isBrowser = typeof window !== "undefined"
const hostname = isBrowser ? window.location.hostname : ""

export const backendUrl =
  isBrowser && hostname !== "localhost" && hostname !== "127.0.0.1"
    ? window.location.origin
    : __BACKEND_URL__

export const sdk: InferClient<Routes> = createClient({
  baseUrl: backendUrl,
  fetchOptions: {
    credentials: 'omit',
  },
  auth: adminAuth(),
})

export const fetchQuery = async (
  url: string,
  {
    method,
    body,
    query,
    headers,
  }: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: object
    query?: Record<string, string | number | object>
    headers?: { [key: string]: string }
  }
) => {
  const params = Object.entries(query || {}).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        const arrayParams = value
          .map(
            (item) =>
              `${encodeURIComponent(key)}[]=${encodeURIComponent(item)}`
          )
          .join('&')
        if (acc) {
          acc += '&' + arrayParams
        } else {
          acc = arrayParams
        }
      } else {
        const separator = acc ? '&' : ''
        const serializedValue =
          typeof value === 'object' ? JSON.stringify(value) : value
        acc += `${separator}${encodeURIComponent(key)}=${encodeURIComponent(serializedValue)}`
      }
    }
    return acc
  }, '')

  const response = await fetch(
    `${backendUrl}${url}${params ? `?${params}` : ''}`,
    {
      method,
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...(await getAuthHeaders()),
        ...headers,
      },
      body: body ? JSON.stringify(body) : null,
    }
  )

  if (!response.ok) {
    let errorData: { message?: string; type?: string; code?: string } = {}
    try {
      const text = await response.text()
      if (text) {
        try {
          errorData = JSON.parse(text)
        } catch {
          // HTML/plain error pages (Express 404, gateway errors) — never
          // embed the raw markup in a toast.
          errorData = { message: buildHttpErrorMessage(response.status, text) }
        }
      }
    } catch {
      // ignore body read failures
    }

    if (response.status === 401) {
      clearAuthToken()
      window.location.href = `${assetUrl('/login')}?reason=Unauthorized`
      return
    }

    const error = new Error(
      errorData.message ||
        `Request failed with status ${response.status}`
    )
    ;(error as Error & { status: number }).status = response.status
    throw error
  }

  return response.json()
}
