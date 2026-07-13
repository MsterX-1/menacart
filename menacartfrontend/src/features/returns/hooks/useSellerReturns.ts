import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSellerReturns, updateReturnStatus } from '../api/returnApi';
import type { UpdateReturnStatusRequest } from '../../../types/return';

export const sellerReturnKeys = {
  all: ['seller-returns'] as const,
  lists: () => ['seller-returns', 'list'] as const,
  list: (page: number, pageSize: number) => ['seller-returns', 'list', { page, pageSize }] as const,
};

export const useSellerReturns = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: sellerReturnKeys.list(page, pageSize),
    queryFn: () => getSellerReturns(page, pageSize),
  });
};

export const useUpdateReturnStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ returnId, data }: { returnId: number; data: UpdateReturnStatusRequest }) =>
      updateReturnStatus(returnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerReturnKeys.all });
      // Invalidate normal returns too just in case
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      // Invalidate orders since seller status updates can affect orders
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
    },
  });
};
