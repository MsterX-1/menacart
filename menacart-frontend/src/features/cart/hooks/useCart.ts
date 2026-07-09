import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, addCartItem, updateCartItem, removeCartItem, clearCart, getCheckoutPreview } from '../api/cartApi';

export const cartKeys = {
  all: ['cart'] as const,
};

export const useCart = (enabled = true) => {
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: getCart,
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
    enabled,
  });
};

export const useAddCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: number; quantity: number }) =>
      addCartItem(variantId, quantity),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.all, updatedCart);
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) =>
      updateCartItem(cartItemId, quantity),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.all, updatedCart);
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartItemId: number) => removeCartItem(cartItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

export const useCheckoutPreview = (addressId: number | null) => {
  return useQuery({
    queryKey: [...cartKeys.all, 'preview', addressId],
    queryFn: () => {
      if (!addressId) throw new Error('Address ID is required');
      return getCheckoutPreview(addressId);
    },
    enabled: !!addressId,
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });
};
