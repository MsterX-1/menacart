import { apiClient } from '../../../api/client';
import type { 
  SellerResponse, 
  SellerProfile, 
  SellerDocument, 
  UpdateSellerStatusRequest, 
  ReviewSellerDocumentRequest 
} from '../../../types/seller';

export interface AdminSellersListResponse {
  items: SellerResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export const adminGetSellers = async (
  status?: string | null,
  page = 1,
  pageSize = 20
): Promise<AdminSellersListResponse> => {
  const response = await apiClient.get<AdminSellersListResponse>('/admin/sellers', {
    params: { status, page, pageSize },
  });
  return response.data;
};

export const adminUpdateSellerStatus = async (
  sellerId: number,
  data: UpdateSellerStatusRequest
): Promise<SellerProfile> => {
  const response = await apiClient.patch<SellerProfile>(`/admin/sellers/${sellerId}/status`, data);
  return response.data;
};

export const adminBanSeller = async (
  sellerId: number,
  reason: string
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(`/admin/sellers/${sellerId}/ban`, { reason });
  return response.data;
};

export const adminWarnSeller = async (
  sellerId: number,
  warningMessage: string
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(`/admin/sellers/${sellerId}/warning`, { warningMessage });
  return response.data;
};

// Documents operations
export const adminGetSellerDocuments = async (sellerId: number): Promise<SellerDocument[]> => {
  const response = await apiClient.get<SellerDocument[]>(`/seller/documents/admin/${sellerId}`);
  return response.data;
};

export const adminReviewSellerDocument = async (
  documentId: number,
  data: ReviewSellerDocumentRequest
): Promise<SellerDocument> => {
  const response = await apiClient.patch<SellerDocument>(`/seller/documents/admin/${documentId}/review`, data);
  return response.data;
};

export const adminGetSellerProfile = async (sellerId: number): Promise<SellerProfile> => {
  const response = await apiClient.get<SellerProfile>(`/seller/profile/${sellerId}`);
  return response.data;
};
