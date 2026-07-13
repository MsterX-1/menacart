import { apiClient } from '../../../api/client';
import type { Coupon } from '../../../types/coupon';

export interface CreateCouponRequest {
  code: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: number;
  expiryDate: string;
  usageLimit: number | null;
  minOrderAmount: number | null;
}

export const getAllCoupons = async (): Promise<Coupon[]> => {
  const response = await apiClient.get<Coupon[]>('/admin/coupons');
  return response.data;
};

export const createCoupon = async (data: CreateCouponRequest): Promise<Coupon> => {
  const response = await apiClient.post<Coupon>('/admin/coupons', data);
  return response.data;
};

export const updateCoupon = async (id: number, data: CreateCouponRequest): Promise<Coupon> => {
  const response = await apiClient.put<Coupon>(`/admin/coupons/${id}`, data);
  return response.data;
};

export const deleteCoupon = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/coupons/${id}`);
};
