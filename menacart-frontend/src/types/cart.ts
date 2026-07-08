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
