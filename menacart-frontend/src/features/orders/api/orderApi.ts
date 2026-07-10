import { apiClient } from '../../../api/client';
import type { Order, CreateOrderRequest, SubOrder, UpdateSubOrderStatusRequest } from '../../../types/order';
import type { Coupon } from '../../../types/coupon';
import type { Loyalty } from '../../../types/loyalty';

// Buyer endpoints
export const placeOrder = async (data: CreateOrderRequest): Promise<Order> => {
  const response = await apiClient.post<Order>('/orders', data);
  return response.data;
};

export const getOrderById = async (orderId: number): Promise<Order> => {
  const response = await apiClient.get<Order>(`/orders/${orderId}`);
  return response.data;
};

export const verifyPayment = async (orderId: number, sessionId: string): Promise<void> => {
  await apiClient.post(`/orders/${orderId}/verify-payment`, null, {
    params: { sessionId }
  });
};

export const getMyOrders = async (page = 1, pageSize = 20): Promise<Order[]> => {
  const response = await apiClient.get<Order[]>('/orders/myOrders', {
    params: { page, pageSize },
  });
  return response.data;
};

export const cancelOrder = async (orderId: number): Promise<void> => {
  await apiClient.delete(`/orders/${orderId}/cancel`);
};

export const payForOrder = async (orderId: number): Promise<{ paymentUrl: string }> => {
  const response = await apiClient.post<{ paymentUrl: string }>(`/orders/${orderId}/pay`);
  return response.data;
};

export const applyCouponToOrder = async (orderId: number, couponCode: string): Promise<void> => {
  await apiClient.post(`/orders/${orderId}/apply-coupon`, { couponCode });
};

// Seller endpoints
export const getSellerSubOrders = async (
  status?: string,
  page = 1,
  pageSize = 20
): Promise<SubOrder[]> => {
  const response = await apiClient.get<SubOrder[]>('/seller/suborders', {
    params: { status, page, pageSize },
  });
  return response.data;
};

export const updateSubOrderStatus = async (
  subOrderId: number,
  data: UpdateSubOrderStatusRequest
): Promise<void> => {
  await apiClient.patch(`/seller/suborders/${subOrderId}/status`, data);
};

// Coupons & Loyalty for checkout integration
export const getCouponByCode = async (code: string): Promise<Coupon> => {
  const response = await apiClient.get<Coupon>(`/coupons/${code}`);
  return response.data;
};

export const getLoyaltyBalance = async (): Promise<Loyalty> => {
  const response = await apiClient.get<Loyalty>('/loyalty');
  return response.data;
};
