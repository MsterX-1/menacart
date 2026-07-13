import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWishlist, addToWishlist, removeFromWishlist, checkWishlistStatus } from '../api/wishlistApi';
import type { WishlistItem } from '../../../types/wishlist';

export const wishlistKeys = {
  all: ['wishlist'] as const,
  status: (variantId: number) => ['wishlist', 'status', variantId] as const,
};

export const useWishlist = (enabled = true) => {
  return useQuery({
    queryKey: wishlistKeys.all,
    queryFn: getWishlist,
    enabled,
  });
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addToWishlist,
    onSuccess: async (_, variantId) => {
      // Invalidate and wait for the refetch to complete so the UI gets the new data immediately
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.all, refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.status(variantId), refetchType: 'all' });
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: async (_, variantId) => {
      // Invalidate and wait for the refetch to complete so the UI gets the new data immediately
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.all, refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.status(variantId), refetchType: 'all' });
    },
  });
};

export const useWishlistStatus = (variantId: number, enabled = true) => {
  return useQuery({
    queryKey: wishlistKeys.status(variantId),
    queryFn: () => checkWishlistStatus(variantId),
    enabled: enabled && !!variantId,
  });
};
