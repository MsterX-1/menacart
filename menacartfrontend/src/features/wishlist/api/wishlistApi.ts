import { apiClient } from '../../../api/client';
import type { WishlistItem } from '../../../types/wishlist';

export const getWishlist = async (): Promise<WishlistItem[]> => {
  const response = await apiClient.get<WishlistItem[]>('/wishlists', {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
  return response.data;
};

export const addToWishlist = async (variantId: number): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/wishlists', { variantId });
  return response.data;
};

export const removeFromWishlist = async (variantId: number): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/wishlists/${variantId}`);
  return response.data;
};

export const checkWishlistStatus = async (variantId: number): Promise<boolean> => {
  const response = await apiClient.get<{ isInWishlist: boolean }>(`/wishlists/check/${variantId}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
  return response.data.isInWishlist;
};
