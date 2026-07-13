import { useQuery } from '@tanstack/react-query';
import { getAdminTransactions, getAdminTransactionDetails } from '../api/adminTransactionApi';

export const adminTransactionKeys = {
  all: ['admin', 'transactions'] as const,
  list: (page: number, pageSize: number) => [...adminTransactionKeys.all, page, pageSize] as const,
};

export const useAdminTransactions = (page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: adminTransactionKeys.list(page, pageSize),
    queryFn: () => getAdminTransactions(page, pageSize),
  });
};

export const useAdminTransactionDetails = (orderId: number | null) => {
  return useQuery({
    queryKey: [...adminTransactionKeys.all, 'detail', orderId],
    queryFn: () => getAdminTransactionDetails(orderId!),
    enabled: orderId !== null,
  });
};
