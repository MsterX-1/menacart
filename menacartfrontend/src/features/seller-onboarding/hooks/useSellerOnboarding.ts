import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  applyAsSeller,
  becomeInstantSeller,
  getMySellerProfile,
  updateMySellerProfile,
  uploadKYCDocument,
  getMyKYCDocuments,
  getPublicSellers,
} from '../api/sellerOnboardingApi';
import type { ApplySellerRequest } from '../../../types/seller';

import { useAuth } from '../../../context/AuthContext';

export const sellerOnboardingKeys = {
  all: ['seller-onboarding'] as const,
  profile: (userId: string) => ['seller-onboarding', 'profile', userId] as const,
  documents: (userId: string) => ['seller-onboarding', 'documents', userId] as const,
  publicList: (search?: string, page = 1) => ['seller-onboarding', 'public-list', search, page] as const,
};

export const useMySellerProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: sellerOnboardingKeys.profile(user?.userId || 'anonymous'),
    queryFn: getMySellerProfile,
    retry: false,
    enabled: !!user,
  });
};

export const useApplyAsSeller = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: ApplySellerRequest) => applyAsSeller(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerOnboardingKeys.profile(user?.userId || 'anonymous') });
      queryClient.invalidateQueries({ queryKey: ['auth'] }); // Invalidate auth to reload user roles
    },
  });
};

export const useBecomeInstantSeller = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: () => becomeInstantSeller(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerOnboardingKeys.profile(user?.userId || 'anonymous') });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      // Since silent refresh is done on window reload, we can just reload the page to get the new role immediately.
      window.location.reload();
    },
  });
};

export const useUpdateSellerProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: ApplySellerRequest) => updateMySellerProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerOnboardingKeys.profile(user?.userId || 'anonymous') });
    },
  });
};

export const useMyKYCDocuments = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: sellerOnboardingKeys.documents(user?.userId || 'anonymous'),
    queryFn: getMyKYCDocuments,
    enabled: !!user,
  });
};

export const useUploadKYCDocument = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ documentType, file }: { documentType: string; file: File }) =>
      uploadKYCDocument(documentType, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerOnboardingKeys.documents(user?.userId || 'anonymous') });
    },
  });
};

export const usePublicSellers = (search?: string, page = 1, pageSize = 50) => {
  return useQuery({
    queryKey: sellerOnboardingKeys.publicList(search, page),
    queryFn: () => getPublicSellers(search, page, pageSize),
  });
};

