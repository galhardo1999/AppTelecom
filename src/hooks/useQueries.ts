import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { bffApi } from '../services/api';

/**
 * Hook to fetch open invoices with caching
 */
export function useInvoices() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['invoices', user?.id],
        queryFn: () => bffApi.getOpenInvoices(),
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to fetch all invoices history (open, paid, overdue)
 */
export function useInvoiceHistory() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['invoices-history', user?.id],
        queryFn: () => bffApi.getInvoiceHistory(),
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to fetch contracts with caching
 */
export function useContracts() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['contracts', user?.id],
        queryFn: () => bffApi.getClientContracts(),
        enabled: !!user?.id,
        staleTime: 10 * 60 * 1000, // 10 minutes (contracts change less often)
    });
}

/**
 * Hook to fetch internet usage with caching
 */
export function useInternetUsage() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['usage', user?.id],
        queryFn: () => bffApi.getInternetUsage(),
        enabled: !!user?.id,
        staleTime: 2 * 60 * 1000, // 2 minutes (usage changes often)
    });
}

/**
 * Hook to fetch user profile with caching
 */
export function useUserProfile() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['user', user?.id],
        queryFn: () => bffApi.getUser(),
        enabled: !!user?.id,
        staleTime: 15 * 60 * 1000, // 15 minutes
    });
}
