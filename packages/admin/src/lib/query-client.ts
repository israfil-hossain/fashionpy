import { ClientError } from "@mercurjs/client"
import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 90000,
      retry: (failureCount, error) =>
        error instanceof ClientError && error.status === 404
          ? false
          : failureCount < 1,
    },
  },
})
