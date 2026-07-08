import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  applyAsSeller,
  getMySellerProfile,
  updateMySellerProfile,
  uploadKYCDocument,
  getMyKYCDocuments,
} from '../api/sellerOnboardingApi';
import type { ApplySellerRequest } from '../../../types/seller';

export const sellerOnboardingKeys = {
  all: ['seller-onboarding'] as const,
  profile: () => ['seller-onboarding', 'profile'] as const,
  documents: () => ['seller-onboarding', 'documents'] as const,
};

export const useMySellerProfile = () => {
  return useQuery({
    queryKey: sellerOnboardingKeys.profile(),
    queryFn: getMySellerProfile,
    retry: false, // If no profile exists, it might return 404 which is fine (means not applied yet)
  });
};

export const useApplyAsSeller = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplySellerRequest) => applyAsSeller(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerOnboardingKeys.profile() });
      queryClient.invalidateQueries({ queryKey: ['auth'] }); // Invalidate auth to reload user roles
    },
  });
};

export const useUpdateSellerProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplySellerRequest) => updateMySellerProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerOnboardingKeys.profile() });
    },
  });
};

export const useMyKYCDocuments = () => {
  return useQuery({
    queryKey: sellerOnboardingKeys.documents(),
    queryFn: getMyKYCDocuments,
  });
};

export const useUploadKYCDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentType, file }: { documentType: string; file: File }) =>
      uploadKYCDocument(documentType, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerOnboardingKeys.documents() });
    },
  });
};
