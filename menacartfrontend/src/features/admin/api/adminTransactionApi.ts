import { apiClient } from '../../../api/client';
import type { AdminTransactionsPagedResponseDto, AdminTransactionDetailDto } from '../../../types/admin';

export const getAdminTransactions = async (page: number = 1, pageSize: number = 20): Promise<AdminTransactionsPagedResponseDto> => {
  const response = await apiClient.get<AdminTransactionsPagedResponseDto>('/admin/transactions', {
    params: { page, pageSize }
  });
  return response.data;
};

export const getAdminTransactionDetails = async (orderId: number): Promise<AdminTransactionDetailDto> => {
  const response = await apiClient.get<AdminTransactionDetailDto>(`/admin/transactions/${orderId}`);
  return response.data;
};
