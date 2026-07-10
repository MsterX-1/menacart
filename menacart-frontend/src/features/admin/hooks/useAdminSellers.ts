import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminGetSellers,
  adminUpdateSellerStatus,
  adminBanSeller,
  adminWarnSeller,
  adminGetSellerDocuments,
  adminReviewSellerDocument,
  adminGetSellerProfile,
  adminUpdateSellerCommission,
} from '../api/adminSellerApi';
import type { UpdateSellerStatusRequest, ReviewSellerDocumentRequest } from '../../../types/seller';

export const adminSellerKeys = {
  all: ['admin-sellers'] as const,
  lists: () => ['admin-sellers', 'list'] as const,
  list: (status: string | null | undefined, page: number, pageSize: number) =>
    ['admin-sellers', 'list', { status, page, pageSize }] as const,
  profile: (sellerId: number) => ['admin-sellers', 'profile', sellerId] as const,
  documents: (sellerId: number) => ['admin-sellers', 'documents', sellerId] as const,
};

export const useAdminSellers = (status?: string | null, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: adminSellerKeys.list(status, page, pageSize),
    queryFn: () => adminGetSellers(status, page, pageSize),
  });
};

export const useAdminUpdateSellerStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sellerId, data }: { sellerId: number; data: UpdateSellerStatusRequest }) =>
      adminUpdateSellerStatus(sellerId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminSellerKeys.all });
      queryClient.invalidateQueries({ queryKey: adminSellerKeys.profile(variables.sellerId) });
    },
  });
};

export const useAdminBanSeller = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sellerId, reason }: { sellerId: number; reason: string }) =>
      adminBanSeller(sellerId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminSellerKeys.all });
    },
  });
};

export const useAdminWarnSeller = () => {
  return useMutation({
    mutationFn: ({ sellerId, warningMessage }: { sellerId: number; warningMessage: string }) =>
      adminWarnSeller(sellerId, warningMessage),
  });
};

export const useAdminSellerDocuments = (sellerId: number) => {
  return useQuery({
    queryKey: adminSellerKeys.documents(sellerId),
    queryFn: () => adminGetSellerDocuments(sellerId),
    enabled: !!sellerId && !isNaN(sellerId),
  });
};

export const useAdminReviewSellerDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      documentId: number;
      sellerId: number;
      data: ReviewSellerDocumentRequest;
    }) => adminReviewSellerDocument(variables.documentId, variables.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminSellerKeys.documents(variables.sellerId) });
    },
  });
};

export const useAdminSellerProfile = (sellerId: number) => {
  return useQuery({
    queryKey: adminSellerKeys.profile(sellerId),
    queryFn: () => adminGetSellerProfile(sellerId),
    enabled: !!sellerId && !isNaN(sellerId),
  });
};

export const useAdminUpdateSellerCommission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sellerId, commissionRate }: { sellerId: number; commissionRate: number | null }) =>
      adminUpdateSellerCommission(sellerId, commissionRate),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminSellerKeys.all });
      queryClient.invalidateQueries({ queryKey: adminSellerKeys.profile(variables.sellerId) });
    },
  });
};
