export interface Coupon {
  couponId: number;
  code: string;
  discountType: string;
  discountValue: number;
  expiryDate: string;
  usageLimit: number | null;
  usedCount: number;
  minOrderAmount: number | null;
  sellerId: number | null;
}

export interface CreateCouponRequest {
  code: string;
  discountType: string;
  discountValue: number;
  expiryDate: string;
  usageLimit: number | null;
  minOrderAmount: number | null;
  sellerId?: number | null;
}
