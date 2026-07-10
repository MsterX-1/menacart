import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWishlist, addToWishlist, removeFromWishlist, checkWishlistStatus } from '../api/wishlistApi';

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
    onSuccess: (_, variantId) => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      queryClient.invalidateQueries({ queryKey: wishlistKeys.status(variantId) });
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: (_, variantId) => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      queryClient.invalidateQueries({ queryKey: wishlistKeys.status(variantId) });
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
