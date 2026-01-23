import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache data for 5 minutes
            staleTime: 5 * 60 * 1000,

            // Keep unused data in cache for 30 minutes
            gcTime: 30 * 60 * 1000,

            // Retry failed requests 2 times
            retry: 2,

            // Retry delay with exponential backoff
            retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Refetch on window focus (useful when app comes back from background)
            refetchOnWindowFocus: true,

            // Don't refetch on mount if data is fresh
            refetchOnMount: false,
        },
        mutations: {
            // Retry mutations once
            retry: 1,
        },
    },
});
