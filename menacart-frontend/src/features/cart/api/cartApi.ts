import { apiClient } from '../../../api/client';
import type { Cart } from '../../../types/cart';

export const getCart = async (): Promise<Cart> => {
  const response = await apiClient.get<Cart>('/cart');
  return response.data;
};

export const addCartItem = async (variantId: number, quantity: number): Promise<Cart> => {
  const response = await apiClient.post<Cart>('/cart/items', { variantId, quantity });
  return response.data;
};

export const updateCartItem = async (cartItemId: number, quantity: number): Promise<Cart> => {
  const response = await apiClient.put<Cart>(`/cart/items/${cartItemId}`, { quantity });
  return response.data;
};

export const removeCartItem = async (cartItemId: number): Promise<void> => {
  await apiClient.delete(`/cart/items/${cartItemId}`);
};

export const clearCart = async (): Promise<void> => {
  await apiClient.delete('/cart');
};

export const getCheckoutPreview = async (addressId: number): Promise<import('../../../types/cart').CheckoutPreview> => {
  const response = await apiClient.get<import('../../../types/cart').CheckoutPreview>('/cart/checkout-preview', {
    params: { addressId }
  });
  return response.data;
};
