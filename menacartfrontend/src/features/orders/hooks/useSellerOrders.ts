import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSellerSubOrders, updateSubOrderStatus } from '../api/orderApi';
import type { UpdateSubOrderStatusRequest } from '../../../types/order';

export const sellerOrderKeys = {
  all: ['sellerSubOrders'] as const,
  lists: () => ['sellerSubOrders', 'list'] as const,
  list: (status?: string, page = 1, pageSize = 20) =>
    ['sellerSubOrders', 'list', { status, page, pageSize }] as const,
};

export const useSellerSubOrders = (status?: string, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: sellerOrderKeys.list(status, page, pageSize),
    queryFn: () => getSellerSubOrders(status, page, pageSize),
  });
};

export const useUpdateSubOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subOrderId,
      data,
    }: {
      subOrderId: number;
      data: UpdateSubOrderStatusRequest;
    }) => updateSubOrderStatus(subOrderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerOrderKeys.all });
    },
  });
};
