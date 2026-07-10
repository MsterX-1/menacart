import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyPayouts,
  getAvailableBalance,
  requestPayout,
  getAllPayouts,
  reviewPayout,
} from '../api/payoutsApi';
import type { RequestPayoutDto, ReviewPayoutDto } from '../../../types/payout';

export const payoutKeys = {
  all: ['payouts'] as const,
  my: () => ['payouts', 'my'] as const,
  balance: () => ['payouts', 'balance'] as const,
  admin: (status?: string) => ['payouts', 'admin', status || 'all'] as const,
};

export const useMyPayouts = () => {
  return useQuery({
    queryKey: payoutKeys.my(),
    queryFn: getMyPayouts,
  });
};

export const useAvailableBalance = () => {
  return useQuery({
    queryKey: payoutKeys.balance(),
    queryFn: getAvailableBalance,
  });
};

export const useRequestPayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RequestPayoutDto) => requestPayout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutKeys.my() });
      queryClient.invalidateQueries({ queryKey: payoutKeys.balance() });
    },
  });
};

export const useAdminPayouts = (status?: string) => {
  return useQuery({
    queryKey: payoutKeys.admin(status),
    queryFn: () => getAllPayouts(status),
  });
};

export const useReviewPayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payoutId, data }: { payoutId: number; data: ReviewPayoutDto }) =>
      reviewPayout(payoutId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutKeys.all });
    },
  });
};
