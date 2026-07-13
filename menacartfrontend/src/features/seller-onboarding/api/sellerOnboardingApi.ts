import { apiClient } from '../../../api/client';
import type { SellerProfile, SellerDocument, ApplySellerRequest, PublicSellerListResponse, PublicSellerProfile } from '../../../types/seller';

export const applyAsSeller = async (data: ApplySellerRequest): Promise<SellerProfile> => {
  const response = await apiClient.post<SellerProfile>('/seller/apply', data);
  return response.data;
};

export const becomeInstantSeller = async (): Promise<SellerProfile> => {
  const response = await apiClient.post<SellerProfile>('/seller/instant-seller');
  return response.data;
};

export const getMySellerProfile = async (): Promise<SellerProfile> => {
  const response = await apiClient.get<SellerProfile>('/seller/profile');
  return response.data;
};

export const updateMySellerProfile = async (data: ApplySellerRequest): Promise<SellerProfile> => {
  const response = await apiClient.put<SellerProfile>('/seller/profile', data);
  return response.data;
};

export const getPublicSellerProfile = async (sellerId: number): Promise<PublicSellerProfile> => {
  const response = await apiClient.get<PublicSellerProfile>(`/seller/profile/${sellerId}`);
  return response.data;
};

export const getPublicSellers = async (
  search?: string,
  page = 1,
  pageSize = 10
): Promise<PublicSellerListResponse> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());

  const response = await apiClient.get<PublicSellerListResponse>(`/seller/public-list?${params.toString()}`);
  return response.data;
};

// Documents Endpoints
export const uploadKYCDocument = async (
  documentType: string,
  file: File
): Promise<SellerDocument> => {
  const formData = new FormData();
  formData.append('documentType', documentType);
  formData.append('file', file);

  const response = await apiClient.post<SellerDocument>('/seller/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getMyKYCDocuments = async (): Promise<SellerDocument[]> => {
  const response = await apiClient.get<SellerDocument[]>('/seller/documents');
  return response.data;
};
