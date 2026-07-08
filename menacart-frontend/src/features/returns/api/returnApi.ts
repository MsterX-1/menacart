import { apiClient } from '../../../api/client';
import type { ReturnResponse, CreateReturnRequest, UpdateReturnStatusRequest } from '../../../types/return';

// Buyer endpoints
export const createReturn = async (data: CreateReturnRequest): Promise<ReturnResponse> => {
  const response = await apiClient.post<ReturnResponse>('/returns', data);
  return response.data;
};

export const getMyReturns = async (page = 1, pageSize = 20): Promise<ReturnResponse[]> => {
  const response = await apiClient.get<ReturnResponse[]>('/returns/my', {
    params: { page, pageSize },
  });
  return response.data;
};

// Seller endpoints
export const getSellerReturns = async (page = 1, pageSize = 20): Promise<ReturnResponse[]> => {
  const response = await apiClient.get<ReturnResponse[]>('/seller/returns', {
    params: { page, pageSize },
  });
  return response.data;
};

export const updateReturnStatus = async (
  returnId: number,
  data: UpdateReturnStatusRequest
): Promise<ReturnResponse> => {
  const response = await apiClient.patch<ReturnResponse>(`/seller/returns/${returnId}/status`, data);
  return response.data;
};
