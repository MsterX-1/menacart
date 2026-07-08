export interface Coupon {
  couponId: number;
  code: string;
  discountType: string;
  discountValue: number;
  expiryDate: string;
  usageLimit: number | null;
  usedCount: number;
  minOrderAmount: number | null;
}
