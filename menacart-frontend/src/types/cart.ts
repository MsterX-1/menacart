import type { Address } from './address';

export interface CartItem {
  cartItemId: number;
  variantId: number;
  productId: number;
  productName: string;
  color: string | null;
  size: string | null;
  mainImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stockQuantity: number;
  sellerId: number;
}

export interface Cart {
  cartId: number;
  items: CartItem[];
  grandTotal: number;
  totalItems: number;
  savedAddresses: Address[];
  defaultAddressId: number | null;
  warnings: string[];
}

export interface SellerShippingPreview {
  sellerId: number;
  storeName: string;
  shippingCost: number;
}

export interface CheckoutPreview {
  subtotal: number;
  totalShippingCost: number;
  totalAmount: number;
  loyaltyPointsToCurrencyRate: number;
  sellerShipping: SellerShippingPreview[];
}
