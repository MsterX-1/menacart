import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  placeOrder,
  getOrderById,
  getMyOrders,
  cancelOrder,
  getCouponByCode,
  getLoyaltyBalance,
  payForOrder,
  applyCouponToOrder,
} from '../api/orderApi';
import type { CreateOrderRequest } from '../../../types/order';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => ['orders', 'list'] as const,
  list: (page: number, pageSize: number) => ['orders', 'list', { page, pageSize }] as const,
  details: () => ['orders', 'detail'] as const,
  detail: (id: number) => ['orders', 'detail', id] as const,
  loyalty: () => ['orders', 'loyalty'] as const,
};

export const useMyOrders = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: orderKeys.list(page, pageSize),
    queryFn: () => getMyOrders(page, pageSize),
  });
};

export const useOrderDetails = (orderId: number) => {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId && !isNaN(orderId),
  });
};

export const usePlaceOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => placeOrder(data),
    onSuccess: () => {
      // Invalidate cart queries since ordering clears/modifies cart
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => cancelOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
};

export const usePayForOrder = () => {
  return useMutation({
    mutationFn: (orderId: number) => payForOrder(orderId),
    onSuccess: (data) => {
      window.location.href = data.paymentUrl;
    },
  });
};

export const useApplyCouponToOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, couponCode }: { orderId: number; couponCode: string }) => applyCouponToOrder(orderId, couponCode),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
};

export const useCoupon = (code: string, enabled = false) => {
  return useQuery({
    queryKey: ['coupons', code],
    queryFn: () => getCouponByCode(code),
    enabled: enabled && !!code,
    retry: false, // Don't retry on coupon validation failure (404/400)
  });
};

export const useLoyalty = () => {
  return useQuery({
    queryKey: orderKeys.loyalty(),
    queryFn: getLoyaltyBalance,
  });
};
