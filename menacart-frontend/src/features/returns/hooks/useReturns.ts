import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createReturn, getMyReturns } from '../api/returnApi';
import type { CreateReturnRequest } from '../../../types/return';

export const returnKeys = {
  all: ['returns'] as const,
  lists: () => ['returns', 'list'] as const,
  list: (page: number, pageSize: number) => ['returns', 'list', { page, pageSize }] as const,
};

export const useMyReturns = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: returnKeys.list(page, pageSize),
    queryFn: () => getMyReturns(page, pageSize),
  });
};

export const useCreateReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReturnRequest) => createReturn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: returnKeys.all });
      // Also invalidate order details since an item return status has changed
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
