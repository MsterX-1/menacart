import { apiClient } from '../../../api/client';
import type { PayoutResponse, RequestPayoutDto, ReviewPayoutDto, AvailableBalanceResponse } from '../../../types/payout';

export const getMyPayouts = async (): Promise<PayoutResponse[]> => {
  const response = await apiClient.get<PayoutResponse[]>('/payouts/seller');
  return response.data;
};

export const getAvailableBalance = async (): Promise<AvailableBalanceResponse> => {
  const response = await apiClient.get<AvailableBalanceResponse>('/payouts/seller/balance');
  return response.data;
};

export const requestPayout = async (data: RequestPayoutDto): Promise<PayoutResponse> => {
  const response = await apiClient.post<PayoutResponse>('/payouts/seller', data);
  return response.data;
};

export const getAllPayouts = async (status?: string): Promise<PayoutResponse[]> => {
  const response = await apiClient.get<PayoutResponse[]>('/payouts/admin', {
    params: status ? { status } : undefined,
  });
  return response.data;
};

export const reviewPayout = async (
  payoutId: number,
  data: ReviewPayoutDto
): Promise<PayoutResponse> => {
  const response = await apiClient.patch<PayoutResponse>(`/payouts/admin/${payoutId}/review`, data);
  return response.data;
};
